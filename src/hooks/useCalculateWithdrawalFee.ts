import { useSingleCallResult, useSingleContractMultipleData } from '../state/multicall/hooks'
import { useMasterBreederContract } from './useContract'
import { useBlockNumber } from '../state/application/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { Fraction, JSBI } from '@venomswap/sdk'
import { Contract } from '@ethersproject/contracts'

function calculateFee(devFeeStage: BigNumber, divisor: number, multiply = '100'): Fraction | undefined {
  return devFeeStage && !devFeeStage.isZero()
    ? new Fraction(JSBI.BigInt(devFeeStage), JSBI.BigInt(divisor)).multiply(multiply)
    : undefined
}

function useStages(contract: Contract | null, method: string, stages: number[]): BigNumber[] {
  return useSingleContractMultipleData(
    contract,
    method,
    stages.map(item => [item])
  )
    .map(stage => {
      return !stage.loading && stage.result ? stage.result[0] : null
    })
    .filter(stage => {
      return stage != null
    })
}

export default function useCalculateWithdrawalFee(
  pid: number,
  account: string | null | undefined,
  emergency = false
): Record<string, any> {
  let withdrawalFee: Fraction | undefined

  const currentBlock = useBlockNumber()
  const masterBreeder = useMasterBreederContract()

  const userInfo = useSingleCallResult(masterBreeder, 'userInfo', [pid, account ? account : ''])?.result

  const defaultStageIndexes = [0, 1, 2, 3, 4, 5, 6, 7]
  const blockDeltaStartStages = useStages(masterBreeder, 'blockDeltaStartStage', defaultStageIndexes)
  const blockDeltaEndStages = useStages(masterBreeder, 'blockDeltaEndStage', [0, 1, 2, 3, 4, 5])
  const devFeeStages = useStages(masterBreeder, 'devFeeStage', defaultStageIndexes)

  const lastWithdrawBlock: BigNumber = userInfo?.[3]
  const firstDepositBlock: BigNumber = userInfo?.[4]
  const lastDepositBlock: BigNumber = userInfo?.[5]
  // uint256 userBlockDelta = block.number.sub(user.firstDepositBlock);
  // if (user.lastWithdrawBlock > 0) {
  //   userBlockDelta = block.number.sub(user.lastWithdrawBlock);
  // }

  const blockDelta = lastWithdrawBlock.gt('0')
    ? BigNumber.from(currentBlock).sub(lastWithdrawBlock)
    : BigNumber.from(currentBlock).sub(firstDepositBlock)

  if (
    lastWithdrawBlock.eq(BigNumber.from(0)) &&
    firstDepositBlock.eq(BigNumber.from(0)) &&
    blockDelta.eq(BigNumber.from(0)) &&
    lastDepositBlock.eq(BigNumber.from(0))
  ) {
    return { lastActionBlock: undefined, withdrawalFee: undefined }
  }

  let lastActionBlock: BigNumber | undefined = undefined
  let currentBlockDelta: BigNumber = blockDelta

  const currentBlockBigNum = BigNumber.from(currentBlock)

  if (
    currentBlockBigNum &&
    blockDeltaStartStages.length > 0 &&
    blockDeltaEndStages.length > 0 &&
    devFeeStages.length > 0
  ) {
    if (lastWithdrawBlock && lastWithdrawBlock.gt(BigNumber.from(0))) {
      lastActionBlock = lastWithdrawBlock
      currentBlockDelta = currentBlockBigNum.sub(lastWithdrawBlock)
    } else {
      lastActionBlock = firstDepositBlock
      currentBlockDelta = currentBlockBigNum.sub(firstDepositBlock)
    }

    // The code below matches the smart contract implementation
    if (currentBlockDelta.eq(blockDeltaStartStages[0]) || currentBlockDelta.eq(currentBlockBigNum) || emergency) {
      //25% fee for withdrawals of LP tokens in the same block this is to prevent abuse from flashloans
      withdrawalFee = calculateFee(devFeeStages[0], 100)
    } else if (currentBlockDelta.gte(blockDeltaStartStages[1]) && currentBlockDelta.lte(blockDeltaEndStages[0])) {
      //8% fee if a user deposits and withdraws in between same block and 59 minutes.
      withdrawalFee = calculateFee(devFeeStages[1], 100)
    } else if (currentBlockDelta.gte(blockDeltaStartStages[2]) && currentBlockDelta.lte(blockDeltaEndStages[1])) {
      //4% fee if a user deposits and withdraws after 1 hour but before 1 day.
      withdrawalFee = calculateFee(devFeeStages[2], 100)
    } else if (currentBlockDelta.gte(blockDeltaStartStages[3]) && currentBlockDelta.lte(blockDeltaEndStages[2])) {
      //2% fee if a user deposits and withdraws between after 1 day but before 3 days.
      withdrawalFee = calculateFee(devFeeStages[3], 100)
    } else if (currentBlockDelta.gte(blockDeltaStartStages[4]) && currentBlockDelta.lte(blockDeltaEndStages[3])) {
      //1% fee if a user deposits and withdraws after 3 days but before 5 days.
      withdrawalFee = calculateFee(devFeeStages[4], 100)
    } else if (currentBlockDelta.gte(blockDeltaStartStages[5]) && currentBlockDelta.lte(blockDeltaEndStages[4])) {
      //0.5% fee if a user deposits and withdraws if the user withdraws after 5 days but before 2 weeks.
      withdrawalFee = calculateFee(devFeeStages[5], 1000)
    } else if (currentBlockDelta.gte(blockDeltaStartStages[6]) && currentBlockDelta.lte(blockDeltaEndStages[5])) {
      //0.25% fee if a user deposits and withdraws after 2 weeks.
      withdrawalFee = calculateFee(devFeeStages[6], 10000)
    } else if (currentBlockDelta.gt(blockDeltaStartStages[7])) {
      //0.1% fee if a user deposits and withdraws after 4 weeks.
      //Note: it's actually 0.01% and not 0.1%
      withdrawalFee = calculateFee(devFeeStages[7], 10000)
    }
  }

  return { lastActionBlock, withdrawalFee }
}

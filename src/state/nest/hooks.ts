import React, { useState } from 'react'
import { CurrencyAmount, JSBI, Token, TokenAmount, Pair } from '@venomswap/sdk'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'
import { useMasterNestContract } from '../../hooks/useContract'
import { useMultipleContractSingleData } from '../multicall/hooks'
import { ethers } from 'ethers'
import NEST_POOL_ABI from '../../constants/abis/nest-pool.json'
import NEST_TOKEN_ABI from '../../constants/abis/nest-token.json'
import usePrevious from '../../hooks/usePrevious'
import { useBlockNumber } from '../application/hooks'

const POOL_INTERFACE = new Interface(NEST_POOL_ABI)
const TOKEN_INTERFACE = new Interface(NEST_TOKEN_ABI)
export interface PoolInterface {
  pid: any // string?
  amount: any // bn
  rewardDebt: any // bn
  stakedToken: any
  rewardToken: any
  rewardPerBlock: any // bb
  limitPerUser: any // bn
  startBlock: any // bn
  bonusEndBlock: any // bn
  lastRewardBlock: any // bn
  sTokenSymbol?: any // string
  rTokenSymbol?: any // string
  sBalanceOf?: any // bn
  rBalanceOf?: any // bn
  contractStakedBalance?: any // bn
}

export function useNestInfo(active: boolean | undefined = undefined, pairToFilterBy?: Pair | null): any {
  const { account } = useActiveWeb3React()
  const masterNestContract = useMasterNestContract()
  const [nestPools, setNestPool] = useState<any>([])
  const [pools, setPools] = useState<any>([])
  const [nestPoolsExtra, setNestPoolExtra] = useState<any>([])
  const [tokensAdrs, setTokensAdrs] = useState<any>({})
  React.useEffect(() => {
    async function getNestList() {
      const res: any = await masterNestContract?.queryFilter(
        {
          address: masterNestContract?.address,
          topics: [ethers.utils.id('NewSmartChefContract(address)')]
          // topics: [ethers.utils.id('deployPool(address,address,uint256,uint256,uint256,uint256,address)')]
        },
        12023400, // TODO change block
        12023500 // TODO change block
      )

      const nestList = res.map((i: any) => i?.args?.[0]) ?? []
      setNestPool(nestList) // nestList[address]
    }

    getNestList()
  }, [])
  const poolsUserInfos = useMultipleContractSingleData(nestPools, POOL_INTERFACE, 'userInfo', [account ?? undefined])
  const poolsRewardToken = useMultipleContractSingleData(nestPools, POOL_INTERFACE, 'rewardToken')
  const poolsStakedToken = useMultipleContractSingleData(nestPools, POOL_INTERFACE, 'stakedToken')
  const poolsRewardPerBlock = useMultipleContractSingleData(nestPools, POOL_INTERFACE, 'rewardPerBlock')
  const poolsLimitPerUser = useMultipleContractSingleData(nestPools, POOL_INTERFACE, 'poolLimitPerUser')
  const poolsStartBlock = useMultipleContractSingleData(nestPools, POOL_INTERFACE, 'startBlock')
  const poolsBonusEndBlock = useMultipleContractSingleData(nestPools, POOL_INTERFACE, 'bonusEndBlock')
  const poolsLastRewardBlock = useMultipleContractSingleData(nestPools, POOL_INTERFACE, 'lastRewardBlock')

  React.useMemo(() => {
    const pools = nestPools.reduce((ps: any, pid: string, i: number): PoolInterface | undefined => {
      if (
        poolsUserInfos &&
        poolsUserInfos[i] &&
        !poolsUserInfos[i].error &&
        !poolsUserInfos[i].loading &&
        poolsUserInfos[i]?.result?.amount &&
        poolsUserInfos[i]?.result?.rewardDebt &&
        poolsStakedToken &&
        poolsStakedToken[i] &&
        !poolsStakedToken[i].error &&
        !poolsStakedToken[i].loading &&
        poolsStakedToken[i]?.result?.[0] &&
        poolsStakedToken[i]?.result?.[0] &&
        poolsRewardToken &&
        poolsRewardToken[i] &&
        !poolsRewardToken[i].error &&
        !poolsRewardToken[i].loading &&
        poolsRewardToken[i]?.result?.[0] &&
        poolsRewardToken[i]?.result?.[0] &&
        poolsLimitPerUser &&
        poolsLimitPerUser[i] &&
        !poolsLimitPerUser[i].error &&
        !poolsLimitPerUser[i].loading &&
        poolsLimitPerUser[i]?.result?.[0] &&
        poolsLimitPerUser[i]?.result?.[0] &&
        poolsStartBlock &&
        poolsStartBlock[i] &&
        !poolsStartBlock[i].error &&
        !poolsStartBlock[i].loading &&
        poolsStartBlock[i]?.result?.[0] &&
        poolsStartBlock[i]?.result?.[0] &&
        poolsBonusEndBlock &&
        poolsBonusEndBlock[i] &&
        !poolsBonusEndBlock[i].error &&
        !poolsBonusEndBlock[i].loading &&
        poolsBonusEndBlock[i]?.result?.[0] &&
        poolsBonusEndBlock[i]?.result?.[0] &&
        poolsLastRewardBlock &&
        poolsLastRewardBlock[i] &&
        !poolsLastRewardBlock[i].error &&
        !poolsLastRewardBlock[i].loading &&
        poolsLastRewardBlock[i]?.result?.[0] &&
        poolsLastRewardBlock[i]?.result?.[0]
      ) {
        // const amount = JSBI.BigInt(poolsUserInfos?.[i]?.result?.amount)
        // console.log('JSBI.BigInt amount: ', amount)
        // if (poolsUserInfos?.[i]?.result?.amount) {
        //   console.log('JSBI.BigInt amount: ', poolsUserInfos?.[i]?.result?.amount)
        //   console.log('JSBI.BigInt amount: ', JSBI.BigInt(poolsUserInfos?.[i]?.result?.amount ?? 0))
        // }

        const poolInfo = {
          pid: pid,
          amount: poolsUserInfos?.[i]?.result?.amount ?? 0, // bn
          rewardDebt: poolsUserInfos?.[i]?.result?.rewardDebt ?? 0, // bn
          stakedToken: poolsStakedToken[i].result?.[0], // adr
          rewardToken: poolsRewardToken[i].result?.[0], // adr
          rewardPerBlock: poolsRewardPerBlock[i].result?.[0] ?? 0, // bn
          limitPerUser: poolsLimitPerUser[i].result?.[0] ?? 0, // bn
          startBlock: poolsStartBlock[i].result?.[0] ?? 0, // bn
          bonusEndBlock: poolsBonusEndBlock[i].result?.[0] ?? 0, // bn
          lastRewardBlock: poolsLastRewardBlock[i].result?.[0] ?? 0 // bn
        }

        ps.push(poolInfo)

        if (poolInfo.stakedToken && poolInfo.rewardToken) {
          if (!tokensAdrs[poolInfo.stakedToken])
            setTokensAdrs({ ...tokensAdrs, [poolInfo.stakedToken]: poolInfo.stakedToken })
          if (!tokensAdrs[poolInfo.rewardToken])
            setTokensAdrs({ ...tokensAdrs, [poolInfo.rewardToken]: poolInfo.rewardToken })
        }
      }

      return ps
    }, [])

    setPools(pools)
  }, [
    nestPools,
    poolsUserInfos,
    poolsStakedToken,
    poolsRewardToken,
    poolsLimitPerUser,
    poolsRewardPerBlock,
    poolsStartBlock,
    poolsBonusEndBlock,
    poolsLastRewardBlock,
    tokensAdrs,
    setTokensAdrs
  ])

  const tokensAdrsArr = React.useMemo(() => Object.keys(tokensAdrs), [tokensAdrs])
  const tokensSymbols = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'symbol')
  const tokensBalanceOf = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'balanceOf', [
    account ?? undefined
  ])

  React.useEffect(() => {
    const poolsExtraInfo = pools.reduce((acc: any, p: PoolInterface): PoolInterface => {
      const stakedTokenInd = tokensAdrsArr.findIndex(adr => p.stakedToken === adr)
      const rewardTokenInd = tokensAdrsArr.findIndex(adr => p.rewardToken === adr)

      if (
        tokensSymbols &&
        tokensSymbols[stakedTokenInd] &&
        !tokensSymbols[stakedTokenInd].error &&
        !tokensSymbols[stakedTokenInd].loading &&
        tokensSymbols[stakedTokenInd]?.result?.[0] &&
        tokensSymbols[rewardTokenInd] &&
        !tokensSymbols[rewardTokenInd].error &&
        !tokensSymbols[rewardTokenInd].loading &&
        tokensSymbols[rewardTokenInd]?.result?.[0] &&
        tokensBalanceOf &&
        tokensBalanceOf[stakedTokenInd] &&
        !tokensBalanceOf[stakedTokenInd].error &&
        !tokensBalanceOf[stakedTokenInd].loading &&
        tokensBalanceOf[stakedTokenInd]?.result?.[0]
      ) {
        acc.push({
          ...p,
          sTokenSymbol: tokensSymbols[stakedTokenInd]?.result?.[0],
          rTokenSymbol: tokensSymbols[rewardTokenInd]?.result?.[0],
          sBalanceOf: tokensBalanceOf[stakedTokenInd]?.result?.[0],
          rBalanceOf: tokensBalanceOf[rewardTokenInd]?.result?.[0]
        })
      }

      return acc
    }, [])

    setNestPoolExtra(poolsExtraInfo)
  }, [pools, tokensAdrsArr, tokensSymbols, tokensBalanceOf])

  // TODO rewards end in
  // TODO reward per block
  // TODO APR/APY
  // TODO Total Deposited

  return {
    nestPoolsExtra
  }
}

const DEFAULT_POOL = {
  pid: '', // string?
  amount: ethers.BigNumber.from(0), // bn
  rewardDebt: ethers.BigNumber.from(0), // bn
  stakedToken: '',
  rewardToken: '',
  rewardPerBlock: ethers.BigNumber.from(0), // bb
  limitPerUser: ethers.BigNumber.from(0), // bn
  startBlock: ethers.BigNumber.from(0), // bn
  bonusEndBlock: ethers.BigNumber.from(0), // bn
  lastRewardBlock: ethers.BigNumber.from(0), // bn
  sTokenSymbol: '', // string
  rTokenSymbol: '', // string
  sBalanceOf: ethers.BigNumber.from(0), // bn
  rBalanceOf: ethers.BigNumber.from(0), // bn
  contractStakedBalance: ethers.BigNumber.from(0) // bn
}

export function useNestInfoSingle(address: string): any {
  const { account } = useActiveWeb3React()
  // const lastBlockNumber = useBlockNumber()
  const [pool, setPool] = useState({ ...DEFAULT_POOL })
  const prevPool = usePrevious(pool) ?? undefined
  const [nestPool, setNestPool] = useState({ ...DEFAULT_POOL })
  const prevNestPool = usePrevious(nestPool) ?? undefined
  const poolUserInfos = useMultipleContractSingleData([address], POOL_INTERFACE, 'userInfo', [account ?? undefined])
  const poolRewardToken = useMultipleContractSingleData([address], POOL_INTERFACE, 'rewardToken')
  const poolStakedToken = useMultipleContractSingleData([address], POOL_INTERFACE, 'stakedToken')
  const poolRewardPerBlock = useMultipleContractSingleData([address], POOL_INTERFACE, 'rewardPerBlock')
  const poolLimitPerUser = useMultipleContractSingleData([address], POOL_INTERFACE, 'poolLimitPerUser')
  const poolStartBlock = useMultipleContractSingleData([address], POOL_INTERFACE, 'startBlock')
  const poolBonusEndBlock = useMultipleContractSingleData([address], POOL_INTERFACE, 'bonusEndBlock')
  const poolLastRewardBlock = useMultipleContractSingleData([address], POOL_INTERFACE, 'lastRewardBlock')

  React.useEffect(() => {
    if (
      poolUserInfos &&
      !poolUserInfos[0].error &&
      !poolUserInfos[0].loading &&
      poolUserInfos[0]?.result?.amount &&
      poolUserInfos[0]?.result?.rewardDebt &&
      poolStakedToken &&
      poolStakedToken[0] &&
      !poolStakedToken[0].error &&
      !poolStakedToken[0].loading &&
      poolStakedToken[0]?.result?.[0] &&
      poolStakedToken[0]?.result?.[0] &&
      poolRewardToken &&
      poolRewardToken[0] &&
      !poolRewardToken[0].error &&
      !poolRewardToken[0].loading &&
      poolRewardToken[0]?.result?.[0] &&
      poolRewardToken[0]?.result?.[0] &&
      poolLimitPerUser &&
      poolLimitPerUser[0] &&
      !poolLimitPerUser[0].error &&
      !poolLimitPerUser[0].loading &&
      poolLimitPerUser[0]?.result?.[0] &&
      poolLimitPerUser[0]?.result?.[0] &&
      poolStartBlock &&
      poolStartBlock[0] &&
      !poolStartBlock[0].error &&
      !poolStartBlock[0].loading &&
      poolStartBlock[0]?.result?.[0] &&
      poolStartBlock[0]?.result?.[0] &&
      poolBonusEndBlock &&
      poolBonusEndBlock[0] &&
      !poolBonusEndBlock[0].error &&
      !poolBonusEndBlock[0].loading &&
      poolBonusEndBlock[0]?.result?.[0] &&
      poolBonusEndBlock[0]?.result?.[0] &&
      poolLastRewardBlock &&
      poolLastRewardBlock[0] &&
      !poolLastRewardBlock[0].error &&
      !poolLastRewardBlock[0].loading &&
      poolLastRewardBlock[0]?.result?.[0] &&
      poolLastRewardBlock[0]?.result?.[0]
    ) {
      // const amount = JSBI.BigInt(poolsUserInfos?.[i]?.result?.amount)
      // console.log('JSBI.BigInt amount: ', amount)
      // if (poolsUserInfos?.[i]?.result?.amount) {
      //   console.log('JSBI.BigInt amount: ', poolsUserInfos?.[i]?.result?.amount)
      //   console.log('JSBI.BigInt amount: ', JSBI.BigInt(poolsUserInfos?.[i]?.result?.amount ?? 0))
      // }

      const newPool = {
        ...pool,
        pid: address,
        amount: poolUserInfos?.[0]?.result?.amount ?? 0, // bn
        rewardDebt: poolUserInfos?.[0]?.result?.rewardDebt ?? 0, // bn
        stakedToken: poolStakedToken[0].result?.[0], // adr
        rewardToken: poolRewardToken[0].result?.[0], // adr
        rewardPerBlock: poolRewardPerBlock[0].result?.[0] ?? 0, // bn
        limitPerUser: poolLimitPerUser[0].result?.[0] ?? 0, // bn
        startBlock: poolStartBlock[0].result?.[0] ?? 0, // bn
        bonusEndBlock: poolBonusEndBlock[0].result?.[0] ?? 0, // bn
        lastRewardBlock: poolLastRewardBlock[0].result?.[0] ?? 0 // bn
      }

      if (JSON.stringify(newPool) !== JSON.stringify(prevPool)) {
        setPool(newPool)
      }
    }
  }, [
    poolUserInfos,
    poolStakedToken,
    poolRewardToken,
    poolLimitPerUser,
    poolRewardPerBlock,
    poolStartBlock,
    poolBonusEndBlock,
    poolLastRewardBlock,
    address,
    pool,
    prevPool
  ])

  const tokensAdrsArr = React.useMemo(() => [pool.stakedToken, pool.rewardToken], [pool])
  const tokensSymbols = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'symbol')
  const tokensBalanceOf = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'balanceOf', [
    account ?? undefined
  ])
  const contractStakedBalance = useMultipleContractSingleData([tokensAdrsArr[0]], TOKEN_INTERFACE, 'balanceOf', [
    address ?? undefined
  ])

  React.useEffect(() => {
    if (
      tokensSymbols &&
      tokensSymbols[0] &&
      !tokensSymbols[0].error &&
      !tokensSymbols[0].loading &&
      tokensSymbols[0]?.result?.[0] &&
      tokensSymbols[1] &&
      !tokensSymbols[1].error &&
      !tokensSymbols[1].loading &&
      tokensSymbols[1]?.result?.[0] &&
      tokensBalanceOf &&
      tokensBalanceOf[0] &&
      !tokensBalanceOf[0].error &&
      !tokensBalanceOf[0].loading &&
      tokensBalanceOf[0]?.result?.[0] &&
      contractStakedBalance &&
      contractStakedBalance[0] &&
      !contractStakedBalance[0].error &&
      !contractStakedBalance[0].loading &&
      contractStakedBalance[0]?.result?.[0]
    ) {
      const newNestPool = {
        ...pool,
        sTokenSymbol: tokensSymbols[0]?.result?.[0],
        rTokenSymbol: tokensSymbols[1]?.result?.[0],
        sBalanceOf: tokensBalanceOf[0]?.result?.[0],
        rBalanceOf: tokensBalanceOf[1]?.result?.[0],
        contractStakedBalance: contractStakedBalance[0]?.result?.[0]
      }

      if (JSON.stringify(newNestPool) !== JSON.stringify(prevNestPool)) {
        setNestPool(newNestPool)
      }
    }
  }, [pool, prevNestPool, tokensSymbols, tokensBalanceOf])

  // TODO rewards end in
  // TODO reward per block
  // TODO APR/APY
  // TODO Total Deposited

  return nestPool
}

// export function useTotalGovTokensEarned(): TokenAmount | undefined {
//   const govToken = useGovernanceToken()
//   const nestInfos = useNestInfo(true)
//
//   return useMemo(() => {
//     if (!govToken) return undefined
//     return (
//       nestInfos?.reduce(
//         (accumulator, nestInfo) => accumulator.add(nestInfo.earnedAmount),
//         new TokenAmount(govToken, '0')
//       ) ?? new TokenAmount(govToken, '0')
//     )
//   }, [nestInfos, govToken])
// }

// export function useTotalLockedGovTokensEarned(): TokenAmount | undefined {
//   const govToken = useGovernanceToken()
//   const stakingInfos = useNestInfo(true)
//
//   return useMemo(() => {
//     if (!govToken) return undefined
//     return (
//       stakingInfos?.reduce(
//         (accumulator, nestInfo) => accumulator.add(nestInfo.lockedEarnedAmount),
//         new TokenAmount(govToken, '0')
//       ) ?? new TokenAmount(govToken, '0')
//     )
//   }, [stakingInfos, govToken])
// }

// export function useTotalUnlockedGovTokensEarned(): TokenAmount | undefined {
//   const govToken = useGovernanceToken()
//   const nestInfos = useNestInfo(true)
//
//   return useMemo(() => {
//     if (!govToken) return undefined
//     return (
//       nestInfos?.reduce(
//         (accumulator, nestInfo) => accumulator.add(nestInfo.unlockedEarnedAmount),
//         new TokenAmount(govToken, '0')
//       ) ?? new TokenAmount(govToken, '0')
//     )
//   }, [nestInfos, govToken])
// }

// based on typed value
export function useDerivedStakeInfo(
  typedValue: string,
  stakingToken: Token,
  userLiquidityUnstaked: TokenAmount | undefined
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingToken)

  const parsedAmount =
    parsedInput && userLiquidityUnstaked && JSBI.lessThanOrEqual(parsedInput.raw, userLiquidityUnstaked.raw)
      ? parsedInput
      : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}

// based on typed value
export function useDerivedUnstakeInfo(
  typedValue: string,
  stakingAmount: TokenAmount | undefined
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = stakingAmount
    ? tryParseAmount(typedValue, stakingAmount.token)
    : undefined

  const parsedAmount =
    parsedInput && stakingAmount && JSBI.lessThanOrEqual(parsedInput.raw, stakingAmount.raw) ? parsedInput : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}

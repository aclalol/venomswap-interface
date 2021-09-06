import React, { useState } from 'react'
import { abi as IUniswapV2PairABI } from '@venomswap/core/build/IUniswapV2Pair.json'
import { CurrencyAmount, JSBI, Token, TokenAmount, ChainId, Fraction } from '@venomswap/sdk'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'
import { useMasterBreederContract, useMasterNestContract } from '../../hooks/useContract'
import { useMultipleContractSingleData } from '../multicall/hooks'
import { ethers } from 'ethers'
import NEST_POOL_ABI from '../../constants/abis/nest-pool.json'
import NEST_TOKEN_ABI from '../../constants/abis/nest-token.json'
import usePrevious from '../../hooks/usePrevious'
import { ZERO_ADDRESS } from '../../constants'
import calculateApr from '../../utils/calculateApr'
import calculateWethAdjustedTotalStakedAmount from '../../utils/calculateWethAdjustedTotalStakedAmount'
import determineBaseToken from '../../utils/determineBaseToken'
import useTokensWithWethPrices from '../../hooks/useTokensWithWETHPrices'
import { getPairInstance } from '../../utils'
import getBlocksPerYear from '../../utils/getBlocksPerYear'
import { validNestPoolInfo, validExtraNestPoolInfo } from '../../utils/validNestPoolInfo'
// import getBlocksPerYear from '../../utils/getBlocksPerYear'
// import calculateApr from '../../utils/calculateApr'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

const POOL_INTERFACE = new Interface(NEST_POOL_ABI)
const TOKEN_INTERFACE = new Interface(NEST_TOKEN_ABI)

const DEFAULT_BN = JSBI.BigInt(0)
const DEFAULT_TOKEN = new Token(ChainId.BSC_MAINNET, ZERO_ADDRESS, 18, 'HEPA', 'Hepa')
const DEFAULT_AMOUNT = new TokenAmount(DEFAULT_TOKEN, JSBI.BigInt(0))
const NEW_DEFAULT_POOL = {
  poolAddress: ZERO_ADDRESS, // pid -> poolAddress

  startBlock: DEFAULT_BN, // bn
  lastRewardBlock: DEFAULT_BN, // bn
  bonusEndBlock: DEFAULT_BN, // bn

  _sTokenAddress: ZERO_ADDRESS, // string
  _sLimitPerUser: DEFAULT_BN, // staking bn
  _sAmount: DEFAULT_BN, // staking user.amount bn

  _rTokenAddress: ZERO_ADDRESS, // string
  _rPerBlock: DEFAULT_BN, // reward rewardPerBlock
  _rDebt: DEFAULT_BN, // reward user.rewardDebt bn
  _rPending: DEFAULT_BN, // reward pendingReward bn

  // chaindId, _sTokenAddress, _sTokenDecimals, _sTokenSymbol, _sTokenName
  sToken: DEFAULT_TOKEN,
  sAmount: DEFAULT_AMOUNT, // staking BN(user._stakedAmount)
  sLimitPerUser: DEFAULT_AMOUNT, // staking BN(user._limitPerUser)
  sFreeAmount: DEFAULT_AMOUNT, // staking user balance of .balanceOf(sToken)
  sAllAmount: DEFAULT_AMOUNT, // staking pool contract balance of .balanceOf(sToken)

  rToken: DEFAULT_TOKEN, // chaindId, _rTokenAddress, _rTokenDecimals, _rTokenSymbol, _rTokenName
  rPerBlockAmount: DEFAULT_AMOUNT, // reward BN(user._rewardPerBlock)
  rClaimedAmount: DEFAULT_AMOUNT, // reward BN(user._rewardDebt)
  rUnclaimedAmount: DEFAULT_AMOUNT, // reward BN(user._pendingReward)

  isLoad: false
}

export interface PoolInterface {
  poolAddress: string // pid -> poolAddress

  startBlock: JSBI // bn
  lastRewardBlock: JSBI // bn
  bonusEndBlock: JSBI // bn

  _sTokenAddress: string // string
  _sLimitPerUser: JSBI // staking bn
  _sAmount: JSBI // staking user.amount bn

  _rTokenAddress: string // string
  _rPerBlock: JSBI // reward rewardPerBlock
  _rDebt: JSBI // reward user.rewardDebt bn
  _rPending: JSBI // reward pendingReward bn

  sToken: Token // chaindId, _sTokenAddress, _sTokenDecimals, _sTokenSymbol, _sTokenName
  sAmount: TokenAmount // staking BN(user._stakedAmount)
  sLimitPerUser: TokenAmount // staking BN(user._limitPerUser)
  sFreeAmount: TokenAmount // staking user balance of .balanceOf(sToken)
  sAllAmount: TokenAmount // staking pool contract balance of .balanceOf(sToken)

  rToken: Token // chaindId, _rTokenAddress, _rTokenDecimals, _rTokenSymbol, _rTokenName
  rPerBlockAmount: TokenAmount // reward BN(user._rewardPerBlock)
  rClaimedAmount: TokenAmount // reward BN(user._rewardDebt)
  rUnclaimedAmount: TokenAmount // reward BN(user._pendingReward)

  isLoad: boolean
}

export function useNestPoolsAddrsList(): Array<string> {
  const masterNestContract = useMasterNestContract()
  const [poolsAddrs, setPoolsAddrs] = useState<Array<string>>([])
  React.useEffect(() => {
    async function getNestList() {
      // TODO important load all events (from, to)
      // "exceed maximum block range: 5000"
      const res: any = await masterNestContract?.queryFilter(
        {
          address: masterNestContract?.address,
          topics: [ethers.utils.id('NewSmartChefContract(address)')]
        },
        12109559,
        12109559 + 4999
      )
      // console.log('nest res: ', res)
      const addrs = res.map((i: any) => i?.args?.[0]) ?? []
      setPoolsAddrs(addrs)
    }

    getNestList()
  }, [])

  return poolsAddrs
}

function useNestPoolApr(sToken: Token, rToken: Token, rPerBlockAmount: TokenAmount, _rPerBlock: JSBI) {
  const { chainId = 97 } = useActiveWeb3React() // TODO fix it
  const blocksPerYear = getBlocksPerYear(chainId)
  const masterBreederContract = useMasterBreederContract()

  const tokensWithPrices = useTokensWithWethPrices()
  const govToken = tokensWithPrices?.govToken?.token
  const govTokenWETHPrice = tokensWithPrices?.govToken?.price
  const tokensAddreses = [sToken.address, rToken.address]
  const baseToken = determineBaseToken(tokensWithPrices, [sToken, rToken])
  console.info('baseToken: ', baseToken)
  const lpTokenTotalSupplies = useMultipleContractSingleData(tokensAddreses, PAIR_INTERFACE, 'totalSupply')
  const lpTokenReserves = useMultipleContractSingleData(tokensAddreses, PAIR_INTERFACE, 'getReserves')
  const lpTokenBalances = useMultipleContractSingleData(tokensAddreses, PAIR_INTERFACE, 'balanceOf', [
    masterBreederContract?.address
  ])
  console.info(lpTokenTotalSupplies, lpTokenReserves, lpTokenBalances)

  const poolBlockRewards = new TokenAmount(govToken, _rPerBlock)
  const poolShare = new Fraction(poolBlockRewards.raw, rPerBlockAmount.raw)
  console.info('poolBlockRewards: ', poolBlockRewards)
  console.info('poolShare: ', poolShare)
  const dummyPair = getPairInstance(new TokenAmount(sToken, '0'), new TokenAmount(rToken, '0'))
  console.info('dummyPair: ', dummyPair)
  const totalLpTokenSupply = new TokenAmount(
    dummyPair.liquidityToken,
    JSBI.BigInt(lpTokenTotalSupplies[0].result?.[0] ?? 0)
  )
  const totalStakedAmount = new TokenAmount(dummyPair.liquidityToken, JSBI.BigInt(lpTokenBalances[0].result?.[0] ?? 0))
  const lpTokenReserve = lpTokenReserves[0].result

  const totalStakedAmountWETH = calculateWethAdjustedTotalStakedAmount(
    chainId,
    baseToken,
    tokensWithPrices,
    [sToken, rToken],
    totalLpTokenSupply,
    totalStakedAmount,
    lpTokenReserve
  )

  return totalStakedAmountWETH
    ? calculateApr(govTokenWETHPrice, poolBlockRewards, blocksPerYear, poolShare, totalStakedAmountWETH)
    : undefined
}
console.log('useNestPoolApr: ', useNestPoolApr)

export function useSingleNestPool(address: string, defaultPool?: PoolInterface | undefined): PoolInterface {
  const { account, chainId } = useActiveWeb3React()
  const [pool, setPool] = useState(defaultPool ? { ...defaultPool } : { ...NEW_DEFAULT_POOL })
  const prevPool = usePrevious(pool) ?? undefined
  const [nestPool, setNestPool] = useState<PoolInterface>({ ...NEW_DEFAULT_POOL })
  const prevNestPool = usePrevious(nestPool) ?? undefined

  const poolUserInfos = useMultipleContractSingleData([address], POOL_INTERFACE, 'userInfo', [account ?? undefined])
  const poolRewardToken = useMultipleContractSingleData([address], POOL_INTERFACE, 'rewardToken')
  const poolStakedToken = useMultipleContractSingleData([address], POOL_INTERFACE, 'stakedToken')
  const poolRewardPerBlock = useMultipleContractSingleData([address], POOL_INTERFACE, 'rewardPerBlock')
  const poolLimitPerUser = useMultipleContractSingleData([address], POOL_INTERFACE, 'poolLimitPerUser')
  const poolStartBlock = useMultipleContractSingleData([address], POOL_INTERFACE, 'startBlock')
  const poolBonusEndBlock = useMultipleContractSingleData([address], POOL_INTERFACE, 'bonusEndBlock')
  const poolLastRewardBlock = useMultipleContractSingleData([address], POOL_INTERFACE, 'lastRewardBlock')
  const poolPendingReward = useMultipleContractSingleData([address], POOL_INTERFACE, 'pendingReward', [
    account ?? undefined
  ])

  React.useEffect(() => {
    if (
      validNestPoolInfo(
        poolUserInfos,
        poolStakedToken,
        poolRewardToken,
        poolLastRewardBlock,
        poolLimitPerUser,
        poolStartBlock,
        poolBonusEndBlock,
        poolPendingReward
      )
    ) {
      const poolAddress = address

      const startBlock = JSBI.BigInt(poolStartBlock[0].result?.[0].toString())
      const lastRewardBlock = JSBI.BigInt(poolLastRewardBlock[0].result?.[0].toString())
      const bonusEndBlock = JSBI.BigInt(poolBonusEndBlock[0].result?.[0].toString())

      const _sTokenAddress = poolStakedToken[0].result?.[0]
      const _sLimitPerUser = JSBI.BigInt(poolLimitPerUser[0].result?.[0].toString())
      const _sAmount = JSBI.BigInt(poolUserInfos?.[0]?.result?.amount.toString())

      const _rTokenAddress = poolRewardToken[0].result?.[0]
      const _rPerBlock = JSBI.BigInt(poolRewardPerBlock[0].result?.[0].toString())
      const _rDebt = JSBI.BigInt(poolUserInfos?.[0]?.result?.rewardDebt.toString())
      const _rPending = JSBI.BigInt(poolPendingReward[0].result?.[0].toString())

      const newPool = {
        ...pool,
        poolAddress,
        startBlock,
        lastRewardBlock,
        bonusEndBlock,
        _sTokenAddress,
        _sLimitPerUser,
        _sAmount,
        _rTokenAddress,
        _rPerBlock,
        _rDebt,
        _rPending
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

  const tokensAdrsArr = React.useMemo(() => [pool._sTokenAddress, pool._rTokenAddress], [pool])
  const tokensSymbols = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'symbol')
  const tokensDecimals = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'decimals')
  const tokensNames = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'name')
  const tokensBalanceOf = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'balanceOf', [
    account ?? undefined
  ])
  const contractStakedBalance = useMultipleContractSingleData([tokensAdrsArr[0]], TOKEN_INTERFACE, 'balanceOf', [
    address ?? undefined
  ])

  React.useEffect(() => {
    if (validExtraNestPoolInfo(tokensSymbols, tokensDecimals, tokensBalanceOf, tokensNames, contractStakedBalance)) {
      const sTokenDecimals = tokensDecimals[0]?.result?.[0]
      const sTokenSymbol = tokensSymbols[0]?.result?.[0]
      const sTokenName = tokensSymbols[0]?.result?.[0]

      const sBalanceOf = JSBI.BigInt(tokensBalanceOf[0]?.result?.[0])
      const cStakedBalanceOf = JSBI.BigInt(contractStakedBalance[0]?.result?.[0])

      const rTokenDecimals = tokensDecimals[1]?.result?.[0]
      const rTokenSymbol = tokensSymbols[1]?.result?.[0]
      const rTokenName = tokensSymbols[1]?.result?.[0]

      const sToken = new Token(
        chainId ? chainId : ChainId.BSC_TESTNET, // TOOD fix
        pool._sTokenAddress,
        sTokenDecimals,
        sTokenSymbol,
        sTokenName
      )
      const sAmount = new TokenAmount(sToken, pool._sAmount)
      const sLimitPerUser = new TokenAmount(sToken, pool._sLimitPerUser)
      const sFreeAmount = new TokenAmount(sToken, sBalanceOf)
      const sAllAmount = new TokenAmount(sToken, cStakedBalanceOf)

      const rToken = new Token(
        chainId ? chainId : ChainId.BSC_TESTNET, // TOOD fix
        pool._rTokenAddress,
        rTokenDecimals,
        rTokenSymbol,
        rTokenName
      )
      const rPerBlockAmount = new TokenAmount(rToken, pool._rPerBlock)
      const rClaimedAmount = new TokenAmount(rToken, pool._rDebt)
      const rUnclaimedAmount = new TokenAmount(rToken, pool._rPending)

      const newNestPool = {
        ...pool,
        sToken,
        sAmount,
        sLimitPerUser,
        sFreeAmount,
        sAllAmount,
        rToken,
        rPerBlockAmount,
        rClaimedAmount,
        rUnclaimedAmount,
        isLoad: true
      }

      if (JSON.stringify(newNestPool) !== JSON.stringify(prevNestPool)) {
        setNestPool(newNestPool)
      }
    }
  }, [pool, prevNestPool, tokensSymbols, tokensBalanceOf])

  // const apr = useNestPoolApr(nestPool.sToken, nestPool.rToken, nestPool.rPerBlockAmount, nestPool._rPerBlock)
  // console.info('apr: ', apr)

  return nestPool
}

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
// https://github.com/pancakeswap/pancake-frontend/blob/5bc14994d8cd1334adb48acf0c40a2e68162c64b/src/utils/apr.ts#L12-L22
// export const getPoolApr = (
//   stakingTokenPrice: number,
//   rewardTokenPrice: number,
//   totalStaked: number,
//   tokenPerBlock: number
// ): number => {
//   const totalRewardPricePerYear = new BigNumber(rewardTokenPrice).times(tokenPerBlock).times(BLOCKS_PER_YEAR)
//   const totalStakingTokenInPool = new BigNumber(stakingTokenPrice).times(totalStaked)
//   const apr = totalRewardPricePerYear.div(totalStakingTokenInPool).times(100)
//   return apr.isNaN() || !apr.isFinite() ? null : apr.toNumber()
// }

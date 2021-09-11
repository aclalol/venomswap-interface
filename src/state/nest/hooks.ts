import React, { useState } from 'react'
import { CurrencyAmount, JSBI, Token, TokenAmount, ChainId, WETH, Fraction } from '@venomswap/sdk'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'
import { useMasterNestContract, usePancakeFactoryContract, usePancakePair } from '../../hooks/useContract'
import { useMultipleContractSingleData, useSingleCallResult } from '../multicall/hooks'
import { ethers } from 'ethers'
import NEST_POOL_ABI from '../../constants/abis/nest-pool.json'
import NEST_TOKEN_ABI from '../../constants/abis/nest-token.json'
import usePrevious from '../../hooks/usePrevious'
import { MASTER_NEST_BIRTHDAY, ZERO_ADDRESS, ZERO_ONE_ADDRESS } from '../../constants'
import getBlocksPerYear from '../../utils/getBlocksPerYear'
import { validNestPoolInfo, validExtraNestPoolInfo } from '../../utils/validNestPoolInfo'
import { useBlockNumber } from '../application/hooks'
import useWbnbBusdPrice from '../../hooks/useWbnbBusdPrice'

const POOL_INTERFACE = new Interface(NEST_POOL_ABI)
const TOKEN_INTERFACE = new Interface(NEST_TOKEN_ABI)

const DEFAULT_BN = JSBI.BigInt(0)
const DEFAULT_TOKEN = new Token(ChainId.BSC_MAINNET, ZERO_ADDRESS, 18, 'DEFAULT', 'DEFAULT')
const DEFAULT_TOKEN_A = new Token(ChainId.BSC_MAINNET, ZERO_ONE_ADDRESS, 18, 'DEFAULT', 'DEFAULT')
export const DEFAULT_AMOUNT = new TokenAmount(DEFAULT_TOKEN, JSBI.BigInt(0))
const NEW_DEFAULT_POOL = {
  poolAddress: ZERO_ONE_ADDRESS, // pid -> poolAddress

  startBlock: DEFAULT_BN, // bn
  lastRewardBlock: DEFAULT_BN, // bn
  bonusEndBlock: DEFAULT_BN, // bn

  _sTokenAddress: ZERO_ADDRESS, // string
  _sLimitPerUser: DEFAULT_BN, // staking bn
  _sAmount: DEFAULT_BN, // staking user.amount bn

  _rTokenAddress: ZERO_ONE_ADDRESS, // string
  _rPerBlock: DEFAULT_BN, // reward rewardPerBlock
  _rDebt: DEFAULT_BN, // reward user.rewardDebt bn
  _rPending: DEFAULT_BN, // reward pendingReward bn

  _cStakedBalanceOf: DEFAULT_BN, // pool total staked (balance of)

  // chaindId, _sTokenAddress, _sTokenDecimals, _sTokenSymbol, _sTokenName
  sToken: DEFAULT_TOKEN,
  sAmount: DEFAULT_AMOUNT, // staking BN(user._stakedAmount)
  sLimitPerUser: DEFAULT_AMOUNT, // staking BN(user._limitPerUser)
  sFreeAmount: DEFAULT_AMOUNT, // staking user balance of .balanceOf(sToken)
  sAllAmount: DEFAULT_AMOUNT, // staking pool contract balance of .balanceOf(sToken)

  rToken: DEFAULT_TOKEN_A, // chaindId, _rTokenAddress, _rTokenDecimals, _rTokenSymbol, _rTokenName
  rPerBlockAmount: DEFAULT_AMOUNT, // reward BN(user._rewardPerBlock)
  rClaimedAmount: DEFAULT_AMOUNT, // reward BN(user._rewardDebt)
  rUnclaimedAmount: DEFAULT_AMOUNT, // reward BN(user._pendingReward)
  rAllAmount: DEFAULT_AMOUNT,

  apr: new Fraction(DEFAULT_BN, DEFAULT_BN),
  tvl: new Fraction(DEFAULT_BN, DEFAULT_BN),
  totalDeposits: new Fraction(DEFAULT_BN, DEFAULT_BN),

  isLoad: false,
  isLoadTvl: false
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

  _cStakedBalanceOf: JSBI // all staked amount in pool

  sToken: Token // chaindId, _sTokenAddress, _sTokenDecimals, _sTokenSymbol, _sTokenName
  sAmount: TokenAmount // staking BN(user._stakedAmount)
  sLimitPerUser: TokenAmount // staking BN(user._limitPerUser)
  sFreeAmount: TokenAmount // staking user balance of .balanceOf(sToken)
  sAllAmount: TokenAmount // staking pool contract balance of .balanceOf(sToken)

  rToken: Token // chaindId, _rTokenAddress, _rTokenDecimals, _rTokenSymbol, _rTokenName
  rPerBlockAmount: TokenAmount // reward BN(user._rewardPerBlock)
  rClaimedAmount: TokenAmount // reward BN(user._rewardDebt)
  rUnclaimedAmount: TokenAmount // reward BN(user._pendingReward)
  rAllAmount: TokenAmount // reward token balance in contract

  apr: Fraction
  tvl: Fraction
  totalDeposits: Fraction

  isLoad: boolean
  isLoadTvl: boolean
}

export function useNestPoolsAddrsList(): Array<string> {
  const masterNestContract = useMasterNestContract()
  const [poolsAddrs, setPoolsAddrs] = useState<Array<string>>([])
  const latestBlockNumber = useBlockNumber() ?? 0

  React.useEffect(() => {
    async function getNestList() {
      const promises = []
      const birthBlock = MASTER_NEST_BIRTHDAY
      let bb = birthBlock
      while (bb >= birthBlock && bb < latestBlockNumber) {
        if (bb + 5000 < latestBlockNumber) {
          bb = bb + 5000
        } else {
          bb = latestBlockNumber
        }

        const promis: any = masterNestContract?.queryFilter(
          {
            address: masterNestContract?.address,
            topics: [ethers.utils.id('NewSmartChefContract(address)')]
          },
          bb - 5000, // from
          bb // to
        )
        promises.push(promis)
      }
      const events = await Promise.all(promises)
      const addrs =
        events.reduce((acc: any, i: any) => {
          if (i.length !== 0) {
            i.forEach((event: any) => {
              acc.push(event.args[0])
            })
          }
          return acc
        }, []) ?? []
      console.log('pool contracts addresses: ', addrs)
      setPoolsAddrs(addrs)
    }

    getNestList()
  }, [latestBlockNumber])

  return poolsAddrs
}

export function useApr(poolInfo: PoolInterface) {
  const { chainId } = useActiveWeb3React()
  const wbnbInBusdPrice = useWbnbBusdPrice()
  const WBNB = WETH[chainId as ChainId]
  const blocksPerYear = React.useMemo(() => {
    const bPY = getBlocksPerYear(chainId)
    return JSBI.BigInt(bPY)
  }, [chainId])
  const pancakeFactoryContract = usePancakeFactoryContract()
  const sTokenWbnbPairAddress = useSingleCallResult(pancakeFactoryContract, 'getPair', [
    poolInfo.sToken.address,
    WBNB.address
  ])
  const rTokenWbnbPairAddress = useSingleCallResult(pancakeFactoryContract, 'getPair', [
    poolInfo.rToken.address,
    WBNB.address
  ])
  const sBTokenPancakePairContract = usePancakePair(sTokenWbnbPairAddress?.result?.[0])
  const sBReserves = useSingleCallResult(sBTokenPancakePairContract, 'getReserves')?.result
  const rBTokenPancakePairContract = usePancakePair(rTokenWbnbPairAddress?.result?.[0])
  const rBReserves = useSingleCallResult(rBTokenPancakePairContract, 'getReserves')?.result

  if (sBReserves && rBReserves && sBReserves?.[1].toString() !== '0' && rBReserves?.[1].toString() !== '0') {
    const sPriceInWbnb = new Fraction(sBReserves?.[1], sBReserves?.[0])
    const rPriceInWbnb = new Fraction(rBReserves?.[1], rBReserves?.[0])
    const yearProfit = JSBI.multiply(poolInfo._rPerBlock, blocksPerYear)

    const totalRewardPricePerYear = wbnbInBusdPrice.multiply(rPriceInWbnb.multiply(new Fraction(yearProfit)))
    const totalStakingTokenInPool = wbnbInBusdPrice.multiply(
      sPriceInWbnb.multiply(new Fraction(poolInfo._cStakedBalanceOf))
    )

    const apr =
      totalStakingTokenInPool.toString() === '0'
        ? new Fraction(DEFAULT_BN, DEFAULT_BN)
        : totalRewardPricePerYear.divide(totalStakingTokenInPool)

    const sAll = poolInfo.sAllAmount.multiply(sPriceInWbnb).multiply(wbnbInBusdPrice)
    const rAll = poolInfo.rAllAmount.multiply(rPriceInWbnb).multiply(wbnbInBusdPrice)

    const tvl = sAll.add(rAll)
    return {
      apr,
      tvl,
      totalDeposits: sAll,
      isLoadTvl: true
    }
  }

  return {
    apr: new Fraction(DEFAULT_BN, DEFAULT_BN),
    tvl: new Fraction(DEFAULT_BN, DEFAULT_BN),
    totalDeposits: new Fraction(DEFAULT_BN, DEFAULT_BN),
    isLoadTvl: false
  }
}

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
  const contractRewardBalance = useMultipleContractSingleData([tokensAdrsArr[1]], TOKEN_INTERFACE, 'balanceOf', [
    address ?? undefined
  ])

  React.useEffect(() => {
    if (validExtraNestPoolInfo(tokensSymbols, tokensDecimals, tokensBalanceOf, tokensNames, contractStakedBalance)) {
      const sTokenDecimals = tokensDecimals[0]?.result?.[0]
      const sTokenSymbol = tokensSymbols[0]?.result?.[0]
      const sTokenName = tokensSymbols[0]?.result?.[0]

      const sBalanceOf = JSBI.BigInt(tokensBalanceOf[0]?.result?.[0])
      const cStakedBalanceOf = JSBI.BigInt(contractStakedBalance[0]?.result?.[0])
      const cRewardBalanceOf = JSBI.BigInt(contractRewardBalance[0]?.result?.[0])

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
      const rAllAmount = new TokenAmount(rToken, cRewardBalanceOf)

      const newNestPool = {
        ...pool,
        _cStakedBalanceOf: cStakedBalanceOf,
        sToken,
        sAmount,
        sLimitPerUser,
        sFreeAmount,
        sAllAmount,
        rAllAmount,
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

  const { apr, tvl, totalDeposits, isLoadTvl } = useApr(nestPool)

  return {
    ...nestPool,
    isLoadTvl,
    apr,
    tvl,
    totalDeposits
  }
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

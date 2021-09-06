import React, { useState } from 'react'
import { CurrencyAmount, JSBI, Token, TokenAmount, Pair, ChainId } from '@venomswap/sdk'
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
import { ZERO_ADDRESS } from '../../constants'

const POOL_INTERFACE = new Interface(NEST_POOL_ABI)
const TOKEN_INTERFACE = new Interface(NEST_TOKEN_ABI)

export interface NewPoolInterface {
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
export function useSingleNestPool(address: string): NewPoolInterface {
  const { account, chainId } = useActiveWeb3React()
  const [pool, setPool] = useState({ ...NEW_DEFAULT_POOL })
  const prevPool = usePrevious(pool) ?? undefined
  const [nestPool, setNestPool] = useState<NewPoolInterface>({ ...NEW_DEFAULT_POOL })
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
      poolLastRewardBlock[0]?.result?.[0] &&
      poolPendingReward &&
      poolPendingReward[0] &&
      !poolPendingReward[0].error &&
      !poolPendingReward[0].loading &&
      poolPendingReward[0]?.result?.[0] &&
      poolPendingReward[0]?.result?.[0]
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
      tokensDecimals &&
      tokensDecimals[0] &&
      !tokensDecimals[0].error &&
      !tokensDecimals[0].loading &&
      tokensDecimals[0]?.result?.[0] &&
      tokensDecimals[1] &&
      !tokensDecimals[1].error &&
      !tokensDecimals[1].loading &&
      tokensDecimals[1]?.result?.[0] &&
      tokensNames &&
      tokensNames[0] &&
      !tokensNames[0].error &&
      !tokensNames[0].loading &&
      tokensNames[0]?.result?.[0] &&
      tokensNames[1] &&
      !tokensNames[1].error &&
      !tokensNames[1].loading &&
      tokensNames[1]?.result?.[0] &&
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

  return nestPool
}

export interface PoolInterface {
  pid: any // string?
  amount: any // bn
  rewardDebt: any // bn
  rewardPerBlock: any // bb
  limitPerUser: any // bn
  startBlock: any // bn
  bonusEndBlock: any // bn
  lastRewardBlock: any // bn

  stakedToken: any
  stakedTokenObj?: Token // chaindId, address, decimals, symbol, name
  sTokenSymbol?: any // string
  sTokenName?: any // string
  sBalanceOf?: any // bn
  sTokenDecimals?: any // bn
  stakedAmount?: TokenAmount
  unstakedAmount?: TokenAmount

  rewardToken: any
  rewardTokenObj?: Token
  rewardAmount?: TokenAmount
  rBalanceOf?: any // bn
  rTokenSymbol?: any // string
  rTokenName?: any // string
  rTokenDecimals?: any // bn

  pendingReward?: any // bn
  pendingAmount?: TokenAmount // bn

  cStakedBalanceOf?: any // bn staked in contract
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
  sTokenName: '', // string
  rTokenName: '', // string
  sTokenDecimals: ethers.BigNumber.from(0), // bn
  rTokenDecimals: ethers.BigNumber.from(0), // bn
  sBalanceOf: ethers.BigNumber.from(0), // bn
  rBalanceOf: ethers.BigNumber.from(0), // bn

  pendingReward: ethers.BigNumber.from(0), // bn
  // pandingAmount: TokenAmount
  cStakedBalanceOf: ethers.BigNumber.from(0) // bn
  // unstakedAmount:
  // stakedTokenObj: null, // Token
  // rewardTokenObj: null // Token
}
export function useNestInfoSingle(address: string): any {
  const { account, chainId } = useActiveWeb3React()
  const lastBlockNumber = useBlockNumber()
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
  const poolPendingReward = useMultipleContractSingleData([address], POOL_INTERFACE, 'pendingReward', [
    account ?? undefined
  ])

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
      poolLastRewardBlock[0]?.result?.[0] &&
      poolPendingReward &&
      poolPendingReward[0] &&
      !poolPendingReward[0].error &&
      !poolPendingReward[0].loading &&
      poolPendingReward[0]?.result?.[0] &&
      poolPendingReward[0]?.result?.[0]
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
        lastRewardBlock: poolLastRewardBlock[0].result?.[0] ?? 0, // bn
        isArchived: lastBlockNumber && (poolLastRewardBlock[0].result?.[0] ?? 0 < lastBlockNumber), // bn
        pendingReward: poolPendingReward[0].result?.[0] ?? 0 // bn
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
  const tokensDecimals = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'decimals')
  const tokensNames = useMultipleContractSingleData(tokensAdrsArr, TOKEN_INTERFACE, 'name')
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
      tokensDecimals &&
      tokensDecimals[0] &&
      !tokensDecimals[0].error &&
      !tokensDecimals[0].loading &&
      tokensDecimals[0]?.result?.[0] &&
      tokensDecimals[1] &&
      !tokensDecimals[1].error &&
      !tokensDecimals[1].loading &&
      tokensDecimals[1]?.result?.[0] &&
      tokensNames &&
      tokensNames[0] &&
      !tokensNames[0].error &&
      !tokensNames[0].loading &&
      tokensNames[0]?.result?.[0] &&
      tokensNames[1] &&
      !tokensNames[1].error &&
      !tokensNames[1].loading &&
      tokensNames[1]?.result?.[0] &&
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
      const sTokenDecimals = tokensDecimals[0]?.result?.[0]
      const sTokenSymbol = tokensSymbols[0]?.result?.[0]
      const sTokenName = tokensSymbols[0]?.result?.[0]
      const rTokenDecimals = tokensDecimals[1]?.result?.[0]
      const rTokenSymbol = tokensSymbols[1]?.result?.[0]
      const rTokenName = tokensSymbols[1]?.result?.[0]
      const sBalanceOf = tokensBalanceOf[0]?.result?.[0]
      const rBalanceOf = tokensBalanceOf[1]?.result?.[0]
      const cStakedBalanceOf = contractStakedBalance[0]?.result?.[0]

      const stakedToken = new Token(
        chainId ? chainId : ChainId.BSC_TESTNET, // TOOD fix
        pool.stakedToken,
        sTokenDecimals,
        sTokenSymbol,
        sTokenName
      )
      const unstakedAmount = new TokenAmount(stakedToken, JSBI.BigInt(sBalanceOf.toString()))
      const stakedAmount = new TokenAmount(stakedToken, JSBI.BigInt(pool.limitPerUser.sub(pool.amount).toString()))
      const rewardToken = new Token(
        chainId ? chainId : ChainId.BSC_TESTNET, // TOOD fix
        pool.rewardToken,
        rTokenDecimals,
        rTokenSymbol,
        rTokenName
      )
      const rewardAmount = new TokenAmount(rewardToken, JSBI.BigInt(pool.rewardDebt))
      const pendingAmount = new TokenAmount(rewardToken, JSBI.BigInt(pool.pendingReward))

      const newNestPool = {
        ...pool,

        sTokenSymbol,
        rTokenSymbol,
        sTokenName,
        rTokenName,
        sTokenDecimals,
        rTokenDecimals,

        sBalanceOf,
        rBalanceOf,
        cStakedBalanceOf,

        unstakedAmount,

        stakedTokenObj: stakedToken,
        stakedAmount,
        rewardTokenObj: rewardToken,
        rewardAmount,
        pendingAmount
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

export function useNestInfo(active: boolean | undefined = undefined, pairToFilterBy?: Pair | null): any {
  const { account } = useActiveWeb3React()
  const masterNestContract = useMasterNestContract()
  const [nestPools, setNestPool] = useState<any>([])
  const [pools, setPools] = useState<any>([])
  const [nestPoolsExtra, setNestPoolExtra] = useState<any>([])
  const [tokensAdrs, setTokensAdrs] = useState<any>({})
  React.useEffect(() => {
    async function getNestList() {
      // TODO important
      // "exceed maximum block range: 5000"
      const res: any = await masterNestContract?.queryFilter(
        {
          address: masterNestContract?.address,
          topics: [ethers.utils.id('NewSmartChefContract(address)')]
          // topics: [ethers.utils.id('deployPool(address,address,uint256,uint256,uint256,uint256,address)')]
        },
        12109559, // 12109559 // TODO change block
        12109559 + 4999 // TODO change block
      )
      console.log('nest res: ', res)
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

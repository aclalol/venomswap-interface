import { ChainId, Fraction, JSBI, WETH } from '@venomswap/sdk'
import { usePancakeFactoryContract, usePancakePair } from './useContract'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useActiveWeb3React } from './index'
import { DEFAULT_BN, PoolInterface } from '../state/nest/hooks'
import usePitRatio from './usePitRatio'
import useWbnbBusdPrice from './useWbnbBusdPrice'
import React from 'react'
import getBlocksPerYear from '../utils/getBlocksPerYear'

export default function useXHepaHepaPoolAprAndTvl(poolInfo: PoolInterface) {
  const { chainId } = useActiveWeb3React()
  const pitRatio = usePitRatio()
  const wbnbInBusdPrice = useWbnbBusdPrice()
  const WBNB = WETH[chainId as ChainId]
  // console.log('WBNB: ', WBNB.address)
  // console.log('poolInfo.sToken.address: ', poolInfo.rToken.address)
  const pancakeFactoryContract = usePancakeFactoryContract()

  const blocksPerYear = React.useMemo(() => {
    const bPY = getBlocksPerYear(chainId)
    return JSBI.BigInt(bPY)
  }, [chainId])
  const hepaTokenWbnbPairAddress = useSingleCallResult(pancakeFactoryContract, 'getPair', [
    poolInfo.rToken.address,
    WBNB.address
  ])
  // console.log('hepaTokenWbnbPairAddress?.result?.[0]: ', hepaTokenWbnbPairAddress?.result?.[0])
  const hepaBnbTokenPancakePairContract = usePancakePair(hepaTokenWbnbPairAddress?.result?.[0])
  // console.log('hepaBnbTokenPancakePairContract: ', hepaBnbTokenPancakePairContract)
  const hepaBnbReserves = useSingleCallResult(hepaBnbTokenPancakePairContract, 'getReserves')?.result
  // console.log('hepaBnbReserves?.[1]: ', hepaBnbReserves?.[1])
  // console.log('hepaBnbReserves?.[0]: ', hepaBnbReserves?.[0])
  if (hepaBnbReserves && hepaBnbReserves?.[1].toString() !== '0') {
    const hepaPriceInWbnb = new Fraction(hepaBnbReserves?.[1], hepaBnbReserves?.[0])
    const xhepaPriceInWbnb = hepaPriceInWbnb.multiply(pitRatio)
    const yearProfit = JSBI.multiply(poolInfo._rPerBlock, blocksPerYear)

    const totalRewardPricePerYear = wbnbInBusdPrice.multiply(xhepaPriceInWbnb.multiply(new Fraction(yearProfit)))
    const totalStakingTokenInPool = wbnbInBusdPrice.multiply(
      hepaPriceInWbnb.multiply(new Fraction(poolInfo._cStakedBalanceOf))
    )

    const apr =
      totalStakingTokenInPool.toString() === '0'
        ? new Fraction(DEFAULT_BN, DEFAULT_BN)
        : totalRewardPricePerYear.divide(totalStakingTokenInPool)

    const sAll = poolInfo.sAllAmount.multiply(hepaPriceInWbnb).multiply(wbnbInBusdPrice)
    const rAll = poolInfo.rAllAmount.multiply(xhepaPriceInWbnb).multiply(wbnbInBusdPrice)

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

import { ChainId, WETH, Fraction } from '@venomswap/sdk'
import { usePancakeFactoryContract, usePancakePair } from './useContract'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useActiveWeb3React } from './index'
//import usePitRatio from './usePitRatio'
import useWbnbBusdPrice from './useWbnbBusdPrice'
import { GOVERNANCE_TOKEN } from '../constants'
import { useMemo } from 'react'
import { DEFAULT_BN } from 'state/nest/hooks'

export default function useGovTokenBusdPrice(): Fraction | undefined {
  const { chainId } = useActiveWeb3React()
  //const pitRatio = usePitRatio()
  const wbnbInBusdPrice = useWbnbBusdPrice()
  const WBNB = WETH[chainId as ChainId]
  // console.log('WBNB: ', WBNB.address)
  // console.log('poolInfo.sToken.address: ', poolInfo.rToken.address)
  const pancakeFactoryContract = usePancakeFactoryContract()
  const hepaTokenWbnbPairAddress = useSingleCallResult(pancakeFactoryContract, 'getPair', [
    GOVERNANCE_TOKEN[ChainId.BSC_MAINNET].address,
    WBNB.address
  ])
  // console.log('hepaTokenWbnbPairAddress?.result?.[0]: ', hepaTokenWbnbPairAddress?.result?.[0])
  const hepaBnbTokenPancakePairContract = usePancakePair(hepaTokenWbnbPairAddress?.result?.[0])
  // console.log('hepaBnbTokenPancakePairContract: ', hepaBnbTokenPancakePairContract)
  const hepaBnbReserves = useSingleCallResult(hepaBnbTokenPancakePairContract, 'getReserves')?.result
  // console.log('hepaBnbReserves?.[1]: ', hepaBnbReserves?.[1])
  // console.log('hepaBnbReserves?.[0]: ', hepaBnbReserves?.[0])
  let hepaPriceInWbnb = new Fraction(DEFAULT_BN, DEFAULT_BN)
  if (hepaBnbReserves && hepaBnbReserves?.[1].toString() !== '0') {
    hepaPriceInWbnb = new Fraction(hepaBnbReserves?.[1], hepaBnbReserves?.[0])
  }
  const hepaPriceInBusd = hepaPriceInWbnb.multiply(wbnbInBusdPrice)
  return useMemo(() => {
    return hepaPriceInBusd ? hepaPriceInBusd : new Fraction(DEFAULT_BN, DEFAULT_BN)
  }, [hepaPriceInBusd])
}

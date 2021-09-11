import { ChainId, Fraction, WETH } from '@venomswap/sdk'
import { usePancakeFactoryContract, usePancakePair } from './useContract'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useActiveWeb3React } from './index'
import { BUSD as BUSDToken, TBUSD } from '../constants'

export default function useWbnbBusdPrice(): Fraction {
  const { chainId } = useActiveWeb3React()
  const WBNB = WETH[chainId as ChainId]
  const BUSD = chainId === 56 ? BUSDToken : TBUSD

  const pancakeFactoryContract = usePancakeFactoryContract()
  const wbnbBusdPairAddress = useSingleCallResult(pancakeFactoryContract, 'getPair', [WBNB.address, BUSD.address])
  const wbnbBusdPairContract = usePancakePair(wbnbBusdPairAddress?.result?.[0])
  const wbnbBusdReserves = useSingleCallResult(wbnbBusdPairContract, 'getReserves')?.result

  const wbnbInBusdPrice = new Fraction(wbnbBusdReserves?.[1], wbnbBusdReserves?.[0])

  return wbnbInBusdPrice
}

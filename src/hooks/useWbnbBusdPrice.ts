import { ChainId, Fraction, JSBI, WETH } from '@venomswap/sdk'
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

  let wbnbInBusdPrice = new Fraction(JSBI.BigInt(0), JSBI.BigInt(0))

  if (wbnbBusdReserves?.[1] && wbnbBusdReserves?.[0]) {
    wbnbInBusdPrice = new Fraction(wbnbBusdReserves?.[1], wbnbBusdReserves?.[0])
  }

  return wbnbInBusdPrice
}

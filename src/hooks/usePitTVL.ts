import { ChainId, Fraction, JSBI, WETH } from '@venomswap/sdk'
import usePitXHepaToken from './usePitXHepaToken'
import { useTokenBalance } from '../state/wallet/hooks'
import useGovernanceToken from 'hooks/useGovernanceToken'
import { useTotalSupply } from '../data/TotalSupply'
import { usePancakeFactoryContract, usePancakePair } from './useContract'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useActiveWeb3React } from './index'
import { DEFAULT_AMOUNT } from '../state/nest/hooks'
import usePitRatio from './usePitRatio'
import useWbnbBusdPrice from './useWbnbBusdPrice'

export default function usePitTVL(): Fraction | undefined {
  const { chainId } = useActiveWeb3React()
  const pitRatio = usePitRatio()
  const govToken = useGovernanceToken() // HEPA
  const pit = usePitXHepaToken() // xHEPA
  const wbnbInBusdPrice = useWbnbBusdPrice()
  const pitTotalSupply = useTotalSupply(pit) // xHEPA
  const pitGovTokenBalance = useTokenBalance(pit?.address, govToken) // HEPA
  const WBNB = WETH[chainId as ChainId]

  const pancakeFactoryContract = usePancakeFactoryContract()
  const hepaWbnbPairAddress = useSingleCallResult(pancakeFactoryContract, 'getPair', [govToken?.address, WBNB.address])

  const hepaWbnbPairContract = usePancakePair(hepaWbnbPairAddress?.result?.[0])
  const hepaWbnbReserves = useSingleCallResult(hepaWbnbPairContract, 'getReserves')?.result

  let hepaInWbnbPrice = new Fraction(JSBI.BigInt(0), JSBI.BigInt(0))
  if (hepaWbnbReserves?.[1] && hepaWbnbReserves?.[0]) {
    hepaInWbnbPrice = new Fraction(hepaWbnbReserves?.[1], hepaWbnbReserves?.[0]) // JSBI.BigInt(hepaWbnbReserves?.[0].div(hepaWbnbReserves?.[1]) ?? 1)
  }
  const hepaTokensAmountInPool = new Fraction(
    JSBI.BigInt((pitGovTokenBalance ? pitGovTokenBalance : DEFAULT_AMOUNT).toExact())
  )
  const xhepaTokensAmountInPool = new Fraction(
    JSBI.BigInt((pitTotalSupply ? pitTotalSupply : DEFAULT_AMOUNT).toExact())
  )
  const xhepaInHepaTokensAmountInPool = pitRatio?.multiply(xhepaTokensAmountInPool) // JSBI.multiply(xhepaTokensAmountInPool,

  const pitTvlHepa = hepaTokensAmountInPool.add(xhepaInHepaTokensAmountInPool)
  const pitTvlWbnb = pitTvlHepa.multiply(hepaInWbnbPrice)
  const pitTvlBusd = pitTvlWbnb.multiply(wbnbInBusdPrice)

  return pitTvlBusd
}

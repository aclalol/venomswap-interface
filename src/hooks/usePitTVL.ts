import { useMemo } from 'react'
import { TokenAmount, Fraction } from '@venomswap/sdk'
import { useTokenBalance } from '../state/wallet/hooks'
import useBUSDPrice from './useBUSDPrice'
import usePitToken from './usePitToken'
import { PIT_INTERFACE } from '../constants/abis/pit'
import { usePitStakingContract } from './useContract'
import { getPairAddress } from '../utils'
import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { TBUSD } from '../constants'
import { Interface } from '@ethersproject/abi'
import { abi as IUniswapV2PairABI } from '@venomswap/core/build/IUniswapV2Pair.json'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

export default function usePitTVL(): Fraction | undefined {
  const pitToken = usePitToken()
  // HEPA
  const pitTokenBusdPrice = useBUSDPrice(pitToken)
  const pitStakingContract = usePitStakingContract()
  const pitStakingTokenBalance: TokenAmount | undefined = useTokenBalance(
    pitStakingContract?.address,
    pitToken,
    'balanceOf',
    PIT_INTERFACE
  )
  const pairAddresses = [pitToken && getPairAddress(pitToken, TBUSD), pitToken && getPairAddress(TBUSD, pitToken)]
  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')
  console.log('results: ', results)
  return useMemo(() => {
    return pitTokenBusdPrice ? pitStakingTokenBalance?.multiply(pitTokenBusdPrice?.raw) : undefined
  }, [pitStakingContract, pitTokenBusdPrice, pitToken, pitStakingTokenBalance])
}

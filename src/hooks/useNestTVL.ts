import { useMemo } from 'react'
import { TokenAmount, Fraction } from '@venomswap/sdk'
import { useTokenBalance } from '../state/wallet/hooks'
import useBUSDPrice from './useBUSDPrice'
import usePitXHepaToken from './usePitXHepaToken'
import { GOVERNANCE_TOKEN_INTERFACE } from '../constants/abis/governanceToken'
import useGovernanceToken from 'hooks/useGovernanceToken'

export default function useNestTVL(): Fraction | undefined {
  // stakingInPoolInBUSD_1 + stakingInPoolInBUSD_2

  const govToken = useGovernanceToken()
  const govTokenBusdPrice = useBUSDPrice(govToken)
  const pit = usePitXHepaToken()
  const pitGovTokenBalance: TokenAmount | undefined = useTokenBalance(
    pit && pit.address,
    govToken,
    'balanceOf',
    GOVERNANCE_TOKEN_INTERFACE
  )

  return useMemo(() => {
    return govTokenBusdPrice ? pitGovTokenBalance?.multiply(govTokenBusdPrice?.raw) : undefined
  }, [govToken, govTokenBusdPrice, pit, pitGovTokenBalance])
}

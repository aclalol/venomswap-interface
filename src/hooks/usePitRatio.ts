import { Fraction, JSBI } from '@venomswap/sdk'
import { utils } from 'ethers'
import usePitToken from './usePitToken'
import { useTokenBalance } from '../state/wallet/hooks'
import useGovernanceToken from 'hooks/useGovernanceToken'
import { useTotalSupply } from '../data/TotalSupply'

export default function usePitRatio(): Fraction {
  const govToken = useGovernanceToken() // HEPA
  const pit = usePitToken() // xHEPA
  const pitTotalSupply = useTotalSupply(pit) // xHEPA
  const pitGovTokenBalance = useTokenBalance(pit?.address, govToken) // HEPA
  const multiplier = utils.parseEther('1').toString()

  const pitRatio =
    pitGovTokenBalance && pitTotalSupply
      ? pitGovTokenBalance?.divide(pitTotalSupply?.raw.toString()).multiply(multiplier)
      : new Fraction(JSBI.BigInt(0), JSBI.BigInt(0))

  return pitRatio
}

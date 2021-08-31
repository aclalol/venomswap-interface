import { PIT_STAKING } from '../constants'
import { useActiveWeb3React } from './index'
import { Token } from '@venomswap/sdk'

export default function usePitStaking(): Token | undefined {
  const { chainId } = useActiveWeb3React()
  return chainId ? PIT_STAKING[chainId] : undefined
}

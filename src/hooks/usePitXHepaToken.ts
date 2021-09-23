import { Token } from '@venomswap/sdk'
import { XHEPA } from '../constants'
import { useActiveWeb3React } from './index'

export default function usePitXHepaToken(): Token | undefined {
  const { chainId } = useActiveWeb3React()
  return chainId ? XHEPA[chainId] : undefined
}

import { Token } from '@venomswap/sdk'
import { USDH } from '../constants'
import { useActiveWeb3React } from './index'

export default function useUsdhToken(): Token | undefined {
  const { chainId } = useActiveWeb3React()
  return chainId ? USDH[chainId] : undefined
}

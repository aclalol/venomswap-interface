import { ChainId, Token } from '@venomswap/sdk'
import getPairTokensWithDefaults from '../utils/getPairTokensWithDefaults'

export const GAS_LIMIT = 1000000

export const PIT_POOLS: {
  [chainId in ChainId]?: {
    pid: number
    tokens: [Token, Token]
  }[]
} = {
  [ChainId.BSC_TESTNET]: [
    {
      pid: 0,
      tokens: getPairTokensWithDefaults(ChainId.BSC_TESTNET, 'HEPA/XHEPA')
    },
    {
      pid: 1,
      tokens: getPairTokensWithDefaults(ChainId.BSC_TESTNET, 'XHEPA/HEPA')
    }
  ]
}

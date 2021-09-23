import { ChainId, Token } from '@venomswap/sdk'
import getPairTokensWithDefaults from '../utils/getPairTokensWithDefaults'

export interface StakingRewardsInfo {
  pid: number
  tokens: [Token, Token]
  active: boolean
}

export const STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: StakingRewardsInfo[]
} = {
  [ChainId.BSC_MAINNET]: [
    {
      pid: 0,
      tokens: getPairTokensWithDefaults(ChainId.BSC_MAINNET, 'BHUNT/HEPA'),
      active: true
    },
    {
      pid: 1,
      tokens: getPairTokensWithDefaults(ChainId.BSC_MAINNET, 'HEPA/WBNB'),
      active: true
    },
    {
      pid: 2,
      tokens: getPairTokensWithDefaults(ChainId.BSC_MAINNET, 'HEPA/BUSD'),
      active: true
    },
    {
      pid: 3,
      tokens: getPairTokensWithDefaults(ChainId.BSC_MAINNET, 'CAKE/HEPA'),
      active: true
    },
    {
      pid: 4,
      tokens: getPairTokensWithDefaults(ChainId.BSC_MAINNET, 'HEPA/TAPE'),
      active: true
    },
    {
      pid: 5,
      tokens: getPairTokensWithDefaults(ChainId.BSC_MAINNET, 'BANANA/HEPA'),
      active: true
    }
  ],
  [ChainId.BSC_TESTNET]: [
    {
      pid: 0,
      tokens: getPairTokensWithDefaults(ChainId.BSC_TESTNET, 'WBNB/HEPA'),
      active: false
    }
  ]
}

import { CallState } from '../state/multicall/hooks'

export function validNestPoolInfo(
  poolUserInfos: Array<CallState>,
  poolStakedToken: Array<CallState>,
  poolRewardToken: Array<CallState>,
  poolLastRewardBlock: Array<CallState>,
  poolLimitPerUser: Array<CallState>,
  poolStartBlock: Array<CallState>,
  poolBonusEndBlock: Array<CallState>,
  poolPendingReward: Array<CallState>
): boolean {
  if (
    poolUserInfos &&
    !poolUserInfos[0].error &&
    !poolUserInfos[0].loading &&
    poolUserInfos[0]?.result?.amount &&
    poolUserInfos[0]?.result?.rewardDebt &&
    poolStakedToken &&
    poolStakedToken[0] &&
    !poolStakedToken[0].error &&
    !poolStakedToken[0].loading &&
    poolStakedToken[0]?.result?.[0] &&
    poolStakedToken[0]?.result?.[0] &&
    poolRewardToken &&
    poolRewardToken[0] &&
    !poolRewardToken[0].error &&
    !poolRewardToken[0].loading &&
    poolRewardToken[0]?.result?.[0] &&
    poolRewardToken[0]?.result?.[0] &&
    poolLimitPerUser &&
    poolLimitPerUser[0] &&
    !poolLimitPerUser[0].error &&
    !poolLimitPerUser[0].loading &&
    poolLimitPerUser[0]?.result?.[0] &&
    poolLimitPerUser[0]?.result?.[0] &&
    poolStartBlock &&
    poolStartBlock[0] &&
    !poolStartBlock[0].error &&
    !poolStartBlock[0].loading &&
    poolStartBlock[0]?.result?.[0] &&
    poolStartBlock[0]?.result?.[0] &&
    poolBonusEndBlock &&
    poolBonusEndBlock[0] &&
    !poolBonusEndBlock[0].error &&
    !poolBonusEndBlock[0].loading &&
    poolBonusEndBlock[0]?.result?.[0] &&
    poolBonusEndBlock[0]?.result?.[0] &&
    poolLastRewardBlock &&
    poolLastRewardBlock[0] &&
    !poolLastRewardBlock[0].error &&
    !poolLastRewardBlock[0].loading &&
    poolLastRewardBlock[0]?.result?.[0] &&
    poolLastRewardBlock[0]?.result?.[0] &&
    poolPendingReward &&
    poolPendingReward[0] &&
    !poolPendingReward[0].error &&
    !poolPendingReward[0].loading &&
    poolPendingReward[0]?.result?.[0] &&
    poolPendingReward[0]?.result?.[0]
  ) {
    return true
  }

  return false
}

export function validExtraNestPoolInfo(
  tokensSymbols: Array<CallState>,
  tokensDecimals: Array<CallState>,
  tokensBalanceOf: Array<CallState>,
  tokensNames: Array<CallState>,
  contractStakedBalance: Array<CallState>
): boolean {
  if (
    tokensSymbols &&
    tokensSymbols[0] &&
    !tokensSymbols[0].error &&
    !tokensSymbols[0].loading &&
    tokensSymbols[0]?.result?.[0] &&
    tokensSymbols[1] &&
    !tokensSymbols[1].error &&
    !tokensSymbols[1].loading &&
    tokensSymbols[1]?.result?.[0] &&
    tokensDecimals &&
    tokensDecimals[0] &&
    !tokensDecimals[0].error &&
    !tokensDecimals[0].loading &&
    tokensDecimals[0]?.result?.[0] &&
    tokensDecimals[1] &&
    !tokensDecimals[1].error &&
    !tokensDecimals[1].loading &&
    tokensDecimals[1]?.result?.[0] &&
    tokensNames &&
    tokensNames[0] &&
    !tokensNames[0].error &&
    !tokensNames[0].loading &&
    tokensNames[0]?.result?.[0] &&
    tokensNames[1] &&
    !tokensNames[1].error &&
    !tokensNames[1].loading &&
    tokensNames[1]?.result?.[0] &&
    tokensBalanceOf &&
    tokensBalanceOf[0] &&
    !tokensBalanceOf[0].error &&
    !tokensBalanceOf[0].loading &&
    tokensBalanceOf[0]?.result?.[0] &&
    contractStakedBalance &&
    contractStakedBalance[0] &&
    !contractStakedBalance[0].error &&
    !contractStakedBalance[0].loading &&
    contractStakedBalance[0]?.result?.[0]
  ) {
    return true
  }

  return false
}

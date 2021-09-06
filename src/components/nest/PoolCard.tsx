import React from 'react'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import styled from 'styled-components'
import { TYPE, StyledInternalLink } from '../../theme'
import DoubleCurrencyLogo from '../DoubleLogo'
//import { JSBI } from '@venomswap/sdk'
import { ButtonPrimary } from '../Button'
// import {
//   PoolInterface
//   //StakingInfo
// } from '../../state/nest/hooks'
// import { useColor } from '../../hooks/useColor'
// import { currencyId } from '../../utils/currencyId'
import {
  // Break,
  CardNoise,
  CardBGImage
} from './styled'
import { useSingleNestPool } from '../../state/nest/hooks'
import { JSBI } from '@venomswap/sdk'
// import { unwrappedToken } from '../../utils/wrappedCurrency'
// import useBUSDPrice from '../../hooks/useBUSDPrice'
//import useUSDCPrice from '../../utils/useUSDCPrice'
//import { BIG_INT_SECONDS_IN_WEEK } from '../../constants'
//import useGovernanceToken from '../../hooks/useGovernanceToken'

const StatContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1rem;
  margin-right: 1rem;
  margin-left: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  // display: none;
`};
`

// const StatContainerTop = styled.div`
//   display: flex;
//   justify-content: space-between;
//   flex-direction: column;
//   gap: 12px;
//   margin: 1rem;
//   ${({ theme }) => theme.mediaWidth.upToSmall`
//   display: none;
// `};
// `

const Wrapper = styled(AutoColumn)<{ showBackground?: boolean; bgColor?: any }>`
  border-radius: 12px;
  width: 100%;
  overflow: hidden;
  position: relative;
  opacity: ${({ showBackground }) => (showBackground ? '1' : '1')};
  background: ${({ theme, bgColor, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%, ${showBackground ? theme.black : theme.bg5} 100%) `};
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;

  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
`

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  grid-gap: 0px;
  align-items: center;
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 48px 1fr 96px;
  `};
`

export default function PoolCard({
  // poolInfo,
  address,
  isArchived = false
}: // stakingInfo,
{
  address: string
  // poolInfo: PoolInterface // PoolInterface
  // stakingInfo: StakingInfo
  isArchived?: boolean
}) {
  // const govToken = useGovernanceToken()
  // const govTokenPrice = useBUSDPrice(govToken)
  //
  const poolInfo = useSingleNestPool(address)
  const isStaking = Boolean(poolInfo.sAmount.greaterThan(JSBI.BigInt(0)))
  // // const poolSharePercentage = stakingInfo.poolShare.multiply(JSBI.BigInt(100))
  //
  // // get the color of the token
  // const token0 = stakingInfo.tokens[0]
  // const token1 = stakingInfo.tokens[1]
  // const currency0 = unwrappedToken(token0)
  // const currency1 = unwrappedToken(token1)
  // const backgroundColor = useColor(stakingInfo?.baseToken)

  return (
    <Wrapper>
      <CardBGImage desaturate />
      <CardNoise />

      <TopSection>
        <DoubleCurrencyLogo size={24} />

        <TYPE.white fontWeight={600} fontSize={24} style={{ marginLeft: '8px' }}>
          {`Stake: ${poolInfo.sToken.symbol} - Earn: ${poolInfo.rToken.symbol}`}
        </TYPE.white>

        <StyledInternalLink to={`/hepa/nest/${poolInfo.poolAddress}`} style={{ width: '100%' }}>
          <ButtonPrimary padding="8px" borderRadius="8px">
            {isStaking || isArchived ? 'Manage' : 'Deposit'}
          </ButtonPrimary>
        </StyledInternalLink>
      </TopSection>

      <StatContainer>
        <RowBetween>
          <TYPE.white>Rewards end in</TYPE.white>
          <TYPE.white>{poolInfo.lastRewardBlock.toString()} blocks</TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Bonus End Block</TYPE.white>
          <TYPE.white>{poolInfo.bonusEndBlock.toString()} blocks</TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Last Reward Block</TYPE.white>
          <TYPE.white>{poolInfo.lastRewardBlock.toString()} blocks</TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Reward per block</TYPE.white>
          <TYPE.white>
            {poolInfo.rPerBlockAmount.toSignificant(6, { groupSeparator: ',' })} {poolInfo.rToken.symbol}
          </TYPE.white>
        </RowBetween>

        {/*<RowBetween>
          <TYPE.white>User Balance Of</TYPE.white>
          <TYPE.white>
            {ethers.utils.formatUnits(poolInfo.sBalanceOf.toString())} {poolInfo.sTokenSymbol}
          </TYPE.white>
        </RowBetween>*/}

        <RowBetween>
          <TYPE.white>Deposited</TYPE.white>
          <TYPE.white>
            {poolInfo.sAmount.toSignificant(6, { groupSeparator: ',' })} {poolInfo.sToken.symbol}
          </TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Pending Reward</TYPE.white>
          <TYPE.white>
            {poolInfo.rUnclaimedAmount.toSignificant(6, { groupSeparator: ',' })} {poolInfo.rToken.symbol}
          </TYPE.white>
        </RowBetween>

        {/*<RowBetween>
          <TYPE.white>Reward Balance Of</TYPE.white>
          <TYPE.white>
            {ethers.utils.formatUnits(poolInfo.rBalanceOf.toString())} {poolInfo.rTokenSymbol}
          </TYPE.white>
        </RowBetween>*/}

        <RowBetween>
          <TYPE.white>Limit Per User</TYPE.white>
          <TYPE.white>
            {poolInfo.sLimitPerUser.toSignificant(6, { groupSeparator: ',' })} {poolInfo.sToken.symbol}
          </TYPE.white>
        </RowBetween>

        {/*<RowBetween>
          <TYPE.white> Pool reward allocation </TYPE.white>
          <TYPE.white>{poolSharePercentage ? `${poolSharePercentage.toSignificant(4)}%` : '-'}</TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white> Emission rate </TYPE.white>
          <TYPE.white>
            {stakingInfo
              ? stakingInfo.active
                ? `${stakingInfo.poolRewardsPerBlock.toSignificant(4, { groupSeparator: ',' })} 
                ${govToken?.symbol} / block`
                : `0 ${govToken?.symbol} / block`
              : '-'}
          </TYPE.white>
        </RowBetween>*/}

        {/*<Break />

        <RowBetween>
          <TYPE.white>APR</TYPE.white>
          <TYPE.white fontWeight={500}>
            <b>
              {stakingInfo.apr && stakingInfo.apr.greaterThan('0')
                ? `${stakingInfo.apr.multiply('100').toSignificant(4, { groupSeparator: ',' })}%`
                : 'To be determined'}
            </b>
          </TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Total deposited</TYPE.white>
          <TYPE.white fontWeight={500}>
            <b>
              {stakingInfo && stakingInfo.valueOfTotalStakedAmountInUsd
                ? `$${stakingInfo.valueOfTotalStakedAmountInUsd.toFixed(0, { groupSeparator: ',' })}`
                : '-'}
            </b>
          </TYPE.white>
        </RowBetween>*/}
      </StatContainer>

      {/*{isStaking && (
        <>
          <Break />

          <StatContainerTop>
            <RowBetween>
              <TYPE.white>Your Total Rewards</TYPE.white>
              <TYPE.white>⚡ 0.000999 HEPA / $0.0000055 TODO</TYPE.white>
              <TYPE.white>
                <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                  ⚡
                </span>
                {stakingInfo
                  ? stakingInfo.active
                    ? `${stakingInfo.unlockedEarnedAmount.toSignificant(4, { groupSeparator: ',' })} ${
                        govToken?.symbol
                      } / $${
                        govTokenPrice
                          ? stakingInfo.unlockedEarnedAmount
                              .multiply(govTokenPrice?.raw)
                              .toSignificant(2, { groupSeparator: ',' })
                          : '0'
                      }`
                    : `0 ${govToken?.symbol}`
                  : '-'}
              </TYPE.white>
            </RowBetween>
          </StatContainerTop>
        </>
      )}*/}
    </Wrapper>
  )
}

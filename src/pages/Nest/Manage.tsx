import React from 'react'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'
import { CountUp } from 'use-count-up'

import { TYPE } from '../../theme'

import { useSingleNestPool } from '../../state/nest/hooks'

import { useColor } from '../../hooks/useColor'
import usePrevious from '../../hooks/usePrevious'

import { AutoColumn } from '../../components/Column'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { RowBetween } from '../../components/Row'
import { ButtonPrimary } from '../../components/Button'

import AwaitingRewards from '../../components/nest/AwaitingRewards'
import DepositModal from '../../components/nest/DepositModal'
import WithdrawModal from '../../components/nest/WithdrawModal'
import ClaimModal from '../../components/nest/ClaimModal'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/nest/styled'
import { JSBI } from '@venomswap/sdk'
import { useBlockNumber } from '../../state/application/hooks'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const BottomSection = styled(AutoColumn)`
  border-radius: 12px;
  width: 100%;
  position: relative;
`

const StyledDataCard = styled(DataCard)<{ bgColor?: any; showBackground?: any }>`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #1e1a31 0%, #3d51a5 100%);
  z-index: 2;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: ${({ theme, bgColor, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%,  ${showBackground ? theme.black : theme.bg5} 100%) `};
`

const StyledBottomCard = styled(DataCard)<{ dim: any }>`
  background: ${({ theme }) => theme.bg3};
  opacity: ${({ dim }) => (dim ? 0.4 : 1)};
  margin-top: -40px;
  padding: 0 1.25rem 1rem 1.25rem;
  padding-top: 32px;
  z-index: 1;
`

const PoolData = styled(DataCard)`
  background: none;
  border: 1px solid ${({ theme }) => theme.bg4};
  padding: 1rem;
  z-index: 1;
`
const DataRow = styled(RowBetween)`
  justify-content: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`
const Body = styled(AutoColumn)`
  width: 100%;
`

export default function Manage() {
  const params = useParams<{ address: string }>()
  const poolInfo = useSingleNestPool(params?.address ?? undefined)
  const latestBlockNumber = useBlockNumber()
  const isActive = Number(poolInfo.bonusEndBlock.toString()) >= Number(latestBlockNumber ?? 0)
  const isDeposited = isActive && Boolean(poolInfo.sFreeAmount.greaterThan(JSBI.BigInt(0)))
  const isClaimable = Boolean(poolInfo.rUnclaimedAmount.greaterThan(JSBI.BigInt(0)))
  const isWithdrawable = Boolean(poolInfo.sAmount.greaterThan(JSBI.BigInt(0)))
  const [showStakingModal, setShowStakingModal] = React.useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = React.useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = React.useState(false)
  // fade cards if nothing staked or nothing earned yet
  const disableTop = !poolInfo?.sAmount || poolInfo.sAmount.equalTo(JSBI.BigInt(0))

  const backgroundColor = useColor()

  const countUpAmount = poolInfo.rUnclaimedAmount?.toSignificant() ?? '0'
  const countUpAmountPrevious = usePrevious(countUpAmount) ?? '0'

  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <TYPE.mediumHeader style={{ margin: 0 }}>
          {poolInfo?.sToken?.symbol}-{poolInfo?.rToken?.symbol}
        </TYPE.mediumHeader>
        <DoubleCurrencyLogo currency0={undefined} currency1={undefined} size={24} />
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>Total Deposits</TYPE.body>
            <TYPE.body fontSize={24} fontWeight={500}>
              $ {poolInfo.totalDeposits?.toSignificant(6, { groupSeparator: ',' })}
            </TYPE.body>
          </AutoColumn>
        </PoolData>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>Bonus End Block</TYPE.body>
            <TYPE.body fontSize={24} fontWeight={500}>
              {poolInfo?.bonusEndBlock.toString()} block
            </TYPE.body>
          </AutoColumn>
        </PoolData>
      </DataRow>

      {poolInfo && poolInfo.isLoad && (
        <>
          <DepositModal isOpen={showStakingModal} onDismiss={() => setShowStakingModal(false)} poolInfo={poolInfo} />
          <WithdrawModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            poolInfo={poolInfo}
          />
          <ClaimModal
            isOpen={showClaimRewardModal}
            onDismiss={() => setShowClaimRewardModal(false)}
            poolInfo={poolInfo}
          />
        </>
      )}

      <Body gap="lg" justify="center">
        <BottomSection gap="lg" justify="center">
          <StyledDataCard disabled={disableTop} bgColor={backgroundColor}>
            <CardSection>
              <CardBGImage desaturate />
              <CardNoise />
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>Your {poolInfo.sToken?.symbol} deposits</TYPE.white>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <TYPE.white fontSize={36} fontWeight={600}>
                    {poolInfo.sAmount?.toSignificant(6, { groupSeparator: ',' }) ?? '-'}
                  </TYPE.white>
                  <TYPE.white>{poolInfo.sToken?.symbol}</TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
          </StyledDataCard>
          <StyledBottomCard dim={poolInfo?.sAmount?.equalTo(JSBI.BigInt(0))}>
            <CardBGImage desaturate />
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <TYPE.black>Your unclaimed {poolInfo.rToken?.symbol}</TYPE.black>
                </div>
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <TYPE.largeHeader fontSize={36} fontWeight={600}>
                  <CountUp
                    key={countUpAmount}
                    isCounting
                    decimalPlaces={4}
                    start={parseFloat(countUpAmountPrevious)}
                    end={parseFloat(countUpAmount)}
                    thousandsSeparator={','}
                    duration={1}
                  />
                </TYPE.largeHeader>
                <TYPE.black fontSize={16} fontWeight={500}></TYPE.black>
              </RowBetween>
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>

        <AwaitingRewards />

        <TYPE.main style={{ textAlign: 'center' }} fontSize={14}>
          <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
            ⭐️
          </span>
          When you deposit or withdraw the contract will automatically claim {poolInfo.rToken.symbol} on your behalf.
          <br />
          <br />
          <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
            💡
          </span>
          There are no lockups for these rewards. You&apos;ll receive 100% of the rewards you see unlocked.
        </TYPE.main>

        <DataRow style={{ marginBottom: '1rem' }}>
          {isDeposited && (
            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowStakingModal(true)}>
              Deposit
            </ButtonPrimary>
          )}
          {isClaimable && (
            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowClaimRewardModal(true)}>
              Claim
            </ButtonPrimary>
          )}
          {isWithdrawable && (
            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowUnstakingModal(true)}>
              Withdraw
            </ButtonPrimary>
          )}
        </DataRow>

        <TYPE.main>
          You have {poolInfo.sFreeAmount.toSignificant(6, { groupSeparator: ',' })} {poolInfo.sToken.symbol} tokens
          available to deposit
        </TYPE.main>
      </Body>
    </PageWrapper>
  )
}

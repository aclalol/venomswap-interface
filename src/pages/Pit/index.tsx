import React, { useCallback, useState } from 'react'
import { TokenAmount } from '@venomswap/sdk'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { useWalletModalToggle } from '../../state/application/hooks'
import { TYPE } from '../../theme'
import { RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import { ButtonPrimary } from '../../components/Button'
import SwapModal from '../../components/Pit/SwapModal'
import StakingModal from '../../components/Pit/StakingModal'
import ModifiedUnstakingModal from '../../components/Pit/UnstakingModal'
import ClaimModal from '../../components/Pit/ClaimModal'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { CountUp } from 'use-count-up'
import { BlueCard } from '../../components/Card'
import usePrevious from '../../hooks/usePrevious'
import { PIT_SETTINGS, PIT_STAKING } from '../../constants'
import { PIT_INTERFACE, PIT_STAKING_INTERFACE } from '../../constants/abis/pit'
import useGovernanceToken from 'hooks/useGovernanceToken'
import useTotalCombinedTVL from '../../hooks/useTotalCombinedTVL'
import usePitRatio from '../../hooks/usePitRatio'
import { useStakingInfo } from '../../state/stake/hooks'
import useFilterStakingInfos from '../../hooks/useFilterStakingInfos'
import CombinedTVL from '../../components/CombinedTVL'
import usePitXHepaToken from '../../hooks/usePitXHepaToken'
import GOVERNANCE_TOKEN_INTERFACE from '../../constants/abis/governanceToken'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`

const BottomSection = styled(AutoColumn)`
  border-radius: 12px;
  width: 100%;
  position: relative;
`

const StyledBottomCard = styled(DataCard)<{ dim: any }>`
  background: ${({ theme }) => theme.bg3};
  opacity: ${({ dim }) => (dim ? 0.4 : 1)};
  margin-top: -40px;
  padding: 0 1.25rem 1rem 1.25rem;
  padding-top: 32px;
  z-index: 1;
`

const CustomCard = styled(DataCard)`
  background: radial-gradient(
    76.02% 75.41% at 1.84% 0%,
    ${({ theme }) => theme.customCardGradientStart} 0%,
    ${({ theme }) => theme.customCardGradientEnd} 100%
  );
  overflow: hidden;
`

const DataRow = styled(RowBetween)`
  justify-content: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`

const NonCenteredDataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

export default function Pit() {
  const { account, chainId } = useActiveWeb3React()

  const isActive = true
  const filteredStakingInfos = useFilterStakingInfos(useStakingInfo(isActive), isActive)
  const TVLs = useTotalCombinedTVL(filteredStakingInfos)

  const govToken = useGovernanceToken() // HEPA
  const pitToken = usePitXHepaToken() // XHEPA contract address
  const pitStaking = chainId ? PIT_STAKING[chainId] : undefined // Staking contract address
  const pitSettings = chainId ? PIT_SETTINGS[chainId] : undefined // text: HepaPit
  const govRatio = usePitRatio() // xHEPA/HEPA
  const govTokenBalance: TokenAmount | undefined = useTokenBalance(
    account ?? undefined,
    govToken,
    'balanceOf',
    GOVERNANCE_TOKEN_INTERFACE
  ) // HEPA
  const userLiquidityUnstaked: TokenAmount | undefined = useTokenBalance(
    account ?? undefined,
    pitToken,
    'balanceOf',
    PIT_INTERFACE
  ) // Unstaked xHEPA
  // const adjustedPitBalance = govTokenPitTokenRatio ? pitBalance?.multiply(govTokenPitTokenRatio) : undefined
  const userLiquidityStaked: TokenAmount | undefined = useTokenBalance(
    account ?? undefined,
    pitStaking,
    'stakedAmounts',
    PIT_STAKING_INTERFACE
  ) // Staked xHEPA
  const withdrawableReward: TokenAmount | undefined = useTokenBalance(
    account ?? undefined,
    pitStaking,
    'withdrawableRewardOf',
    PIT_STAKING_INTERFACE
  ) // Withdrawable xHEPA
  const [{ showSwapModal, isHepa }, setShowSwapModal] = React.useState({ showSwapModal: false, isHepa: true })
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)

  const countUpAmount = userLiquidityUnstaked?.toFixed(6) ?? '0'
  const countUpAmountPrevious = usePrevious(countUpAmount) ?? '0'

  const toggleWalletModal = useWalletModalToggle()
  const handleDepositClick = useCallback(() => {
    if (account) {
      setShowStakingModal(true)
    } else {
      toggleWalletModal()
    }
  }, [account, toggleWalletModal])

  return (
    <PageWrapper gap="lg" justify="center">
      {govToken && pitToken && govRatio && govTokenBalance && userLiquidityUnstaked && (
        <>
          <SwapModal
            isOpen={showSwapModal}
            onDismiss={() => setShowSwapModal({ isHepa, showSwapModal: false })}
            ratio={govRatio} // Hepa * ratio = xHepa
            hepaToken={govToken}
            isHepa={isHepa}
            hepaTokenAmount={govTokenBalance}
            xHepaToken={pitToken}
            xHepaTokenAmount={userLiquidityUnstaked}
          />
          <StakingModal
            isOpen={showStakingModal}
            onDismiss={() => setShowStakingModal(false)}
            stakingToken={pitToken}
            userLiquidityUnstaked={userLiquidityUnstaked}
          />
          <ModifiedUnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            userLiquidityStaked={userLiquidityStaked}
            stakingToken={govToken}
          />
          <ClaimModal
            isOpen={showClaimModal}
            onDismiss={() => setShowClaimModal(false)}
            withdrawableReward={withdrawableReward}
            stakingToken={pitToken}
          />
        </>
      )}

      <TopSection gap="lg" justify="center">
        <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
          <NonCenteredDataRow style={{ alignItems: 'baseline' }}>
            <TYPE.mediumHeader></TYPE.mediumHeader>
            {TVLs?.totalPitTVL?.greaterThan('0') && (
              <TYPE.black>
                <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                  🏆 TVL: ${TVLs?.totalPitTVL?.toSignificant(6, { groupSeparator: ',' })}
                </span>
                <CombinedTVL />
              </TYPE.black>
            )}
          </NonCenteredDataRow>
        </AutoColumn>

        <BottomSection gap="lg" justify="center">
          <CustomCard>
            <CardSection>
              <CardBGImage desaturate />
              <CardNoise />
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>{pitSettings?.name} - DEX fee sharing</TYPE.white>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <TYPE.white fontSize={14}>
                    Stake your {pitToken?.symbol} tokens and earn 1/3rd of the generated trading fees.
                  </TYPE.white>
                </RowBetween>
                <br />
              </AutoColumn>
            </CardSection>
          </CustomCard>
          <StyledBottomCard dim={false}>
            <CardBGImage desaturate />
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <TYPE.black>
                    Your x{govToken?.symbol} Balance
                    {govRatio && (
                      <TYPE.italic display="inline" marginLeft="0.25em">
                        1 HEPA = 0.8 xHEPA
                      </TYPE.italic>
                    )}
                  </TYPE.black>
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
              </RowBetween>
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>

        {account && userLiquidityStaked && userLiquidityStaked?.greaterThan('0') && (
          <TYPE.main>
            You have {userLiquidityStaked?.toFixed(2, { groupSeparator: ',' })} {pitToken?.symbol} tokens staked in
            the&nbsp;{pitSettings?.name}.
          </TYPE.main>
        )}

        {account && (!userLiquidityStaked || userLiquidityStaked?.equalTo('0')) && (
          <TYPE.main>
            You have {userLiquidityUnstaked?.toFixed(2, { groupSeparator: ',' })} {pitToken?.symbol} tokens available to
            deposit to the {pitSettings?.name}.
          </TYPE.main>
        )}

        {account && (
          <DataRow style={{ marginBottom: '0rem' }}>
            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              width="160px"
              onClick={() => setShowSwapModal({ isHepa: true, showSwapModal: true })}
            >
              Swap HEPA
            </ButtonPrimary>

            <ButtonPrimary
              padding="8px"
              borderRadius="8px"
              width="160px"
              onClick={() => setShowSwapModal({ isHepa: false, showSwapModal: true })}
            >
              Swap xHEPA
            </ButtonPrimary>

            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleDepositClick}>
              Deposit
            </ButtonPrimary>

            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowUnstakingModal(true)}>
              Withdraw
            </ButtonPrimary>

            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowClaimModal(true)}>
              Claim
            </ButtonPrimary>
          </DataRow>
        )}

        <BlueCard>
          <AutoColumn gap="10px">
            <TYPE.main style={{ textAlign: 'center' }} fontSize={14}>
              <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
                💡
              </span>
              <b>Important:</b> Your {pitToken?.symbol} rewards will only be visible
              <br />
              after you withdraw your x{govToken?.symbol} tokens from the pool.
              <br />
              <br />
              {pitSettings?.name} does not have any withdrawal fees.
              <br />
              Tokens are also 100% unlocked when they are claimed.
              <br />
              <br />
              There is no fixed conversion rate from xHEPA to HEPA
            </TYPE.main>
          </AutoColumn>
        </BlueCard>
      </TopSection>
    </PageWrapper>
  )
}

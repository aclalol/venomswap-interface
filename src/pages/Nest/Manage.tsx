import React from 'react'
//, {
//   //  useCallback,
//   useState
//}
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'
// import { JSBI } from '@venomswap/sdk'
// import { RouteComponentProps } from 'react-router-dom'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
// import { useCurrency } from '../../hooks/Tokens'
// import { useWalletModalToggle } from '../../state/application/hooks'
import { TYPE } from '../../theme'

import { RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/nest/styled'
import {
  //  ButtonPrimary,
  ButtonEmpty
} from '../../components/Button'
// import StakingModal from '../../components/nest/StakingModal'
import AwaitingRewards from '../../components/nest/AwaitingRewards'
// import { useStakingInfo } from '../../state/stake/hooks'
// import ModifiedUnstakingModal from '../../components/nest/ModifiedUnstakingModal'
// import ClaimRewardModal from '../../components/nest/ClaimRewardModal'
// import { useTokenBalance } from '../../state/wallet/hooks'
// import { useActiveWeb3React } from '../../hooks'
import { useColor } from '../../hooks/useColor'
import { CountUp } from 'use-count-up'
// import { wrappedCurrency } from '../../utils/wrappedCurrency'
// import { currencyId } from '../../utils/currencyId'
// import { usePair } from '../../data/Reserves'
import usePrevious from '../../hooks/usePrevious'
// import {
//   BIG_INT_ZERO
//   //  LUQIDITY_ADD_URI
// } from '../../constants'
// import useGovernanceToken from '../../hooks/useGovernanceToken'
import {
  //  useNestInfo,
  useNestInfoSingle
} from '../../state/nest/hooks'
import { BigNumber, ethers } from 'ethers'
import { useBlockNumber } from '../../state/application/hooks'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

// const PositionInfo = styled(AutoColumn)<{ dim: any }>`
//   position: relative;
//   max-width: 640px;
//   width: 100%;
//   opacity: ${({ dim }) => (dim ? 0.6 : 1)};
// `

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

export default function Manage() {
  // const { account, chainId } = useActiveWeb3React()
  const params = useParams<{ address: string }>()
  const nestPool = useNestInfoSingle(params?.address ?? undefined)
  console.log('nestPoolsExtra: ', nestPool)
  console.log('BigInt: 1000: ', BigNumber.from(100))
  React.useEffect(() => {
    console.log('new Params: ', params)
  }, [params])
  // const [showStakingModal, setShowStakingModal] = useState(false)
  // const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  // const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)
  // fade cards if nothing staked or nothing earned yet
  if (!nestPool?.amount) {
    console.log('nestPoolsExtra.amount: ', nestPool?.amount)
  }
  const disableTop = !nestPool?.amount || nestPool.amount.eq('0')

  const backgroundColor = useColor()

  const countUpAmount = ethers.utils.formatUnits(nestPool.rewardDebt.toString()) ?? '0'
  const countUpAmountPrevious = usePrevious(countUpAmount) ?? '0'

  // const toggleWalletModal = useWalletModalToggle()

  // const handleDepositClick = useCallback(() => {
  //   if (account) {
  //     setShowStakingModal(true)
  //   } else {
  //     toggleWalletModal()
  //   }
  // }, [account, toggleWalletModal])

  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <TYPE.mediumHeader style={{ margin: 0 }}>
          {nestPool?.sTokenSymbol}-{nestPool?.rTokenSymbol}
        </TYPE.mediumHeader>
        <DoubleCurrencyLogo currency0={undefined} currency1={undefined} size={24} />
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>Total Deposits</TYPE.body>
            <TYPE.body fontSize={24} fontWeight={500}>
              {ethers.utils.formatUnits(nestPool.contractStakedBalance.toString())}
            </TYPE.body>
          </AutoColumn>
        </PoolData>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>Rewards end in</TYPE.body>
            <TYPE.body fontSize={24} fontWeight={500}>
              {nestPool?.lastRewardBlock.toString()} blocks
            </TYPE.body>
          </AutoColumn>
        </PoolData>
      </DataRow>

      {/*{nestPoolsExtra && (*/}
      {/*  <>*/}
      {/*    <StakingModal*/}
      {/*      isOpen={showStakingModal}*/}
      {/*      onDismiss={() => setShowStakingModal(false)}*/}
      {/*      stakingInfo={nestPoolsExtra}*/}
      {/*      userLiquidityUnstaked={nestPoolsExtra.balanceOf}*/}
      {/*    />*/}
      {/*    <ModifiedUnstakingModal*/}
      {/*      isOpen={showUnstakingModal}*/}
      {/*      onDismiss={() => setShowUnstakingModal(false)}*/}
      {/*      stakingInfo={nestPoolsExtra}*/}
      {/*    />*/}
      {/*    <ClaimRewardModal*/}
      {/*      isOpen={showClaimRewardModal}*/}
      {/*      onDismiss={() => setShowClaimRewardModal(false)}*/}
      {/*      stakingInfo={nestPoolsExtra}*/}
      {/*    />*/}
      {/*  </>*/}
      {/*)}*/}

      <AutoColumn gap="lg" justify="center">
        <RowBetween>
          <TYPE.white>Rewards end in</TYPE.white>
          <TYPE.white>{nestPool.lastRewardBlock.toString()} blocks</TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Bonus End Block</TYPE.white>
          <TYPE.white>{nestPool.bonusEndBlock.toString()} blocks</TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Last Reward Block</TYPE.white>
          <TYPE.white>{nestPool.lastRewardBlock.toString()} blocks</TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Reward per block</TYPE.white>
          <TYPE.white>
            {ethers.utils.formatUnits(nestPool.rewardPerBlock.toString())} {nestPool.rTokenSymbol}
          </TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>User Balance Of</TYPE.white>
          <TYPE.white>
            {ethers.utils.formatUnits(nestPool.sBalanceOf.toString())} {nestPool.sTokenSymbol}
          </TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>User Reward Balance Of</TYPE.white>
          <TYPE.white>
            {ethers.utils.formatUnits(nestPool.rBalanceOf.toString())} {nestPool.rTokenSymbol}
          </TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Deposited</TYPE.white>
          <TYPE.white>
            {ethers.utils.formatUnits(nestPool.amount.toString())} {nestPool.sTokenSymbol}
          </TYPE.white>
        </RowBetween>

        <RowBetween>
          <TYPE.white>Withdrawable Reward</TYPE.white>
          <TYPE.white>
            {ethers.utils.formatUnits(nestPool.rewardDebt.toString())} {nestPool.rTokenSymbol}
          </TYPE.white>
        </RowBetween>

        <BottomSection gap="lg" justify="center">
          <StyledDataCard disabled={disableTop} bgColor={backgroundColor}>
            <CardSection>
              <CardBGImage desaturate />
              <CardNoise />
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>Your {nestPool.sTokenSymbol} deposits</TYPE.white>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <TYPE.white fontSize={36} fontWeight={600}>
                    {ethers.utils.formatUnits(nestPool.amount.toString()) ?? '-'}
                  </TYPE.white>
                  <TYPE.white>{nestPool.sTokenSymbol}</TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
          </StyledDataCard>
          <StyledBottomCard dim={nestPool?.amount?.eq('0')}>
            <CardBGImage desaturate />
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <TYPE.black>Your unclaimed {nestPool.rTokenSymbol}</TYPE.black>
                </div>
                {nestPool?.rewardDebt && nestPool?.rewardDebt.eq('0') && (
                  <ButtonEmpty
                    padding="8px"
                    borderRadius="8px"
                    width="fit-content"
                    onClick={() => {
                      console.log('kek')
                    }}
                  >
                    Claim
                  </ButtonEmpty>
                )}
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
        {/*<>*/}
        {/*  {rewardsStarted && (*/}
        {/*    <TYPE.main style={{ textAlign: 'center' }} fontSize={14}>*/}
        {/*      <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>*/}
        {/*        ⭐️*/}
        {/*      </span>*/}
        {/*      When you deposit or withdraw the contract will automatically claim {govToken?.symbol} on your behalf.*/}
        {/*      <br />*/}
        {/*      <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>*/}
        {/*        💡*/}
        {/*      </span>*/}
        {/*       eslint-disable-next-line react/no-unescaped-entities */}
        {/*      There are no lockups for these rewards. You'll receive 100% of the rewards you see unlocked.*/}
        {/*    </TYPE.main>*/}
        {/*  )}*/}
        {/*</>*/}

        <AwaitingRewards />

        <DataRow style={{ marginBottom: '1rem' }}>
          {stakingInfo && stakingInfo.active && (
            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleDepositClick}>
              {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) ? 'Deposit' : `Deposit ${govToken?.symbol}`}
            </ButtonPrimary>
          )}

          {stakingInfo?.earnedAmount && JSBI.notEqual(BIG_INT_ZERO, stakingInfo?.earnedAmount?.raw) && (
            <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowClaimRewardModal(true)}>
              Claim
            </ButtonPrimary>
          )}

          {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) && (
            <>
              <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={() => setShowUnstakingModal(true)}>
                Withdraw
              </ButtonPrimary>
            </>
          )}
        </DataRow>
      </AutoColumn>
    </PageWrapper>
  )
}

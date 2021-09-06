import React from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
// import { STAKING_REWARDS_INFO } from '../../constants/staking'
import { useNestPoolsList } from '../../state/nest/hooks'
import { TYPE, StyledInternalLink } from '../../theme'
import PoolCard from '../../components/nest/PoolCard'
import { CustomButtonWhite } from '../../components/Button'
import { RowBetween } from '../../components/Row'
import { CardSection, ExtraDataCard, CardNoise, CardBGImage } from '../../components/nest/styled'
// import Loader from '../../components/Loader'
// import { useActiveWeb3React } from '../../hooks'
// import useTotalCombinedTVL from '../../hooks/useTotalCombinedTVL'
// import { OutlineCard } from '../../components/Card'
// import CombinedTVL from '../../components/CombinedTVL'
// TODO staking
// import useCalculateStakingInfoMembers from '../../hooks/useCalculateStakingInfoMembers'
// import useFilterStakingInfos from '../../hooks/useFilterStakingInfos'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`
const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`
const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`
const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
`};
`

export default function Nest() {
  // const {
  //   chainId,
  //   account
  // } = useActiveWeb3React()
  const activePoolsOnly = true
  const { poolsAddrs } = useNestPoolsList(activePoolsOnly)
  console.log('Nest Pools List: ', poolsAddrs)

  // const stakingRewardsExist = Boolean(typeof chainId === 'number' && (STAKING_REWARDS_INFO[chainId]?.length ?? 0)
  // > 0)

  // const activeStakingInfos = useFilterStakingInfos(stakingInfos, activePoolsOnly)
  // const inactiveStakingInfos = useFilterStakingInfos(stakingInfos, false)
  // const stakingInfoStats = useCalculateStakingInfoMembers(chainId)
  // const hasArchivedStakingPools =
  //   (stakingInfoStats?.inactive && stakingInfoStats?.inactive > 0) || inactiveStakingInfos?.length > 0

  // const TVLs = useTotalCombinedTVL(activeStakingInfos)

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <ExtraDataCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>HepaNest staking</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>Deposit tokens to receive rewards</TYPE.white>
              </RowBetween>{' '}
              {true && (
                <RowBetween>
                  <StyledInternalLink to={`/hepa/nest/archived`}>
                    <CustomButtonWhite padding="8px" borderRadius="8px">
                      Archived Pools
                    </CustomButtonWhite>
                  </StyledInternalLink>
                </RowBetween>
              )}
            </AutoColumn>
          </CardSection>
          {/*<CardBGImage />
          <CardNoise />*/}
        </ExtraDataCard>
      </TopSection>

      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>HepaNest</TYPE.mediumHeader>
          {/*{TVLs?.stakingPoolTVL?.greaterThan('0') && (
            <TYPE.black style={{ marginTop: '0.5rem' }}>
              <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                🏆
              </span>
              <CombinedTVL />
            </TYPE.black>
          )}*/}
        </DataRow>

        <PoolSection>
          {poolsAddrs.map((addr: string) => (
            <PoolCard key={addr} address={addr} />
          ))}
        </PoolSection>
        {/*<PoolSection>
          {account && stakingRewardsExist && stakingInfos?.length === 0 ? (
            <Loader style={{ margin: 'auto' }} />
          ) : account && !stakingRewardsExist ? (
            <OutlineCard>No active pools</OutlineCard>
          ) : account && stakingInfos?.length !== 0 && !activeStakingInfos ? (
            <OutlineCard>No active pools</OutlineCard>
          ) : !account ? (
            <OutlineCard>Please connect your wallet to see available pools</OutlineCard>
          ) : (
            activeStakingInfos?.map(stakingInfo => {
              return <PoolCard key={stakingInfo.pid} stakingInfo={stakingInfo} isArchived={false} />
            })
          )}
        </PoolSection>*/}
      </AutoColumn>
    </PageWrapper>
  )
}

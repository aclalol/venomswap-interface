import React from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { PoolInterface, useNestPoolsAddrsList } from '../../state/nest/hooks'
import { TYPE, StyledInternalLink } from '../../theme'
import PoolCard from '../../components/nest/PoolCard'
import { CustomButtonWhite } from '../../components/Button'
import { RowBetween } from '../../components/Row'
import { CardSection, ExtraDataCard, CardNoise, CardBGImage } from '../../components/nest/styled'
import { OutlineCard } from '../../components/Card'
import { ZERO_ADDRESS } from '../../constants'
import { useParams } from 'react-router-dom'
import { useActiveWeb3React } from '../../hooks'
import { Fraction, JSBI } from '@venomswap/sdk'

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
  const { account } = useActiveWeb3React()
  const poolsAddrs = useNestPoolsAddrsList()
  const { type } = useParams()
  const isArchived = React.useMemo(() => type === 'archive', [type])
  const [archivedPools, setArchivedPools] = React.useState<any>({})
  const [activePools, setActivePools] = React.useState<any>({})
  const [tvls, setTvl] = React.useState<any>({})
  const { shownArr, shownObj, handleSetPoolType, handleSetPoolTvl } = React.useMemo((): any => {
    const archivedPoolsArr = Object.keys(archivedPools)
    const activePoolsArr = Object.keys(activePools)
    const poolsAddrsObj = poolsAddrs.reduce((acc, addr) => {
      return {
        ...acc,
        [addr]: undefined
      }
    }, {})

    const _handleSetPoolType = (addr: string, isActive: boolean, pool: PoolInterface) => {
      if (addr === ZERO_ADDRESS) return

      if (!isActive && !archivedPools[addr]) setArchivedPools({ ...archivedPools, [addr]: pool })
      if (isActive && !activePools[addr]) setActivePools({ ...activePools, [addr]: pool })
    }
    const _handleSetPoolTvl = (addr: string, tvl: Fraction) => {
      setTvl({ ...tvls, [addr]: tvl })
    }

    if (archivedPoolsArr.length + activePoolsArr.length < poolsAddrs.length)
      return {
        shownArr: poolsAddrs,
        shownObj: poolsAddrsObj,
        handleSetPoolType: _handleSetPoolType,
        handleSetPoolTvl: _handleSetPoolTvl
      }

    return isArchived
      ? {
          shownArr: archivedPoolsArr,
          shownObj: archivedPools,
          handleSetPoolType: _handleSetPoolType,
          handleSetPoolTvl: _handleSetPoolTvl
        }
      : {
          shownArr: activePoolsArr,
          shownObj: activePools,
          handleSetPoolType: _handleSetPoolType,
          handleSetPoolTvl: _handleSetPoolTvl
        }
  }, [poolsAddrs, isArchived, archivedPools, activePools, setActivePools, tvls, setTvl, setArchivedPools])
  const totalNestTvl = Object.values(tvls).reduce((totalTvl: any, i: any) => {
    return totalTvl.add(i)
  }, new Fraction(JSBI.BigInt(0))) as any
  const assets = React.useMemo(() => {
    const activePoolsCount = Object.keys(activePools).length
    const archivedPoolsCount = Object.keys(archivedPools).length

    return {
      isShow: isArchived ? activePoolsCount !== 0 : archivedPoolsCount !== 0,
      to: isArchived ? '/hepa/nest/active' : '/hepa/nest/archive',
      text: isArchived
        ? `Active Pools ${activePoolsCount ? `(${activePoolsCount})` : ''}`
        : `Archived Pools ${archivedPoolsCount ? `(${archivedPoolsCount})` : ''}`,
      emptyText: isArchived ? 'No archived pool' : 'No active pool'
    }
  }, [isArchived, activePools, archivedPools])

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <ExtraDataCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>HepaDrome staking</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>Deposit tokens to receive rewards</TYPE.white>
              </RowBetween>{' '}
              {account && (
                <RowBetween>
                  <StyledInternalLink to={assets.to}>
                    <CustomButtonWhite padding="8px" borderRadius="8px">
                      {assets.text}
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
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>HepaDrome</TYPE.mediumHeader>
          {totalNestTvl && (
            <TYPE.black style={{ marginTop: '0.5rem' }}>
              <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                🏆 TVL: ${totalNestTvl.toSignificant(6, { groupSeparator: ',' })}
              </span>
            </TYPE.black>
          )}
        </DataRow>

        <PoolSection>
          {account ? (
            <>
              {poolsAddrs.length !== 0 ? (
                <>
                  {poolsAddrs.map((addr: string) => (
                    <PoolCard
                      isShow={shownArr.indexOf(addr) === -1}
                      key={addr}
                      tvls={tvls}
                      address={addr}
                      pool={shownObj[addr]}
                      handleSetPoolType={handleSetPoolType}
                      handleSetPoolTvl={handleSetPoolTvl}
                    />
                  ))}
                </>
              ) : (
                <OutlineCard>{assets.emptyText}</OutlineCard>
              )}
            </>
          ) : (
            <OutlineCard>Please connect your wallet to see available pools</OutlineCard>
          )}
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}

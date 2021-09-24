import React from 'react'
import styled from 'styled-components'
import { PoolInterface, useNestPoolsAddrsList } from '../../state/nest/hooks'
import PoolCard from '../../components/nest/PoolCard'
import { OutlineCard } from '../Card'
import { NEST_SETTINGS, PIT_SETTINGS, ZERO_ADDRESS } from '../../constants'
import { useParams } from 'react-router-dom'
import { useActiveWeb3React } from '../../hooks'
import { Fraction, JSBI } from '@venomswap/sdk'
import { useStakingInfo } from '../../state/stake/hooks'
import useTotalTVL from '../../hooks/useTotalTVL'
import { CustomMouseoverTooltip } from '../Tooltip/custom'
import usePitTVL from '../../hooks/usePitTVL'

const PoolSection = styled.div`
  display: none;
`

export default function TotalCombinedTVL() {
  const totalPitTVL = usePitTVL()
  const { account, chainId } = useActiveWeb3React()
  const pitSettings = chainId ? PIT_SETTINGS[chainId] : undefined
  const nsetSettings = chainId ? NEST_SETTINGS[chainId] : undefined
  const activePoolsOnly = true
  const stakingInfos = useStakingInfo(activePoolsOnly)
  const totalStakingPoolTVL = useTotalTVL(stakingInfos)
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
  const totalCombinedTVL = React.useMemo(() => {
    if (totalStakingPoolTVL && totalPitTVL && totalNestTvl) {
      return totalStakingPoolTVL.add(totalPitTVL).add(totalNestTvl)
    }
    return new Fraction(JSBI.BigInt(0))
  }, [totalStakingPoolTVL, totalPitTVL, totalNestTvl])

  return (
    <>
      <CustomMouseoverTooltip
        element={
          <>
            {totalStakingPoolTVL?.greaterThan('0') && (
              <>
                <b>Staking:</b> $
                {totalStakingPoolTVL.toSignificant(8, {
                  groupSeparator: ','
                })}
                <br />
              </>
            )}
            {totalPitTVL?.greaterThan('0') && (
              <>
                <b>{pitSettings?.name}:</b> ${totalPitTVL.toSignificant(8, { groupSeparator: ',' })}
                <br />
              </>
            )}
            {totalNestTvl?.greaterThan('0') && (
              <>
                <b>{nsetSettings?.name}:</b> ${totalNestTvl.toSignificant(8, { groupSeparator: ',' })}
                <br />
              </>
            )}
            {totalCombinedTVL?.greaterThan('0') && (
              <>
                <b>Total:</b> ${totalCombinedTVL.toSignificant(8, { groupSeparator: ',' })}
              </>
            )}
          </>
        }
      >
        {totalCombinedTVL?.greaterThan('0') && (
          <>🏆 TVL: ${totalCombinedTVL.toSignificant(8, { groupSeparator: ',' })}</>
        )}
      </CustomMouseoverTooltip>

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
    </>
  )
}

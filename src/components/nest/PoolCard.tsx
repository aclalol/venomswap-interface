import React from 'react'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import styled from 'styled-components'
import { TYPE, StyledInternalLink } from '../../theme'
import { ButtonPrimary } from '../Button'
import { Break, CardNoise, CardBGImage } from './styled'
import { PoolInterface, useSingleNestPool } from '../../state/nest/hooks'
import { Fraction, JSBI } from '@venomswap/sdk'
import { useBlockNumber } from '../../state/application/hooks'
import Loader from '../Loader'
import { useColor } from '../../hooks/useColor'

const LoaderWrapper = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #001d4c 0%, #000024 100%);
  opacity: 1;
  z-index: 10;
`

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

const Wrapper = styled(AutoColumn)<{ showBackground?: boolean; bgColor?: any; isShow: boolean }>`
  ${({ isShow }) => (isShow ? 'display: none;' : '')}
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
  grid-template-columns: 1fr 120px;
  grid-gap: 0px;
  align-items: center;
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr 96px;
  `};
`

export default function PoolCard({
  address,
  handleSetPoolType,
  handleSetPoolTvl,
  pool,
  tvls,
  isShow
}: {
  address: string
  handleSetPoolType: (addr: string, isActive: boolean, pool: PoolInterface) => void
  handleSetPoolTvl: (addr: string, tvl: Fraction) => void
  pool: PoolInterface | undefined
  tvls: any
  isShow: boolean
}) {
  const poolInfo = useSingleNestPool(address, pool)
  const latestBlockNumber = useBlockNumber()
  const { isActive, isStaking } = React.useMemo(
    () => ({
      isActive: Number(poolInfo.bonusEndBlock.toString()) >= Number(latestBlockNumber ?? 0),
      isStaking: Boolean(poolInfo.sAmount.greaterThan(JSBI.BigInt(0)))
    }),
    [poolInfo, latestBlockNumber]
  )
  React.useEffect(() => {
    if (poolInfo.isLoad && !pool) {
      handleSetPoolType(poolInfo.poolAddress, isActive, poolInfo)
    }
    if (poolInfo.isLoadTvl && !tvls[poolInfo.poolAddress]) {
      handleSetPoolTvl(poolInfo.poolAddress, poolInfo.tvl)
    }
  }, [poolInfo, pool, handleSetPoolType])
  const backgroundColor = useColor(poolInfo?.sToken)
  let poolInfoApr
  try {
    poolInfoApr = poolInfo.apr.greaterThan(JSBI.BigInt(0))
      ? `${poolInfo.apr.divide(JSBI.BigInt(100)).toSignificant(6, { groupSeparator: ',' })}%`
      : '--'
  } catch (e) {
    poolInfoApr = '--'
  }

  return (
    <Wrapper showBackground={!poolInfo.isLoad && isStaking} bgColor={backgroundColor} isShow={isShow}>
      {!poolInfo.isLoad && (
        <>
          <LoaderWrapper />
          <Loader
            stroke="aliceblue"
            style={{
              zIndex: '15',
              position: 'absolute',
              height: 60,
              width: 60,
              top: 'calc(50% - 30px)',
              left: 'calc(50% - 30px)'
            }}
          />
        </>
      )}
      <CardBGImage desaturate />
      <CardNoise />

      <TopSection>
        <TYPE.white fontWeight={600} fontSize={24} style={{ marginLeft: '8px' }}>
          {`Stake: ${poolInfo.sToken.symbol} - Earn: ${poolInfo.rToken.symbol}`}
        </TYPE.white>

        <StyledInternalLink to={`/hepa/nest/pool/${poolInfo.poolAddress}`} style={{ width: '100%' }}>
          <ButtonPrimary disabled={!poolInfo.isLoad} padding="8px" borderRadius="8px">
            {!isStaking && isActive ? 'Deposit' : 'Manage'}
          </ButtonPrimary>
        </StyledInternalLink>
      </TopSection>

      <StatContainer>
        <RowBetween>
          <TYPE.white>Bonus end block</TYPE.white>
          <TYPE.white>{poolInfo.bonusEndBlock.toString()} block</TYPE.white>
        </RowBetween>
        <RowBetween>
          <TYPE.white>Reward per block</TYPE.white>
          <TYPE.white>
            {poolInfo.rPerBlockAmount.toSignificant(6, { groupSeparator: ',' })} {poolInfo.rToken.symbol}
          </TYPE.white>
        </RowBetween>
        <Break />
        <RowBetween>
          <TYPE.white>APR</TYPE.white>
          <TYPE.white>{poolInfoApr}</TYPE.white>
        </RowBetween>
        <RowBetween>
          <TYPE.white>Total deposited</TYPE.white>
          <TYPE.white>
            {poolInfo.sAllAmount.toSignificant(6, { groupSeparator: ',' })} {poolInfo.sToken.symbol}
          </TYPE.white>
        </RowBetween>
        {isStaking && (
          <>
            <Break />
            <RowBetween>
              <TYPE.white>Your Deposit</TYPE.white>
              <TYPE.white>
                {poolInfo.sAmount.toSignificant(6, { groupSeparator: ',' })} {poolInfo.sToken.symbol} /{' '}
                {poolInfo.sLimitPerUser.toSignificant(6, { groupSeparator: ',' })} {poolInfo.sToken.symbol}
              </TYPE.white>
            </RowBetween>
            <RowBetween>
              <TYPE.white>Your Rewards</TYPE.white>
              <TYPE.white>
                {poolInfo.rUnclaimedAmount.toSignificant(6, { groupSeparator: ',' })} {poolInfo.rToken.symbol}
              </TYPE.white>
            </RowBetween>
          </>
        )}
      </StatContainer>
    </Wrapper>
  )
}

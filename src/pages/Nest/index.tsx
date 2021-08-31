import React from 'react'
import styled from 'styled-components'
import { AutoColumn } from '../../components/Column'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

export default function HepaNest() {
  return (
    <PageWrapper>
      <div>Stake</div>
      <div>
        <div>Deposit: </div>
        <div>Rewards: </div>
      </div>
      <div>unclaimed</div>
      <div>info</div>
      <div>info</div>
      <div>info</div>
    </PageWrapper>
  )
}

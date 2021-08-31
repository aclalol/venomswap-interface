import React, { useState } from 'react'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonError } from '../Button'
import { usePitStakingContract } from '../../hooks/useContract'
import { SubmittedView, LoadingView } from '../ModalViews'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useActiveWeb3React } from '../../hooks'
import { PIT_SETTINGS } from '../../constants'
import { JSBI, Token, TokenAmount } from '@venomswap/sdk'
import { GAS_LIMIT } from '../../constants/pit'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`
interface ClaimModalProps {
  isOpen: boolean
  onDismiss: () => void
  withdrawableReward: TokenAmount | undefined
  stakingToken: Token
}

export default function ClaimModal({ isOpen, onDismiss, withdrawableReward, stakingToken }: ClaimModalProps) {
  const { account, chainId } = useActiveWeb3React()

  // const blockchain = useBlockchain()
  const pitSettings = chainId ? PIT_SETTINGS[chainId] : undefined

  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [failed, setFailed] = useState<boolean>(false)

  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    setFailed(false)
    onDismiss()
  }

  const rewardsAreClaimable = withdrawableReward ? JSBI.GT(JSBI.BigInt(withdrawableReward.raw), 0) : false
  const pitStaking = usePitStakingContract()
  async function onClaimRewards() {
    if (pitStaking) {
      setAttempting(true)

      try {
        // const estimatedGas = await pitStaking.estimateGas.convertMultiple()
        await pitStaking
          .withdrawReward({
            gasLimit: GAS_LIMIT // calculateGasMargin(estimatedGas)
          })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Claim ${pitSettings?.name} rewards`
            })
            setHash(response.hash)
          })
          .catch((error: any) => {
            setAttempting(false)
            if (error?.code === -32603) {
              setFailed(true)
            }
            console.log(error)
          })
      } catch (error) {
        setAttempting(false)
        setFailed(true)
        console.log(error)
      }
    }
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && !failed && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader> Claim</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <TYPE.body fontSize={32} style={{ textAlign: 'center' }}>
            <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
              💎{' '}
              {rewardsAreClaimable &&
                `${withdrawableReward?.toFixed(2, { groupSeparator: '' })} ${stakingToken?.symbol}`}
            </span>
          </TYPE.body>
          {rewardsAreClaimable && (
            <>
              <TYPE.body fontSize={14} style={{ textAlign: 'center' }}>
                When you claim rewards, collected LP fees will be used to market buy {stakingToken?.symbol}.
                <br />
                <br />
                The purchased {stakingToken?.symbol} tokens will then be distributed to the {pitSettings?.name} stakers
                as a reward.
              </TYPE.body>
              <ButtonError disabled={!!error} error={!!error} onClick={onClaimRewards}>
                {error ?? 'Claim'}
              </ButtonError>
            </>
          )}
          {!rewardsAreClaimable && (
            <TYPE.body fontSize={14} style={{ textAlign: 'center' }}>
              There are no trading fee rewards available
              <br />
              to claim right now.
              <br />
              <br />
              Please wait a little bit and then check back here again.
            </TYPE.body>
          )}
        </ContentWrapper>
      )}
      {attempting && !hash && !failed && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>Claiming {pitSettings?.name} rewards</TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && !failed && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>Claimed {stakingToken?.symbol}!</TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
      {!attempting && !hash && failed && (
        <ContentWrapper gap="sm">
          <RowBetween>
            <TYPE.mediumHeader>
              <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                ⚠️
              </span>
              Error!
            </TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            Your transaction couldn&apos;t be submitted.
            <br />
            You may have to increase your Gas Price (GWEI) settings!
          </TYPE.subHeader>
        </ContentWrapper>
      )}
    </Modal>
  )
}

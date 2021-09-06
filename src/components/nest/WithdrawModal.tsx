import React, { useState, useCallback } from 'react'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonError } from '../Button'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { PoolInterface, useDerivedUnstakeInfo } from '../../state/nest/hooks'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { LoadingView, SubmittedView } from '../ModalViews'
import { useNestPoolContract } from '../../hooks/useContract'
import { GAS_LIMIT } from '../../constants/pit'
import CurrencyInputPanelLight from '../CurrencyInputPanel/CurrencyInputPanelLight'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface WithdrawModalProps {
  isOpen: boolean
  onDismiss: () => void
  poolInfo: PoolInterface
}

export default function WithdrawModal({ isOpen, onDismiss, poolInfo }: WithdrawModalProps) {
  // track and parse user input
  const [typedValue, setTypedValue] = useState('')
  const { parsedAmount, error } = useDerivedUnstakeInfo(typedValue, poolInfo.sAmount)

  // state for pending and submitted txn views
  const addTransaction = useTransactionAdder()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const [failed, setFailed] = useState<boolean>(false)
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    setFailed(false)
    onDismiss()
  }, [onDismiss])

  const nestPoolContract = useNestPoolContract(poolInfo.poolAddress)

  async function onWithdraw() {
    if (nestPoolContract && poolInfo?.isLoad) {
      setAttempting(true)

      const formattedAmount = `0x${parsedAmount?.raw.toString(16)}`

      await nestPoolContract
        .withdraw(formattedAmount, {
          gasLimit: GAS_LIMIT // TODO calculateGasMargin(estimatedGas)
        })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Withdraw deposited liquidity`
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
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typedValue: string) => {
    setTypedValue(typedValue)
  }, [])

  // used for max input button
  const maxAmountInput = maxAmountSpend(poolInfo.sAmount)
  const atMaxAmount = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  const handleMax = useCallback(() => {
    maxAmountInput && onUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && !failed && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Withdraw</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>

          <CurrencyInputPanelLight
            value={typedValue}
            onUserInput={onUserInput}
            onMax={handleMax}
            showMaxButton={!atMaxAmount}
            currency={poolInfo.sToken}
            overrideSelectedCurrencyBalance={maxAmountInput}
            label={''}
            customBalanceText={'Available to withdraw: '}
            id="withdraw-nest-pool-token"
          />

          <RowBetween>
            <ButtonError disabled={!!error} error={!!error && !!parsedAmount} onClick={onWithdraw}>
              {error ?? 'Withdraw'}
            </ButtonError>
          </RowBetween>
        </ContentWrapper>
      )}
      {attempting && !hash && !failed && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Withdrawing Liquidity</TYPE.largeHeader>
            <TYPE.body fontSize={20}>
              {parsedAmount?.toSignificant(4)} {poolInfo.sToken.symbol}
            </TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && !failed && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>
              Withdraw {parsedAmount?.toSignificant(4)} {poolInfo.sToken.symbol}
            </TYPE.body>
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

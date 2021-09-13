import { CurrencyAmount, Fraction, Token, TokenAmount } from '@venomswap/sdk'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { ButtonError, ButtonConfirmed } from '../Button'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { Wrapper } from '../swap/styleds'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { CloseIcon, TYPE } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import Modal from '../Modal'
import CurrencyInputPanelLight from '../CurrencyInputPanel/CurrencyInputPanelLight'
import { usePitContract } from '../../hooks/useContract'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { LoadingView, SubmittedView } from '../ModalViews'
import { useDerivedSwapInfo } from '../../state/pit/hooks'
import { GAS_LIMIT } from '../../constants/pit'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface SwapModalProps {
  isOpen: boolean
  onDismiss: () => void
  hepaToken: Token
  hepaTokenAmount: TokenAmount
  xHepaToken: Token
  xHepaTokenAmount: TokenAmount
  ratio: Fraction // xhepa = ratio * hepa
  isHepa: boolean
}
interface StateInterface {
  token: Token
  max: TokenAmount
  amount: string
}

export default function SwapModal({
  isOpen,
  onDismiss,
  hepaToken,
  hepaTokenAmount,
  xHepaToken,
  xHepaTokenAmount,
  ratio,
  isHepa
}: SwapModalProps) {
  const [straight, setValues] = useState<StateInterface>({
    token: isHepa ? hepaToken : xHepaToken,
    max: isHepa ? hepaTokenAmount : xHepaTokenAmount,
    amount: ''
  })
  React.useEffect(() => {
    setValues({
      token: isHepa ? hepaToken : xHepaToken,
      max: isHepa ? hepaTokenAmount : xHepaTokenAmount,
      amount: ''
    })
  }, [isHepa])
  const onUserInput = useCallback(
    (value: string) => {
      setValues({
        ...straight,
        amount: value
      })
    },
    [straight, setValues]
  )
  const { parsedAmount: parsedStraigntAmount, error } = useDerivedSwapInfo(
    straight.amount,
    straight.token,
    straight.max
  )
  const swapContract = usePitContract()
  const deadline = useTransactionDeadline()
  const addTransaction = useTransactionAdder()
  const [approval, approveCallback] = useApproveCallback(parsedStraigntAmount, swapContract?.address)
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const [failed, setFailed] = useState<boolean>(false)
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    setFailed(false)
    onDismiss()
  }, [onDismiss])
  async function onAttemptToApprove() {
    if (!swapContract || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = straight.amount
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    return approveCallback()
  }
  const handleSwap = async () => {
    setAttempting(true)
    if (swapContract && parsedStraigntAmount && deadline) {
      if (approval === ApprovalState.APPROVED) {
        const formattedAmount = `0x${parsedStraigntAmount.raw.toString(16)}`
        const method = straight.token.name === 'Hepa' ? swapContract.swapHepa : swapContract.swapBack

        await method(formattedAmount, {
          gasLimit: GAS_LIMIT // TODO calculateGasMargin(estimatedGas)
        })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Swap ${isHepa ? 'HEPA' : 'xHEPA'} on ${isHepa ? 'xHEPA' : 'HEPA'}`
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
      } else {
        setAttempting(false)
        throw new Error('Attempting to stake without approval or a signature. Please contact support.')
      }
    }
  }

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(straight.max)
  const atMaxAmountInput = Boolean(maxAmountInput && parsedStraigntAmount?.equalTo(maxAmountInput))
  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss}>
      {!attempting && !hash && !failed && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Swap</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>

          <Wrapper id="swap-page">
            <AutoColumn gap={'md'}>
              <CurrencyInputPanelLight
                label={'From'}
                value={straight.amount}
                showMaxButton={!atMaxAmountInput}
                currency={straight.token}
                onUserInput={onUserInput}
                onMax={handleMaxInput}
                otherCurrency={isHepa ? xHepaToken : hepaToken}
                id="swap-currency-input"
              />

              <RowBetween>
                <ButtonConfirmed
                  mr="0.5rem"
                  onClick={onAttemptToApprove}
                  confirmed={approval === ApprovalState.APPROVED}
                  disabled={approval !== ApprovalState.NOT_APPROVED}
                >
                  Approve
                </ButtonConfirmed>
                <ButtonError
                  disabled={!!error || approval !== ApprovalState.APPROVED}
                  error={!!error}
                  onClick={handleSwap}
                >
                  {error ?? 'Swap'}
                </ButtonError>
              </RowBetween>
              <RowBetween>
                <TYPE.small>Price</TYPE.small>
                <TYPE.small>1 HEPA = 0.8 xHEPA</TYPE.small>
              </RowBetween>
            </AutoColumn>
          </Wrapper>
        </ContentWrapper>
      )}
      {attempting && !hash && !failed && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>
              {`Swapped ${isHepa ? 'xHEPA' : 'HEPA'} on ${isHepa ? 'xHEPA' : 'HEPA'}`}
            </TYPE.largeHeader>
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && !failed && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body textAlign="center" fontSize={20}>
              {`Swapped ${isHepa ? 'xHEPA' : 'HEPA'} on ${isHepa ? 'xHEPA' : 'HEPA'}`}
            </TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
      {!attempting && !hash && failed && (
        <AutoColumn gap="sm">
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
        </AutoColumn>
      )}
    </Modal>
  )
}

import { CurrencyAmount, Fraction, Token, TokenAmount } from '@venomswap/sdk'
import React, { useCallback, useContext, useState } from 'react'
import { ArrowDown } from 'react-feather'
import styled, { ThemeContext } from 'styled-components'
import { ButtonError, ButtonConfirmed } from '../Button'
import { AutoColumn } from '../Column'
import { AutoRow, RowBetween } from '../Row'
import { ArrowWrapper, Wrapper } from '../swap/styleds'
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
}
interface StateInterface {
  token: Token
  max: TokenAmount
  amount: string
  calcOpposite: (a: Fraction) => string
}

export default function SwapModal({
  isOpen,
  onDismiss,
  hepaToken,
  hepaTokenAmount,
  xHepaToken,
  xHepaTokenAmount,
  ratio
}: SwapModalProps) {
  const theme = useContext(ThemeContext)

  const [[straight, unstraight], setValues] = useState<[StateInterface, StateInterface]>([
    {
      token: hepaToken,
      max: hepaTokenAmount,
      amount: '',
      calcOpposite: (a: Fraction) => a.multiply(ratio).toSignificant(6) // xHepa = Hepa * ration
    },
    {
      token: xHepaToken,
      max: xHepaTokenAmount,
      amount: '',
      calcOpposite: (a: Fraction) => a.divide(ratio).toSignificant(6) // Hepa = xHepa / ratio
    }
  ])
  const onUserInput = useCallback(
    (value: string, valueN?: CurrencyAmount) => {
      setValues([
        {
          ...straight,
          amount: value
        },
        {
          ...unstraight,
          amount: unstraight.calcOpposite(valueN ? valueN : new Fraction(value))
        }
      ])
    },
    [straight, unstraight, setValues]
  )
  const onUserOutput = useCallback(
    (value: string, valueN?: CurrencyAmount) => {
      setValues([
        {
          ...straight,
          amount: straight.calcOpposite(valueN ? valueN : new Fraction(value))
        },
        {
          ...unstraight,
          amount: value
        }
      ])
    },
    [straight, unstraight, setValues]
  )
  const swapInputs = useCallback(() => {
    setValues([unstraight, straight])
  }, [straight, unstraight, setValues])
  const { parsedAmount: parsedStraigntAmount, error } = useDerivedSwapInfo(
    straight.amount,
    straight.token,
    straight.max
  )
  const xHepaContract = usePitContract()
  const deadline = useTransactionDeadline()
  const addTransaction = useTransactionAdder()
  const [approval, approveCallback] = useApproveCallback(parsedStraigntAmount, xHepaContract?.address)
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
    if (!xHepaContract || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = straight.amount
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    return approveCallback()
  }
  const handleSwap = async () => {
    setAttempting(true)
    if (xHepaContract && parsedStraigntAmount && deadline) {
      if (approval === ApprovalState.APPROVED) {
        const formattedAmount = `0x${parsedStraigntAmount.raw.toString(16)}`
        const method = straight.token.name === 'Hepa' ? xHepaContract.swapHepa : xHepaContract.swapBack

        await method(formattedAmount, {
          gasLimit: GAS_LIMIT // TODO calculateGasMargin(estimatedGas)
        })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Swap ${straight.token?.name} on ${unstraight.token?.name}`
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
    maxAmountInput && onUserInput(maxAmountInput.toExact(), maxAmountInput)
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
                otherCurrency={unstraight.token}
                id="swap-currency-input"
              />

              <AutoColumn justify="space-between">
                <AutoRow justify={'center'} style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable>
                    <ArrowDown
                      size="16"
                      onClick={() => {
                        swapInputs()
                      }}
                      color={theme.primary1}
                    />
                  </ArrowWrapper>
                </AutoRow>
              </AutoColumn>

              <CurrencyInputPanelLight
                value={unstraight.amount}
                onUserInput={onUserOutput}
                label={'To'}
                showMaxButton={false}
                currency={unstraight.token}
                otherCurrency={straight.token}
                id="swap-currency-output"
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
                <TYPE.small>
                  1 {xHepaToken.symbol} = {ratio?.toSignificant(4)} {hepaToken.symbol}
                </TYPE.small>
              </RowBetween>
            </AutoColumn>
          </Wrapper>
        </ContentWrapper>
      )}
      {attempting && !hash && !failed && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>
              {`Swapped ${straight.amount} ${straight.token.symbol} for ${unstraight.amount} ${unstraight.token.symbol} on ${unstraight?.token?.name}`}
            </TYPE.largeHeader>
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && !failed && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body textAlign="center" fontSize={20}>
              {`Swapped ${straight.amount} ${straight.token.symbol} for ${unstraight.amount} ${unstraight.token.symbol} on ${unstraight?.token?.name}`}
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

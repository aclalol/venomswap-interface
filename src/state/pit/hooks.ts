import { CurrencyAmount, JSBI, Token, TokenAmount } from '@venomswap/sdk'
import { useActiveWeb3React } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'

export function useDerivedSwapInfo(
  typedValue: string,
  token: Token,
  tokenAmount: TokenAmount | undefined
): {
  parsedAmount?: CurrencyAmount
  parsedAmount1?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  let error

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, token)
  let parsedAmount = undefined

  if (parsedInput && tokenAmount) {
    const outOfBound = JSBI.lessThanOrEqual(parsedInput.raw, tokenAmount.raw)
    if (!outOfBound) {
      error = 'Insufficient'
    } else {
      parsedAmount = parsedInput
    }
  } else {
    error = 'Enter an amount'
  }

  if (!account) {
    error = 'Connect Wallet'
  }

  return {
    parsedAmount,
    error
  }
}

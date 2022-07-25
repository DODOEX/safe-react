import { getBalances, SafeBalanceResponse, TokenInfo, TokenType } from '@gnosis.pm/safe-react-gateway-sdk'
import BigNumber from 'bignumber.js'
import { _getChainId } from 'src/config'
import { getWeb3ReadOnly } from 'src/logic/wallets/getWeb3'
import { checksumAddress } from 'src/utils/checksumAddress'

export type TokenBalance = {
  tokenInfo: TokenInfo
  balance: string
  fiatBalance: string
  fiatConversion: string
}

type FetchTokenCurrenciesBalancesProps = {
  safeAddress: string
  selectedCurrency: string
  excludeSpamTokens?: boolean
  trustedTokens?: boolean
}

export const fetchTokenCurrenciesBalances = async ({
  safeAddress,
  selectedCurrency,
  excludeSpamTokens = true,
  trustedTokens = false,
}: FetchTokenCurrenciesBalancesProps): Promise<SafeBalanceResponse> => {
  const address = checksumAddress(safeAddress)
  const web3 = getWeb3ReadOnly()
  const erc20Instance = new web3.eth.Contract(
    [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
        ],
        name: 'balanceOf',
        outputs: [
          {
            internalType: 'uint256',
            name: 'balance',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  )
  const [ETHBalance, Token1Balance] = await Promise.all([
    web3.eth.getBalance(address),
    erc20Instance.methods.balanceOf(address).call(),
  ])
  return {
    fiatTotal: '0',
    items: [
      {
        tokenInfo: {
          type: TokenType.NATIVE_TOKEN,
          address: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          symbol: 'BNB',
          name: 'BNB',
          logoUri: 'https://safe-transaction-assets.gnosis-safe.io/chains/56/currency_logo.png',
        },
        balance: new BigNumber(ETHBalance).toString(),
        fiatBalance: '0.00000',
        fiatConversion: '0',
      },
      {
        tokenInfo: {
          type: TokenType.ERC20,
          address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
          decimals: 18,
          symbol: 'USDC',
          name: 'USDC',
          logoUri: '',
        },
        balance: new BigNumber(Token1Balance).toString(),
        fiatBalance: '0.00000',
        fiatConversion: '0',
      },
    ],
  }
  // return getBalances(_getChainId(), address, selectedCurrency, {
  //   exclude_spam: excludeSpamTokens,
  //   trusted: trustedTokens,
  // })
}

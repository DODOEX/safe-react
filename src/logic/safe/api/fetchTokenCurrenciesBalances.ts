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

const getBalanceCall = (address, tokenAddress) => {
  const web3 = getWeb3ReadOnly()
  let balanceCall
  if (tokenAddress === '0x0000000000000000000000000000000000000000') {
    balanceCall = web3.eth.getBalance(address)
  } else {
    const instance = new web3.eth.Contract(
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
      tokenAddress,
    )
    balanceCall = instance.methods.balanceOf(address).call()
  }
  return balanceCall
}

export const fetchTokenCurrenciesBalances = async ({
  safeAddress,
  selectedCurrency,
  excludeSpamTokens = true,
  trustedTokens = false,
}: FetchTokenCurrenciesBalancesProps): Promise<SafeBalanceResponse> => {
  const address = checksumAddress(safeAddress)
  const tokenlist = [
    {
      type: TokenType.NATIVE_TOKEN,
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      symbol: 'BNB',
      name: 'BNB',
      logoUri: 'https://safe-transaction-assets.gnosis-safe.io/chains/56/currency_logo.png',
    },
    {
      type: TokenType.ERC20,
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      decimals: 18,
      symbol: 'USDC',
      name: 'USDC',
      logoUri: '',
    },
    {
      type: TokenType.ERC20,
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18,
      symbol: 'BSC-USD',
      name: 'BSC-USD',
      logoUri: '',
    },
    {
      type: TokenType.ERC20,
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      decimals: 18,
      symbol: 'BUSD',
      name: 'BUSD',
      logoUri: '',
    },
    {
      type: TokenType.ERC20,
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      decimals: 18,
      symbol: 'WBNB',
      name: 'WBNB',
      logoUri: '',
    },
    {
      type: TokenType.ERC20,
      address: '0x4A9A2b2b04549C3927dd2c9668A5eF3fCA473623',
      decimals: 18,
      symbol: 'DF',
      name: 'DF',
      logoUri: '',
    },
  ]
  const balances = new Map()
  const promises = tokenlist.map((token) =>
    getBalanceCall(address, token.address).then((balance) => balances.set(token.address, balance)),
  )
  await Promise.all(promises)

  return {
    fiatTotal: '0',
    items: tokenlist.map((token) => {
      return {
        tokenInfo: token,
        balance: new BigNumber(balances.get(token.address)).toString(),
        fiatBalance: '0.00000',
        fiatConversion: '0',
      }
    }),
  }
  // return getBalances(_getChainId(), address, selectedCurrency, {
  //   exclude_spam: excludeSpamTokens,
  //   trusted: trustedTokens,
  // })
}

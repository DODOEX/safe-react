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
  const chainId = _getChainId()
  if (chainId === '56') {
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
        address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        decimals: 18,
        symbol: 'BUSD',
        name: 'BUSD',
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
        decimals: 18,
        symbol: 'DAI',
        name: 'DAI',
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
        address: '0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2',
        decimals: 18,
        symbol: 'DODO',
        name: 'DODO',
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x55d398326f99059ff775485246999027b3197955',
        decimals: 18,
        symbol: 'USDT',
        name: 'USDT',
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        decimals: 18,
        symbol: 'BTCB',
        name: 'Bitcoin BEP2',
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x4be35ec329343d7d9f548d42b0f8c17fffe07db4',
        name: 'Tether USD Bridged ZED20',
        symbol: 'USDT.z',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xfc780a061b9c212dd7c3afef2943b9cdceca4260',
        name: 'ID',
        symbol: 'ID',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xbb73bb2505ac4643d5c0a99c2a1f34b3dfd09d11',
        name: 'Meta Games Coin',
        symbol: 'MGC',
        decimals: 9,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xbe6ad1eb9876cf3d3f9b85feecfb400298e80143',
        name: 'AI Companions',
        symbol: 'AIC',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xb5102cee1528ce2c760893034a4603663495fd72',
        name: 'dForce USD',
        symbol: 'USX',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x4a9a2b2b04549c3927dd2c9668a5ef3fca473623',
        name: 'dForce',
        symbol: 'DF',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x87230146e138d3f296a9a77e497a2a83012e9bc5',
        name: 'Squid Game',
        symbol: 'SQUID',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x997a58129890bbda032231a52ed1ddc845fc18e1',
        name: 'SIREN',
        symbol: 'SIREN',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xf486ad071f3bee968384d2e39e2d8af0fcf6fd46',
        name: 'VELO',
        symbol: 'VELO',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xd21d29b38374528675c34936bf7d5dd693d2a577',
        name: 'Parsiq Token',
        symbol: 'PRQ',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x55d6043859dbe45e0a2571ea64b3855062fd86d8',
        name: 'BitcoinBR | btcbr.info',
        symbol: 'BTCBR',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x6ad9e9c098a45b2b41b519119c31c3dcb02accb2',
        name: 'PLAYZAP',
        symbol: 'PZP',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x86bb94ddd16efc8bc58e6b056e8df71d9e666429',
        name: 'Test',
        symbol: 'TST',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x15669cf161946c09a8b207650bfbb00e3d8a2e3e',
        name: 'JasmyCoin',
        symbol: 'JASMY',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x8c49a510756224e887b3d99d00d959f2d86dda1c',
        name: 'Realio Network',
        symbol: 'RIO',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x72ff5742319ef07061836f5c924ac6d72c919080',
        name: 'Gifto',
        symbol: 'GFT',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xc2c28b58db223da89b567a0a98197fc17c115148',
        name: 'Sologenic',
        symbol: 'SOLO',
        decimals: 15,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x09e889bb4d5b474f561db0491c38702f367a4e4d',
        name: 'Clover',
        symbol: 'CLV',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x4aae823a6a0b376de6a78e74ecc5b079d38cbcf7',
        name: 'Solv BTC',
        symbol: 'SolvBTC',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x8479b19c5a3c43e024b2543582af0fc2fef2e6a8',
        name: 'TRUMP',
        symbol: 'MAGA',
        decimals: 9,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xaf41054c1487b0e5e2b9250c0332ecbce6ce9d71',
        name: 'Ellipsis X',
        symbol: 'EPX',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x631c2f0edabac799f07550aee4ff0bf7fd35212b',
        name: 'Poollotto.finance',
        symbol: 'PLT',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xa7f552078dcc247c2684336020c03648500c6d9f',
        name: 'Ellipsis',
        symbol: 'EPS',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x3019bf2a2ef8040c242c9a4c5c4bd4c81678b2a1',
        name: 'GMT',
        symbol: 'GMT',
        decimals: 8,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x9f3bcbe48e8b754f331dfc694a894e8e686ac31d',
        name: 'ACT',
        symbol: 'ACT',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x9c4a515cd72d27a4710571aca94858a53d9278d5',
        name: 'VIDT',
        symbol: 'VIDT',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xd860549fd64fe8ba0040f73be302eacc4bef9c40',
        name: 'PEIPEI',
        symbol: 'PEIPEI',
        decimals: 9,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xd7e81c66502e19cefc44a4bce4c0b4fb7a5f144a',
        name: 'LUIGI',
        symbol: 'LUIGI',
        decimals: 9,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x84e9a6f9d240fdd33801f7135908bfa16866939a',
        name: 'GMEE',
        symbol: 'GMEE',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        name: 'Cake',
        symbol: 'CAKE',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe',
        name: 'Binance-Peg XRP Token',
        symbol: 'XRP',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0xe4e11e02aa14c7f24db749421986eaec1369e8c9',
        name: 'Minati',
        symbol: 'MNTC',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x0ef2e7602add1733bfdb17ac3094d0421b502ca3',
        name: 'Binance-Peg eCash Token',
        symbol: 'XEC',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47',
        name: 'Binance-Peg Cardano Token',
        symbol: 'ADA(Binance-Peg)',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
        name: 'Binance-Peg Ethereum Token',
        symbol: 'ETH',
        decimals: 18,
        logoUri: '',
      },
      {
        type: TokenType.ERC20,
        address: '0x9d0d41df4ca809dc16a9bff646d3c6cbc4ebc707',
        name: 'Rezor',
        symbol: 'RZR',
        decimals: 9,
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
  } else {
    return getBalances(chainId, address, selectedCurrency, {
      exclude_spam: excludeSpamTokens,
      trusted: trustedTokens,
    })
  }
}

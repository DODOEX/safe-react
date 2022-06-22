import {
  postSafeGasEstimation,
  SafeTransactionEstimationRequest,
  SafeTransactionEstimation,
  Operation,
} from '@gnosis.pm/safe-react-gateway-sdk'

import { _getChainId } from 'src/config'
import { getWeb3, getWeb3ReadOnly } from 'src/logic/wallets/getWeb3'
import { checksumAddress } from 'src/utils/checksumAddress'

type FetchSafeTxGasEstimationProps = {
  safeAddress: string
} & SafeTransactionEstimationRequest

export const fetchSafeTxGasEstimation = async ({
  safeAddress,
  ...body
}: FetchSafeTxGasEstimationProps): Promise<SafeTransactionEstimation> => {
  // await postSafeGasEstimation(_getChainId(), checksumAddress(safeAddress), body)
  const web3 = getWeb3ReadOnly()
  const contractInstance = new web3.eth.Contract(
    [
      {
        inputs: [],
        name: 'getOwners',
        outputs: [
          {
            internalType: 'address[]',
            name: '',
            type: 'address[]',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'getThreshold',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'nonce',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    safeAddress,
  )
  const nonce = await contractInstance.methods.nonce().call()
  return {
    currentNonce: Number(nonce),
    recommendedNonce: Number(nonce),
    safeTxGas: '500000',
  }
}

export const getRecommendedNonce = async (safeAddress: string): Promise<number> => {
  const { recommendedNonce } = await fetchSafeTxGasEstimation({
    safeAddress,
    value: '0',
    operation: Operation.CALL,
    // Workaround: use a cancellation transaction to fetch only the recommendedNonce
    to: safeAddress,
    data: '0x',
  })
  return recommendedNonce
}

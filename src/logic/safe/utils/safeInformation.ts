import { getSafeInfo as fetchSafeInfo, SafeInfo } from '@gnosis.pm/safe-react-gateway-sdk'

import { Errors, CodedException } from 'src/logic/exceptions/CodedException'
import { _getChainId } from 'src/config'
import { getWeb3ReadOnly } from 'src/logic/wallets/getWeb3'

const GATEWAY_ERROR = /1337|42/

export const getSafeInfo = async (safeAddress: string): Promise<SafeInfo | any> => {
  const chainId = _getChainId()
  // try {
  //   return await fetchSafeInfo(chainId, safeAddress)
  // } catch (e) {
  //   console.log('use hack onchain data')
  // }

  try {
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
    const [owners, threshold, nonce] = await Promise.all([
      contractInstance.methods.getOwners().call(),
      contractInstance.methods.getThreshold().call(),
      contractInstance.methods.nonce().call(),
    ])

    return {
      address: { value: safeAddress },
      chainId,
      collectiblesTag: '1655800091',
      fallbackHandler: { value: '' },
      guard: null,
      implementation: { value: '' },
      implementationVersionState: 'UP_TO_DATE',
      modules: null,
      nonce: Number(nonce),
      owners: owners.map((owner) => ({ value: owner })),
      threshold: Number(threshold),
      txHistoryTag: '1655779589',
      txQueuedTag: '1655789185',
      version: '1.3.0',
    }
  } catch (ee) {
    const safeNotFound = GATEWAY_ERROR.test(ee.message)
    throw new CodedException(safeNotFound ? Errors._605 : Errors._613, ee.message)
  }
}

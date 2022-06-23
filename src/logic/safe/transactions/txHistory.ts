import {
  MultisigTransactionRequest,
  proposeTransaction,
  TransactionDetails,
  TransactionTokenType,
  TransferDirection,
} from '@gnosis.pm/safe-react-gateway-sdk'

import { GnosisSafe } from 'src/types/contracts/gnosis_safe.d'
import { _getChainId } from 'src/config'

import { checksumAddress } from 'src/utils/checksumAddress'
import { TxArgs } from '../store/models/types/transaction'
import { getWeb3ReadOnly } from 'src/logic/wallets/getWeb3'
import { LocalTransactionStatus } from 'src/logic/safe/store/models/types/gateway.d'

type ProposeTxBody = Omit<MultisigTransactionRequest, 'safeTxHash'> & {
  safeInstance: GnosisSafe
  data: string | number[]
}

const calculateBodyFrom = async ({
  safeInstance,
  to,
  value,
  data,
  operation,
  nonce,
  safeTxGas,
  baseGas,
  gasPrice,
  gasToken,
  refundReceiver,
  sender,
  origin,
  signature,
}: ProposeTxBody): Promise<MultisigTransactionRequest> => {
  const safeTxHash = await safeInstance.methods
    .getTransactionHash(to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver || '', nonce)
    .call()

  return {
    to: checksumAddress(to),
    value,
    data,
    operation,
    nonce: nonce.toString(),
    safeTxGas: safeTxGas.toString(),
    baseGas: baseGas.toString(),
    gasPrice,
    gasToken,
    refundReceiver,
    safeTxHash,
    sender: checksumAddress(sender),
    origin,
    signature,
  }
}

type SaveTxToHistoryTypes = TxArgs & { origin?: string | null; signature?: string }

export const saveTxToHistory = async ({
  baseGas,
  data,
  gasPrice,
  gasToken,
  nonce,
  operation,
  origin,
  refundReceiver,
  safeInstance,
  safeTxGas,
  sender,
  signature,
  to,
  valueInWei,
}: SaveTxToHistoryTypes): Promise<TransactionDetails> => {
  const address = checksumAddress(safeInstance.options.address)
  const body = await calculateBodyFrom({
    safeInstance,
    to,
    value: valueInWei,
    data,
    operation,
    nonce: nonce.toString(),
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    sender,
    origin: origin ? origin : null,
    signature,
  })

  //  await proposeTransaction(_getChainId(), address, body)

  // return txDetails
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
    address,
  )
  const [owners, threshold] = await Promise.all([
    contractInstance.methods.getOwners().call(),
    contractInstance.methods.getThreshold().call(),
  ])
  const submittedAt = Date.now()
  const txId = `multisig_${address}_${body.safeTxHash}`
  const txDetails = {
    // @ts-ignore
    chainId: _getChainId(),
    safeAddress: address,
    txId,
    executedAt: null,
    // @ts-ignore
    txStatus: LocalTransactionStatus.AWAITING_EXECUTION,
    txInfo: {
      type: 'Custom',
      dataSize: '0',
      methodName: '',
      to: { value: body.to, name: '', logoUri: '' },
      value: body.value,
    },
    // @ts-ignore
    txData: {
      hexData: data,
      dataDecoded: null,
      to: {
        value: body.to,
        name: '',
        logoUri: '',
      },
      value: body.value,
      operation: 0,
    },
    // @ts-ignore
    detailedExecutionInfo: {
      type: 'MULTISIG',
      submittedAt,
      nonce,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken,
      refundReceiver: { value: refundReceiver, name: '', logoUri: '' },
      safeTxHash: body.safeTxHash,
      executor: null,
      signers: owners.map((owner) => ({ value: owner, name: '', logoUri: '' })),
      confirmationsRequired: Number(threshold),
      confirmations: [
        {
          signer: {
            value: body.sender,
            name: '',
            logoUri: '',
          },
          signature: '0x' + signature!,
          submittedAt,
        },
      ],
    },
    txHash: null,
  }
  const confirmedTx = window.localStorage.getItem(`signed-transaction-${txId}`)
  if (confirmedTx)
    txDetails.detailedExecutionInfo.confirmations = txDetails.detailedExecutionInfo.confirmations.concat(
      JSON.parse(confirmedTx).detailedExecutionInfo.confirmations,
    )
  if (txDetails.detailedExecutionInfo.confirmations.length >= txDetails.detailedExecutionInfo.confirmationsRequired)
    txDetails.txStatus = LocalTransactionStatus.AWAITING_EXECUTION
  window.localStorage.setItem(`signed-transaction-${txId}`, JSON.stringify(txDetails))
  // @ts-ignore
  return txDetails
}

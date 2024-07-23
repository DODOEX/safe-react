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

type SaveTxToHistoryTypes = TxArgs & { origin?: string | null; signature?: string; txHash?: string; executor?: string }

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
  txHash,
  executor
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
  let txDetails = {
    // @ts-ignore
    chainId: _getChainId(),
    safeAddress: address,
    txId,
    executedAt: null,
    // @ts-ignore
    txStatus: LocalTransactionStatus.AWAITING_CONFIRMATIONS,
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
   // GET txId
  const res = await fetch(`https://natural-grouse-35163.upstash.io/get/signed-transaction-${txId}/`, {
    headers: {
      Authorization: "Bearer AYlbASQgNGM3ODA5ZGUtY2NiYS00Zjg1LTk0NzEtOGRhNDM4NmRjNzU3MTNjODdhYmJkMWU4NDNlMTgxZTFiNTA4ZWVkNzJkNWI="
    },
  })
  const json = await res.json()
  const confirmedTx = json.result
  if (confirmedTx) {
    txDetails = JSON.parse(confirmedTx)
    txDetails.detailedExecutionInfo.confirmations = txDetails.detailedExecutionInfo.confirmations.concat([
      {
        signer: {
          value: body.sender,
          name: '',
          logoUri: '',
        },
        signature: '0x' + signature!,
        submittedAt,
      },
    ])
  }
  if (txDetails.detailedExecutionInfo.confirmations.length >= txDetails.detailedExecutionInfo.confirmationsRequired)
    txDetails.txStatus = LocalTransactionStatus.AWAITING_EXECUTION
// @ts-ignore
  if (txHash) txDetails.txHash = txHash
  // @ts-ignore
  if (executor) txDetails.detailedExecutionInfo.executor = {value: executor, name: '', logoUri: ''} 
  if (txHash) txDetails.txStatus = LocalTransactionStatus.SUCCESS

  // SET userId abc EX 100
  const res2 = await fetch(`https://natural-grouse-35163.upstash.io/set/signed-transaction-${txId}/${JSON.stringify(txDetails)}`, {
    headers: {
      Authorization: "Bearer AYlbASQgNGM3ODA5ZGUtY2NiYS00Zjg1LTk0NzEtOGRhNDM4NmRjNzU3MTNjODdhYmJkMWU4NDNlMTgxZTFiNTA4ZWVkNzJkNWI="
    },
  })
  const json2 = await res2.json()
  console.log('vercel KV SET ', json2.result)
  if (txHash) window.location.reload()
  // @ts-ignore
  return txDetails
}

import { ReactElement, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '@gnosis.pm/safe-react-components'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { TransactionDetails } from '@gnosis.pm/safe-react-gateway-sdk'

import { isTxQueued, TxLocation, Transaction } from 'src/logic/safe/store/models/types/gateway.d'
import {
  extractPrefixedSafeAddress,
  generateSafeRoute,
  SafeRouteSlugs,
  SAFE_ROUTES,
  TRANSACTION_ID_SLUG,
} from 'src/routes/routes'
import { Centered } from './styled'
import { TxLocationContext } from './TxLocationProvider'
import { AppReduxState } from 'src/store'
import { fetchSafeTransaction } from 'src/logic/safe/transactions/api/fetchSafeTransaction'
import { makeTxFromDetails } from './utils'
import { QueueTxList } from './QueueTxList'
import { HistoryTxList } from './HistoryTxList'
import FetchError from '../../FetchError'
import useAsync from 'src/logic/hooks/useAsync'
import { getTransactionWithLocationByAttribute } from 'src/logic/safe/store/selectors/gatewayTransactions'
import { TokenType, TransactionStatus, TransferDirection } from '@gnosis.pm/safe-apps-sdk'
import { TransactionTokenType } from '@gnosis.pm/safe-apps-sdk/node_modules/@gnosis.pm/safe-react-gateway-sdk'
import { addQueuedTransactions } from 'src/logic/safe/store/actions/transactions/gatewayTransactions'
import { currentChainId } from 'src/logic/config/store/selectors'
import useSafeAddress from 'src/logic/currentSession/hooks/useSafeAddress'
import { currentSafe } from 'src/logic/safe/store/selectors'

const useStoredTx = (txId?: string): { txLocation: TxLocation; transaction?: Transaction } | null => {
  return (
    useSelector(
      (state: AppReduxState) =>
        txId ? getTransactionWithLocationByAttribute(state, { attributeName: 'id', attributeValue: txId }) : undefined,
      shallowEqual,
    ) || null
  )
}

const TxSingularDetails = (): ReactElement => {
  // Get a safeTxHash from the URL
  const { [TRANSACTION_ID_SLUG]: txId = '' } = useParams<SafeRouteSlugs>()
  const storedTx = useStoredTx(txId)
  const dispatch = useDispatch()
  const chainId = useSelector(currentChainId)
  const { safeAddress } = useSafeAddress()
  const { owners, nonce } = useSelector(currentSafe)
  useEffect(() => {
    dispatch(
      addQueuedTransactions({
        chainId,
        safeAddress,
        values: [
          {
            type: 'TRANSACTION',
            transaction: {
              id: txId,
              timestamp: 1655820126000,
              txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
              txInfo: {
                type: 'Transfer',
                sender: {
                  value: safeAddress,
                  name: '',
                  logoUri: '',
                },
                recipient: {
                  value: safeAddress,
                  name: '',
                  logoUri: '',
                },
                direction: TransferDirection.OUTGOING,
                transferInfo: {
                  type: TransactionTokenType.NATIVE_COIN,
                  value: '10000000000000000',
                },
              },
              executionInfo: {
                type: 'MULTISIG',
                nonce,
                confirmationsRequired: 2,
                confirmationsSubmitted: 1,
                missingSigners: owners.map((owner) => ({ value: owner, name: '', logoUri: '' })),
              },
            },
            conflictType: 'None',
          },
        ],
      }),
    )
  }, [chainId, dispatch, nonce, owners, safeAddress, txId])

  // Fetch tx details
  // const [fetchedTx, error] = useAsync<TransactionDetails>(() => fetchSafeTransaction(txId), [txId])

  // if (error) {
  //   const safeParams = extractPrefixedSafeAddress()
  //   return (
  //     <FetchError
  //       text="Transaction not found1"
  //       buttonText="See all transactions"
  //       redirectRoute={generateSafeRoute(SAFE_ROUTES.TRANSACTIONS, safeParams)}
  //     />
  //   )
  // }

  // const detailedTx = storedTx?.transaction || (fetchedTx ? makeTxFromDetails(fetchedTx) : null)
  const detailedTx = storedTx?.transaction
  if (detailedTx) {
    detailedTx.txDetails = {
      txId,
      executedAt: null,
      txStatus: detailedTx.txStatus,
      txInfo: detailedTx.txInfo,
      txData: null,
      detailedExecutionInfo: null,
      txHash: null,
      safeAppInfo: null,
    }
  }

  if (!detailedTx) {
    return <Centered padding={10}>1</Centered>
  }

  const isQueue = isTxQueued(detailedTx.txStatus)
  const TxList = isQueue ? QueueTxList : HistoryTxList
  const fallbackLocation: TxLocation = isQueue ? 'queued.queued' : 'history'

  return (
    <TxLocationContext.Provider value={{ txLocation: storedTx?.txLocation || fallbackLocation }}>
      <TxList transactions={[[detailedTx.timestamp.toString(), [detailedTx]]]} />
    </TxLocationContext.Provider>
  )
}

export default TxSingularDetails

import { ReactElement, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ButtonLink, Loader } from '@gnosis.pm/safe-react-components'
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
import {
  addHistoryTransactions,
  addQueuedTransactions,
} from 'src/logic/safe/store/actions/transactions/gatewayTransactions'
import { currentChainId } from 'src/logic/config/store/selectors'
import useSafeAddress from 'src/logic/currentSession/hooks/useSafeAddress'
import { currentSafe } from 'src/logic/safe/store/selectors'
import styled from 'styled-components'
import { sm } from 'src/theme/variables'

const StyledButtonLink = styled(ButtonLink)`
  margin-top: ${sm};
  padding-left: 0;

  & > p {
    margin-left: 0;
  }
`

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
  const [inputData, setInputData] = useState('')
  const [inputFinished, setInputFinished] = useState(false)
  const dispatch = useDispatch()
  const chainId = useSelector(currentChainId)
  useEffect(() => {
    try {
      if (inputFinished) {
        const tx = JSON.parse(inputData)
        dispatch(
          addQueuedTransactions({
            chainId,
            safeAddress: tx.safeAddress,
            values: [{ type: 'TRANSACTION', transaction: makeTxFromDetails(tx), conflictType: 'None' }],
          }),
        )
        dispatch(
          addHistoryTransactions({
            chainId,
            safeAddress: tx.safeAddress,
            values: [{ type: 'TRANSACTION', transaction: makeTxFromDetails(tx), conflictType: 'None' }],
          }),
        )
        window.localStorage.setItem(`signed-transaction-${txId}`, inputData)
      }
    } catch (e) {
      setInputFinished(false)
      alert(`Input Format Error: ${e.message}`)
    }
  }, [chainId, dispatch, inputData, inputFinished, txId])

  // Fetch tx details
  const [fetchedTx, error] = useAsync<TransactionDetails>(() => fetchSafeTransaction(txId), [txId, inputFinished])

  useEffect(() => {
    if (!storedTx && fetchedTx) {
      dispatch(
        addQueuedTransactions({
          chainId,
          // @ts-ignore
          safeAddress: fetchedTx.safeAddress,
          values: [{ type: 'TRANSACTION', transaction: makeTxFromDetails(fetchedTx), conflictType: 'None' }],
        }),
      )
      dispatch(
        addHistoryTransactions({
          chainId,
          // @ts-ignore
          safeAddress: fetchedTx.safeAddress,
          values: [{ type: 'TRANSACTION', transaction: makeTxFromDetails(fetchedTx), conflictType: 'None' }],
        }),
      )
    }
  }, [storedTx, fetchedTx, dispatch, chainId, txId, inputData])

  if (error) {
    return (
      <Centered padding={10}>
        <div style={{ width: '100%' }}>
          <textarea
            style={{ width: '100%' }}
            rows={20}
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
          />
          <StyledButtonLink color="primary" onClick={() => setInputFinished(true)}>
            Save
          </StyledButtonLink>
        </div>
      </Centered>
    )
  }

  const detailedTx = storedTx?.transaction || (fetchedTx ? makeTxFromDetails(fetchedTx) : null)

  if (!detailedTx) {
    return (
      <Centered padding={10}>
        <Loader size="sm" />
      </Centered>
    )
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

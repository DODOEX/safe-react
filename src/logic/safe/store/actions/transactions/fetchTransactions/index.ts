import { ThunkDispatch } from 'redux-thunk'
import { AnyAction } from 'redux'

import {
  addHistoryTransactions,
  addQueuedTransactions,
} from 'src/logic/safe/store/actions/transactions/gatewayTransactions'
import { loadHistoryTransactions, loadQueuedTransactions } from './loadGatewayTransactions'
import { AppReduxState } from 'src/store'
import { history } from 'src/routes/routes'
import { isTxFilter } from 'src/routes/safe/components/Transactions/TxList/Filter/utils'

export default (chainId: string, safeAddress: string) =>
  async (dispatch: ThunkDispatch<AppReduxState, undefined, AnyAction>): Promise<void> => {
    const loadHistory = async () => {
      try {
        const query = Object.fromEntries(new URLSearchParams(history.location.search))
        const filter = isTxFilter(query) ? query : undefined
        const values = await loadHistoryTransactions(safeAddress, filter)
        dispatch(addHistoryTransactions({ chainId, safeAddress, values }))
      } catch (e) {
       console.log(e.message)
      }
    }

    const loadQueue = async () => {
      try {
        const values = await loadQueuedTransactions(safeAddress)
        dispatch(addQueuedTransactions({ chainId, safeAddress, values }))
      } catch (e) {
       console.log(e.message)
      }
    }

    await Promise.all([loadHistory(), loadQueue()])
  }

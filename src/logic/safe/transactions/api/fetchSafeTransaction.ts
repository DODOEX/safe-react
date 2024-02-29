import { getTransactionDetails, TransactionDetails } from '@gnosis.pm/safe-react-gateway-sdk'

import { _getChainId } from 'src/config'

// Cache the request promise to avoid simulateneous requests
// It's cleared as soon as the promise is resolved
const cache = {}

/**
 * @param {string} txId safeTxHash or transaction id from client-gateway
 */
export const fetchSafeTransaction = async (txId: string): Promise<TransactionDetails> => {
  const chainId = _getChainId()
  const cacheKey = `${chainId}_${txId}`

  // const promise: Promise<TransactionDetails> = cache[cacheKey] || getTransactionDetails(chainId, txId)
   // GET txId
   const res = await fetch(`https://natural-grouse-35163.upstash.io/get/signed-transaction-${txId}/`, {
    headers: {
      Authorization: "Bearer AYlbASQgNGM3ODA5ZGUtY2NiYS00Zjg1LTk0NzEtOGRhNDM4NmRjNzU3MTNjODdhYmJkMWU4NDNlMTgxZTFiNTA4ZWVkNzJkNWI="
    },
  })
  const json = await res.json()
  const promise: Promise<TransactionDetails> =
    cache[cacheKey] || Promise.resolve(JSON.parse(json.result ?? ''))

  // Save the promise into cache
  cache[cacheKey] = promise

  // Clear cache when promise finishes
  promise.catch(() => null).then(() => delete cache[cacheKey])

  return promise
}

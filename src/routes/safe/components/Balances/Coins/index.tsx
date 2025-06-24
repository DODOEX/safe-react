import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { List } from 'immutable'
import TableCell from '@material-ui/core/TableCell'
import Tooltip from '@material-ui/core/Tooltip'
import TableContainer from '@material-ui/core/TableContainer'
import TableRow from '@material-ui/core/TableRow'
import { Skeleton } from '@material-ui/lab'

import InfoIcon from 'src/assets/icons/info_red.svg'
import { FixedIcon, Text, Button, CopyToClipboardBtn } from '@gnosis.pm/safe-react-components'
import { formatAmount } from 'src/logic/tokens/utils/formatAmount'

import Img from 'src/components/layout/Img'
import Table from 'src/components/Table'
import { cellWidth } from 'src/components/Table/TableHead'
import Row from 'src/components/layout/Row'
import { BALANCE_ROW_TEST_ID } from 'src/routes/safe/components/Balances'
import AssetTableCell from 'src/routes/safe/components/Balances/AssetTableCell'
import ExportModal from 'src/routes/safe/components/Balances/ExportModal'
import {
  BALANCE_TABLE_ASSET_ID,
  BALANCE_TABLE_BALANCE_ID,
  BALANCE_TABLE_VALUE_ID,
  generateColumns,
  getBalanceData,
  BalanceData,
} from 'src/routes/safe/components/Balances/dataFetcher'
import { extendedSafeTokensSelector, grantedSelector } from 'src/routes/safe/container/selector'
import { makeStyles } from '@material-ui/core/styles'
import { styles } from './styles'
import { currentCurrencySelector } from 'src/logic/currencyValues/store/selectors'
import { trackEvent } from 'src/utils/googleTagManager'
import { ASSETS_EVENTS } from 'src/utils/events/assets'
import Track from 'src/components/Track'

const StyledButton = styled(Button)`
  &&.MuiButton-root {
    margin: 4px 12px 4px 0px;
    padding: 0 12px;
    min-width: auto;
  }
  svg {
    margin: 0 6px 0 0;
  }
`

const BalanceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
`

const StyledCopyBtn = styled(CopyToClipboardBtn)`
  height: 20px;
  width: 20px;
  min-width: 20px;

  & span {
    width: 20px;
    height: 20px;
    justify-content: center;
    align-items: center;
  }

  & svg {
    width: 12px;
    height: 12px;
  }
`

const useStyles = makeStyles(styles)

type Props = {
  showReceiveFunds: () => void
  showSendFunds: (tokenAddress: string) => void
  showExport?: () => void
}

type CurrencyTooltipProps = {
  valueWithCurrency: string
  balanceWithSymbol: string
}

const CurrencyTooltip = (props: CurrencyTooltipProps): React.ReactElement | null => {
  const { balanceWithSymbol, valueWithCurrency } = props
  const classes = useStyles()
  const balance = balanceWithSymbol.replace(/[^\d.-]/g, '')
  const value = valueWithCurrency.replace(/[^\d.-]/g, '')
  if (!Number(value) && Number(balance)) {
    return (
      <Tooltip placement="top" title="Value may be zero due to missing token price information">
        <span>
          <Img className={classes.tooltipInfo} alt="Info Tooltip" height={16} src={InfoIcon} />
        </span>
      </Tooltip>
    )
  }
  return null
}

const Coins = (props: Props): React.ReactElement => {
  const { showReceiveFunds, showSendFunds } = props
  const classes = useStyles()
  const columns = generateColumns()
  const autoColumns = columns.filter((c) => !c.custom)
  const selectedCurrency = useSelector(currentCurrencySelector)
  const safeTokens = useSelector(extendedSafeTokensSelector)
  const granted = useSelector(grantedSelector)

  const [showExportModal, setShowExportModal] = useState(false)

  const differingTokens = useMemo(() => safeTokens.size, [safeTokens])
  useEffect(() => {
    // Safe does not have any tokens until fetching is complete
    if (differingTokens > 0) {
      trackEvent({ ...ASSETS_EVENTS.DIFFERING_TOKENS, label: differingTokens })
    }
  }, [differingTokens])

  const filteredData: List<BalanceData> = useMemo(
    () => getBalanceData(safeTokens, selectedCurrency),
    [safeTokens, selectedCurrency],
  )

  return (
    <>
      {/* Export Button */}
      <Row align="end" style={{ marginBottom: '16px' }}>
        <StyledButton
          color="primary"
          onClick={() => setShowExportModal(true)}
          size="md"
          variant="outlined"
          data-testid="export-balances-btn"
        >
          <FixedIcon type="arrowSent" />
          <Text size="xl">Export</Text>
        </StyledButton>
      </Row>

      <TableContainer>
        <Table columns={columns} data={filteredData} defaultRowsPerPage={100} label="Balances" size={filteredData.size}>
          {(sortedData) =>
            sortedData.map((row, index) => (
              <TableRow className={classes.hide} data-testid={BALANCE_ROW_TEST_ID} key={index} tabIndex={-1}>
                {autoColumns.map((column) => {
                  const { align, id, width } = column
                  let cellItem
                  switch (id) {
                    case BALANCE_TABLE_ASSET_ID: {
                      cellItem = <AssetTableCell asset={row[id]} />
                      break
                    }
                    case BALANCE_TABLE_BALANCE_ID: {
                      const rawBalance = row.rawTokenBalance
                      const symbol = row[BALANCE_TABLE_ASSET_ID].symbol
                      const formattedBalance = formatAmount(rawBalance)
                      const fullBalanceWithSymbol = `${rawBalance} ${symbol}`
                      const fullBalance = `${rawBalance}`
                      const formattedBalanceWithSymbol = `${formattedBalance} ${symbol}`

                      // Check if the formatted version is different from raw (indicating precision loss)
                      const hasPrecisionLoss = rawBalance !== formattedBalance && parseFloat(rawBalance) !== 0

                      cellItem = (
                        <BalanceContainer>
                          <Tooltip
                            title={
                              hasPrecisionLoss ? 'Full precision: ' + fullBalanceWithSymbol : formattedBalanceWithSymbol
                            }
                            arrow
                            placement="top"
                          >
                            <div data-testid={`balance-${symbol}`} style={{ textAlign: 'right' }}>
                              {formattedBalanceWithSymbol}
                            </div>
                          </Tooltip>
                          {hasPrecisionLoss && <StyledCopyBtn textToCopy={fullBalance} iconType="copy" />}
                        </BalanceContainer>
                      )
                      break
                    }
                    case BALANCE_TABLE_VALUE_ID: {
                      // If there are no values for that row but we have balances, we display as '0.00 {CurrencySelected}'
                      // In case we don't have balances, we display a skeleton
                      const showCurrencyValueRow = row[id] || row[BALANCE_TABLE_BALANCE_ID]
                      const valueWithCurrency = row[id] ? row[id] : `0.00 ${selectedCurrency}`
                      cellItem =
                        showCurrencyValueRow && selectedCurrency ? (
                          <div className={classes.currencyValueRow}>
                            {valueWithCurrency}
                            <CurrencyTooltip
                              valueWithCurrency={valueWithCurrency}
                              balanceWithSymbol={row[BALANCE_TABLE_BALANCE_ID]}
                            />
                          </div>
                        ) : (
                          <Skeleton animation="wave" />
                        )
                      break
                    }
                    default: {
                      cellItem = null
                      break
                    }
                  }
                  return (
                    <TableCell align={align} component="td" key={id} style={cellWidth(width)}>
                      {cellItem}
                    </TableCell>
                  )
                })}
                <TableCell component="td">
                  <Row align="end" className={classes.actions}>
                    {granted && (
                      <Track {...ASSETS_EVENTS.SEND}>
                        <StyledButton
                          color="primary"
                          onClick={() => showSendFunds(row.asset.address)}
                          size="md"
                          variant="contained"
                          data-testid="balance-send-btn"
                        >
                          <FixedIcon type="arrowSentWhite" />
                          <Text size="xl" color="white">
                            Send
                          </Text>
                        </StyledButton>
                      </Track>
                    )}
                    <Track {...ASSETS_EVENTS.RECEIVE}>
                      <StyledButton color="primary" onClick={showReceiveFunds} size="md" variant="contained">
                        <FixedIcon type="arrowReceivedWhite" />
                        <Text size="xl" color="white">
                          Receive
                        </Text>
                      </StyledButton>
                    </Track>
                  </Row>
                </TableCell>
              </TableRow>
            ))
          }
        </Table>
      </TableContainer>

      {/* Export Modal */}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  )
}

export default Coins

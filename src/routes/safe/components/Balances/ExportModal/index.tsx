import { ReactElement, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { List } from 'immutable'
import { Button, Text } from '@gnosis.pm/safe-react-components'
import { makeStyles } from '@material-ui/core/styles'
import { Checkbox, TextField } from '@material-ui/core'
import styled from 'styled-components'

import Modal from 'src/components/Modal'
import Block from 'src/components/layout/Block'
import Row from 'src/components/layout/Row'
import Col from 'src/components/layout/Col'

import { extendedSafeTokensSelector } from 'src/routes/safe/container/selector'
import { Token } from 'src/logic/tokens/store/model/token'
import { getNativeCurrencyAddress } from 'src/config/utils'

const useStyles = makeStyles({
  container: {
    padding: '24px',
    minHeight: '400px',
  },
  tokenList: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #e2e3e3',
    borderRadius: '4px',
    padding: '8px',
    marginBottom: '16px',
  },
  tokenItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  tokenInfo: {
    marginLeft: '8px',
    flex: 1,
  },
  previewArea: {
    marginTop: '16px',
  },
  textarea: {
    width: '100%',
    minHeight: '150px',
    fontFamily: 'monospace',
    fontSize: '12px',
    border: '1px solid #e2e3e3',
    borderRadius: '4px',
    padding: '8px',
    resize: 'vertical',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
  },
})

const StyledTextField = styled(TextField)`
  margin-bottom: 16px;
  width: 100%;
`

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TokenSelection {
  [tokenAddress: string]: boolean
}

const ExportModal = ({ isOpen, onClose }: ExportModalProps): ReactElement => {
  const classes = useStyles()
  const safeTokens = useSelector(extendedSafeTokensSelector)

  const [receiverAddress, setReceiverAddress] = useState('')
  const [selectedTokens, setSelectedTokens] = useState<TokenSelection>({})
  const [editableCSV, setEditableCSV] = useState('')

  // Filter out tokens with zero balance and native currency
  const availableTokens = useMemo(() => {
    return safeTokens.filter((token: Token) => {
      const hasBalance = parseFloat(token.balance?.tokenBalance || '0') > 0
      const isNotNative = token.address !== getNativeCurrencyAddress()
      return hasBalance && isNotNative
    })
  }, [safeTokens])

  const handleTokenToggle = (tokenAddress: string) => {
    setSelectedTokens((prev) => ({
      ...prev,
      [tokenAddress]: !prev[tokenAddress],
    }))
  }

  const handleSelectAll = () => {
    const allSelected = availableTokens.every((token: Token) => selectedTokens[token.address])
    const newSelection: TokenSelection = {}

    if (!allSelected) {
      availableTokens.forEach((token: Token) => {
        newSelection[token.address] = true
      })
    }

    setSelectedTokens(newSelection)
  }

  const generateCSV = useMemo(() => {
    if (!receiverAddress) return ''

    const header = 'token_type,token_address,receiver,amount\n'
    const rows = availableTokens
      .filter((token: Token) => selectedTokens[token.address])
      .map((token: Token) => {
        const amount = token.balance?.tokenBalance || '0'
        return `ERC20,${token.address},${receiverAddress},${amount}`
      })
      .join('\n')

    const csv = header + rows
    setEditableCSV(csv)
    return csv
  }, [availableTokens, selectedTokens, receiverAddress])

  const selectedCount = Object.values(selectedTokens).filter(Boolean).length
  const canGenerate = receiverAddress && selectedCount > 0

  const handleClose = () => {
    setReceiverAddress('')
    setSelectedTokens({})
    setEditableCSV('')
    onClose()
  }

  return (
    <Modal
      description="Export token balances"
      handleClose={handleClose}
      open={isOpen}
      paperClassName="export-modal"
      title="Export Token Balances"
    >
      <Block className={classes.container}>
        <Row margin="md">
          <Col xs={12}>
            <Text size="lg" strong>
              Receiver Address
            </Text>
            <StyledTextField
              id="receiver-address"
              label="Enter receiver address"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              variant="outlined"
              placeholder="0x..."
            />
          </Col>
        </Row>

        <Row margin="md">
          <Col xs={12}>
            <Block
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}
            >
              <Text size="lg" strong>
                Select Tokens ({selectedCount} of {availableTokens.size} selected)
              </Text>
              <Button size="md" variant="outlined" onClick={handleSelectAll}>
                {availableTokens.every((token: Token) => selectedTokens[token.address]) ? 'Deselect All' : 'Select All'}
              </Button>
            </Block>

            <div className={classes.tokenList}>
              {availableTokens.map((token: Token) => (
                <div key={token.address} className={classes.tokenItem}>
                  <Checkbox
                    checked={!!selectedTokens[token.address]}
                    onChange={() => handleTokenToggle(token.address)}
                    color="primary"
                  />
                  <div className={classes.tokenInfo}>
                    <Text size="md" strong>
                      {token.symbol}
                    </Text>
                    <Text size="sm" color="disabled">
                      {token.name} • Balance: {token.balance?.tokenBalance || '0'}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>

        {canGenerate && (
          <Row margin="md" className={classes.previewArea}>
            <Col xs={12}>
              <div style={{ marginBottom: '8px' }}>
                <Text size="lg" strong>
                  Preview & Copy
                </Text>
              </div>
              <textarea
                className={classes.textarea}
                value={editableCSV}
                onChange={(e) => setEditableCSV(e.target.value)}
                placeholder="Generated CSV will appear here..."
              />
            </Col>
          </Row>
        )}

        <Row align="center" className={classes.actions} margin="md">
          <Button size="md" variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="md"
            color="primary"
            variant="contained"
            disabled={!canGenerate}
            onClick={() => {
              // Copy to clipboard
              if (editableCSV) {
                navigator.clipboard.writeText(editableCSV)
                // You could add a notification here
              }
            }}
          >
            Copy to Clipboard
          </Button>
        </Row>
      </Block>
    </Modal>
  )
}

export default ExportModal

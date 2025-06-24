import { ReactElement } from 'react'
import { ExplorerButton, CopyToClipboardBtn } from '@gnosis.pm/safe-react-components'
import styled from 'styled-components'

import Block from 'src/components/layout/Block'
import Img from 'src/components/layout/Img'
import Paragraph from 'src/components/layout/Paragraph'
import { setImageToPlaceholder } from 'src/routes/safe/components/Balances/utils'
import { getExplorerInfo } from 'src/config'
import { BalanceData } from '../dataFetcher'
import { getNativeCurrencyAddress } from 'src/config/utils'

const StyledParagraph = styled(Paragraph)`
  margin-left: 10px;
  margin-right: 10px;
`

const StyledCopyToClipboardBtn = styled(CopyToClipboardBtn)`
  margin-left: 5px;
  height: 26px;
  width: 26px;

  & span {
    width: 26px;
    height: 26px;
    justify-content: center;
    align-items: center;
  }
`

const AssetTableCell = ({ asset }: { asset: BalanceData['asset'] }): ReactElement => {
  const isNativeCurrency = asset.address === getNativeCurrencyAddress()
  return (
    <Block justify="left">
      <Img alt={asset.name} height={26} onError={setImageToPlaceholder} src={asset.logoUri} />
      <StyledParagraph noMargin size="lg">
        {asset.name}
      </StyledParagraph>
      {!isNativeCurrency && (
        <>
          <StyledCopyToClipboardBtn textToCopy={asset.address} />
          <ExplorerButton explorerUrl={getExplorerInfo(asset.address)} />
        </>
      )}
    </Block>
  )
}

export default AssetTableCell

import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useSafeAppUrl } from 'src/logic/hooks/useSafeAppUrl'
import AppFrame from 'src/routes/safe/components/Apps/components/AppFrame'
import AppsList from 'src/routes/safe/components/Apps/components/AppsList'
import { useLegalConsent } from 'src/routes/safe/components/Apps/hooks/useLegalConsent'
import SafeAppsDisclaimer from './components/Disclaimer'
import SafeAppsErrorBoundary from './components/SafeAppsErrorBoundary'
import SafeAppsLoadError from './components/SafeAppsLoadError'
import { useAppList } from './hooks/appList/useAppList'
import { useSecuritySteps } from './hooks/useSecuritySteps'

const Apps = (): React.ReactElement => {
  const history = useHistory()
  const { getAppUrl } = useSafeAppUrl()
  const url = getAppUrl()
  const { appList, getSafeApp } = useAppList()
  const { consentReceived, onConsentReceipt } = useLegalConsent()
  const { appsReviewed, onReviewApp } = useSecuritySteps()

  const isSafeAppInDefaultList = useMemo(() => {
    const urlInstance = new URL(url)
    const safeAppUrl = `${urlInstance.hostname}/${urlInstance.pathname}`

    return appList.some((appItem) => {
      const appItemUrl = new URL(appItem.url)
      return `${appItemUrl.hostname}/${appItemUrl.pathname}` === safeAppUrl
    })
  }, [appList, url])

  const isFirstTimeAccessingApp = useMemo(() => {
    const safeAppId = getSafeApp(url)?.id

    return safeAppId ? appsReviewed.includes(safeAppId) : false
  }, [appsReviewed, getSafeApp, url])

  const handleConfirm = () => {
    onConsentReceipt()

    const safeAppId = getSafeApp(url)?.id

    if (safeAppId) {
      onReviewApp(safeAppId)
    }
  }

  const goBack = () => history.goBack()

  if (url) {
    if (!consentReceived || !isSafeAppInDefaultList || isFirstTimeAccessingApp) {
      return (
        <SafeAppsDisclaimer
          onCancel={goBack}
          onConfirm={handleConfirm}
          appUrl={url}
          isConsentAccepted={consentReceived}
          isSafeAppInDefaultList={isSafeAppInDefaultList}
          isFirstTimeAccessingApp={isFirstTimeAccessingApp}
        />
      )
    }

    return (
      <SafeAppsErrorBoundary render={() => <SafeAppsLoadError />}>
        <AppFrame appUrl={url} />
      </SafeAppsErrorBoundary>
    )
  } else {
    return <AppsList />
  }
}

export default Apps

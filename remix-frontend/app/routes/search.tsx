import { useTranslation } from 'react-i18next';
import { Page } from '~/components/page/page';

import { Outlet } from '@remix-run/react';

export { DefaultErrorBoundary as ErrorBoundary } from "~/components/default-error-boundary"

export default function Search() {
  const { t } = useTranslation("search")

  return <Page title={t("main-headline")}><Outlet /></Page>
}
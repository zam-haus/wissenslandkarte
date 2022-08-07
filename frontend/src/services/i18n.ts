import {
  getLocaleFromNavigator, init, isLoading, register, _,
} from 'svelte-i18n';

const supportedLocales = ['en', 'en-US', 'de', 'de-DE'];

async function setupI18n() {
  for (const locale of supportedLocales) {
    register(locale, () => fetch(`/lang/${locale}.json`).then((response) => response.json()));
  }

  await init({
    fallbackLocale: 'en',
    initialLocale: getLocaleFromNavigator(),
  });
}

export { setupI18n, isLoading as isI18nLoading, _ };

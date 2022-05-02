import { getLocaleFromNavigator, init, isLoading, register, _, } from 'svelte-i18n';

const supportedLocales = ['en', 'de'];

async function setupI18n() {
    for (const locale of supportedLocales) {
        register(locale, () => import(`../lang/${locale}.json`));
    }

    init({
        fallbackLocale: 'en',
        initialLocale: getLocaleFromNavigator(),
    });
}

export { setupI18n, isLoading as isI18nLoading, _ };
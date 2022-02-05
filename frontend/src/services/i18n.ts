import { dictionary, locale, _ } from 'svelte-i18n';
import { derived } from 'svelte/store';

const MESSAGES_PATH_TEMPLATE = '/lang/{locale}.json';

async function setupI18n({ withLocale: _locale } = { withLocale: 'en' }) {
  const messagesPath = MESSAGES_PATH_TEMPLATE.replace('{locale}', _locale);
  const messages = await (await fetch(messagesPath)).json();

  dictionary.set({ [_locale]: messages });
  locale.set(_locale);
}

const isLocaleLoaded = derived(locale, $locale => typeof $locale === 'string');

export { _, setupI18n, isLocaleLoaded };



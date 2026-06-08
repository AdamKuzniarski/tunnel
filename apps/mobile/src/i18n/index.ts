import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { de } from './translations/de';
import { en } from './translations/en';

export const i18n = new I18n({ en, de });
i18n.defaultLocale = 'en';
i18n.enableFallback = true;
i18n.locale = getLocales()[0]?.languageCode ?? 'en';

export function t(key: string, params?: Record<string, string | number>) {
  return i18n.t(key, params);
}

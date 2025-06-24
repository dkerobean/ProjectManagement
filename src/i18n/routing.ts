// This file is kept for compatibility but not used since we're not using i18n routing
export const routing = {
  locales: ['en', 'es', 'ar', 'zh'],
  defaultLocale: 'en'
};

export type Locale = (typeof routing.locales)[number];

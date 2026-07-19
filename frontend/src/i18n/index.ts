import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import fr from './fr.json'
import zh from './zh.json'

// Native-name labels for the language switcher (these three names are
// deliberately NOT translated — each language is shown in itself).
export const languages = {
  zh: '中文',
  fr: 'Français',
  en: 'English',
} as const

i18n
  .use(LanguageDetector) // picks up browser language, remembers choice in localStorage
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      zh: { translation: zh },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes output
  })

export default i18n

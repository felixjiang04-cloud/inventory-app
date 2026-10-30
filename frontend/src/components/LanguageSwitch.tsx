import { useTranslation } from 'react-i18next'

import { languages } from '../i18n'

// 中文 / Français / English — each name written in its own language.
export default function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <div className="lang-switch" role="group" aria-label={t('language')}>
      {Object.entries(languages).map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={i18n.resolvedLanguage === code}
          onClick={() => i18n.changeLanguage(code)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

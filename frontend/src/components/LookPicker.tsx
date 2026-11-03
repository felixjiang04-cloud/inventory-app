import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { chooseLook, currentLook, loadFonts, LOOKS } from '../look'
import type { Look } from '../look'

// The five looks as radio buttons. Each row ends in a small tile drawn in
// that look (its ground, title font and accent), so it can be seen before
// choosing. The change applies at once and is remembered on this device.
export default function LookPicker({ labelledBy }: { labelledBy: string }) {
  const { t } = useTranslation()
  const [look, setLook] = useState<Look>(currentLook)

  // the tiles need every look's title font
  useEffect(() => {
    LOOKS.forEach((each) => void loadFonts(each))
  }, [])

  return (
    <div className="look-options" role="radiogroup" aria-labelledby={labelledBy}>
      {LOOKS.map((each) => (
        // the whole row is tappable; a screen reader hears the name, then the description
        <label key={each} className="look-option">
          <input
            type="radio"
            name="look"
            value={each}
            checked={look === each}
            aria-labelledby={`${labelledBy}-${each}-name`}
            aria-describedby={`${labelledBy}-${each}-description`}
            onChange={() => {
              chooseLook(each)
              setLook(each)
            }}
          />
          <span className="look-option-text">
            <span className="look-option-name" id={`${labelledBy}-${each}-name`}>
              {t(`look.names.${each}`)}
            </span>
            <span className="list-row-meta" id={`${labelledBy}-${each}-description`}>
              {t(`look.descriptions.${each}`)}
            </span>
          </span>
          <span className="look-sample" data-look-preview={each} aria-hidden="true">
            {t('look.sample')}
          </span>
        </label>
      ))}
    </div>
  )
}

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { setGlobalLocale, type GlobalLocale } from '@/lib/globalTranslator'
import { translations } from '@/config/translations'

export type Locale = GlobalLocale

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  te: 'తెలుగు',
  ta: 'தமிழ்',
}

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
)

const STORAGE_KEY = 'mandi-setu-language'

const VALID_LOCALES: Locale[] = [
  'en',
  'hi',
  'mr',
  'gu',
  'te',
  'ta',
]

const readLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const saved = window.localStorage.getItem(
    STORAGE_KEY
  ) as Locale | null

  return saved && VALID_LOCALES.includes(saved)
    ? saved
    : 'en'
}

export const LanguageProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(readLocale)

  /*
   * Keep the global translator synchronized with React state.
   * No delayed initialization is required.
   */
  useEffect(() => {
    setGlobalLocale(locale)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale)
    }

    /*
     * Update the document language immediately.
     */
    document.documentElement.lang = locale
  }, [locale])

  /*
   * IMPORTANT:
   * Return the translation for the CURRENT selected language.
   *
   * Earlier this always returned translations.en[key],
   * which meant React components never actually received
   * the selected language.
   */
  const t = (key: string): string => {
    const currentTranslations = translations[locale]

    return (
      currentTranslations?.[key] ??
      translations.en?.[key] ??
      key
    )
  }

  /*
   * Change language immediately.
   *
   * React state update causes every component using t()
   * to re-render instantly.
   */
  const setLocale = (nextLocale: Locale) => {
    if (!VALID_LOCALES.includes(nextLocale)) {
      return
    }

    setLocaleState(nextLocale)
  }

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    )
  }

  return context
}
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { startGlobalTranslator, setGlobalLocale, type GlobalLocale } from '@/lib/globalTranslator'
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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)
const STORAGE_KEY = 'mandi-setu-language'

const VALID_LOCALES: Locale[] = ['en', 'hi', 'mr', 'gu', 'te', 'ta']

const readLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null
  return saved && VALID_LOCALES.includes(saved) ? saved : 'en'
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(readLocale)

  useEffect(() => {
    const cleanup = startGlobalTranslator()
    setGlobalLocale(locale)

    return cleanup
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale)
    }
    setGlobalLocale(locale)
  }, [locale])

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
  }

  /**
   * Existing components already call t('someKey').
   * We intentionally return the English source string here so the global
   * API translator can translate the actual rendered DOM exactly once.
   * The existing translations file is kept as a fallback/reference source.
   */
  const t = (key: string) => {
    return translations.en[key] ?? key
  }

  const value = useMemo(() => ({ locale, setLocale, t }), [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

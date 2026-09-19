import React, { useEffect, useRef, useState } from 'react'
import { Languages, Check, ChevronDown } from 'lucide-react'
import {
  useLanguage,
  type Locale,
} from '@/context/LanguageContext'

const languages: {
  code: Locale
  label: string
}[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
]

export const LanguageSelector: React.FC = () => {
  const { locale, setLocale } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)

  const currentLanguage =
    languages.find((language) => language.code === locale) ??
    languages[0]

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )
    }
  }, [])

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  return (
    <div
      ref={wrapperRef}
      className="relative shrink-0"
    >
      {/* Language Button */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/40 transition-all"
      >
        <Languages className="w-4 h-4 text-emerald-700 shrink-0" />

        <span className="text-xs font-bold whitespace-nowrap">
          {currentLanguage.label}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl z-[100] p-1.5"
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">
              Select Language
            </p>
          </div>

          {languages.map((language) => {
            const isSelected = language.code === locale

            return (
              <button
                key={language.code}
                type="button"
                onClick={() =>
                  handleLanguageChange(language.code)
                }
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 text-center text-sm">
                    {language.code === 'en' && '🇬🇧'}
                    {language.code === 'hi' && '🇮🇳'}
                    {language.code === 'mr' && '🇮🇳'}
                    {language.code === 'gu' && '🇮🇳'}
                    {language.code === 'te' && '🇮🇳'}
                    {language.code === 'ta' && '🇮🇳'}
                  </span>

                  <span>{language.label}</span>
                </span>

                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-700" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
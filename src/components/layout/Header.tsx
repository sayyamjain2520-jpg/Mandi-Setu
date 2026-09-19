import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import {
  useLanguage,
  type Locale,
} from '@/context/LanguageContext'
import { NotificationModal } from '@/components/feedback/NotificationModal'
import {
  Bell,
  Smartphone,
  UserCheck,
  LogOut,
  ChevronDown,
  Languages,
  Check,
} from 'lucide-react'
import type { UserRole } from '@/types/user.types'

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

export const Header: React.FC = () => {
  const { user, role, switchPersona, logout, isLocalMode } = useAuth()
  const { unreadCount, setIsSmsDrawerOpen } = useNotifications()
  const { locale, setLocale } = useLanguage()

  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)

  const languageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const handleRoleChange = (newRole: UserRole) => {
    switchPersona(newRole)
    setIsRoleMenuOpen(false)
  }

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsLanguageMenuOpen(false)
  }

  const currentLanguage =
    languages.find((language) => language.code === locale) ??
    languages[0]

  const roleLabels: Record<
    UserRole,
    {
      title: string
      color: string
      bg: string
    }
  > = {
    farmer: {
      title: 'Farmer App',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
    },

    operator: {
      title: 'Mandi Operator',
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
    },

    admin: {
      title: 'Admin Console',
      color: 'text-indigo-700',
      bg: 'bg-indigo-50 border-indigo-200',
    },
  }

  const activeRoleBadge = role
    ? roleLabels[role]
    : roleLabels.farmer

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/mandi-setu-logo.png"
              alt="Mandi Setu"
              className="w-10 h-10 rounded-xl object-contain shadow-sm ring-2 ring-emerald-500/20 shrink-0"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-slate-900 uppercase font-mono">
                  MANDI SETU
                </span>

                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  Govt of India APMC
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium leading-none truncate">
                Smart Procurement & Real-Time Queue
              </p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* LANGUAGE DROPDOWN */}
            <div
              ref={languageRef}
              className="relative"
            >
              <button
                type="button"
                aria-label="Select language"
                aria-haspopup="listbox"
                aria-expanded={isLanguageMenuOpen}
                onClick={() =>
                  setIsLanguageMenuOpen((open) => !open)
                }
                className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
              >
                <Languages className="w-4 h-4 text-emerald-700" />

                <span className="hidden sm:inline text-xs font-bold whitespace-nowrap">
                  {currentLanguage.label}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isLanguageMenuOpen
                      ? 'rotate-180'
                      : ''
                  }`}
                />
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200 bg-white shadow-2xl z-[100] p-1.5">

                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">
                      Select Language
                    </p>
                  </div>

                  {languages.map((language) => {
                    const isSelected =
                      language.code === locale

                    return (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() =>
                          handleLanguageChange(
                            language.code
                          )
                        }
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>
                          {language.label}
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

            {/* ROLE SWITCHER */}
            <div className="relative">
              <button
                onClick={() =>
                  setIsRoleMenuOpen(!isRoleMenuOpen)
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs ${activeRoleBadge.bg} ${activeRoleBadge.color}`}
                title="Switch active role persona"
              >
                <UserCheck className="w-3.5 h-3.5" />

                <span className="hidden md:inline">
                  {activeRoleBadge.title}
                </span>

                <span className="md:hidden capitalize">
                  {role}
                </span>

                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">

                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Switch Role View{' '}
                      {isLocalMode && '(Dev Mode)'}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleRoleChange('farmer')
                    }
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition ${
                      role === 'farmer'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>🌾 Farmer Portal (Kisan)</span>
                    {role === 'farmer' && (
                      <span>✓</span>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      handleRoleChange('operator')
                    }
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition ${
                      role === 'operator'
                        ? 'bg-amber-50 text-amber-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>⚖️ Mandi Operator (Gate/Weigh)</span>
                    {role === 'operator' && (
                      <span>✓</span>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      handleRoleChange('admin')
                    }
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition ${
                      role === 'admin'
                        ? 'bg-indigo-50 text-indigo-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>📊 Administrator (Directorate)</span>
                    {role === 'admin' && (
                      <span>✓</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* SMS LOGS */}
            <button
              onClick={() =>
                setIsSmsDrawerOpen(true)
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition"
              title="Open simulated SMS logs"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />

              <span className="hidden sm:inline">
                SMS Logs
              </span>
            </button>

            {/* NOTIFICATIONS */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Open notifications"
            >
              <Bell className="w-5 h-5" />

              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* LOGOUT */}
            {user && (
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Sign out / Switch user"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  )
}
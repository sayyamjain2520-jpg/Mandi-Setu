import React from 'react'
import { useNotifications } from '@/context/NotificationContext'
import { Bell, CheckCircle2, AlertTriangle, X, Volume2 } from 'lucide-react'

export const ToastBanner: React.FC = () => {
  const { activeToast, dismissToast } = useNotifications()

  if (!activeToast) return null

  const isUrgentCall = activeToast.type === 'queue_call'

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-[calc(100%-2rem)] animate-in slide-in-from-top-4 duration-300">
      <div
        className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-start gap-3.5 ${
          isUrgentCall
            ? 'bg-rose-900/95 text-white border-rose-700 ring-4 ring-rose-500/20'
            : activeToast.type === 'weighment_done' || activeToast.type === 'payment_credited'
            ? 'bg-emerald-900/95 text-white border-emerald-700'
            : 'bg-slate-900/95 text-white border-slate-700'
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isUrgentCall
              ? 'bg-rose-800 text-rose-200 animate-bounce'
              : 'bg-white/10 text-emerald-300'
          }`}
        >
          {isUrgentCall ? (
            <Volume2 className="w-5 h-5" />
          ) : activeToast.type === 'payment_credited' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : activeToast.type === 'system' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold tracking-tight">{activeToast.title}</h4>
            {isUrgentCall && (
              <span className="px-2 py-0.5 text-[10px] uppercase font-black bg-rose-500 text-white rounded-md tracking-wider">
                Live Turn
              </span>
            )}
          </div>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">{activeToast.message}</p>
        </div>

        <button
          onClick={dismissToast}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

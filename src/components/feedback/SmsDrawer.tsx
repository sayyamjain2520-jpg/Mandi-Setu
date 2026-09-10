import React from 'react'
import { useNotifications } from '@/context/NotificationContext'
import { MessageSquare, X, Smartphone, CheckCheck } from 'lucide-react'

export const SmsDrawer: React.FC = () => {
  const { smsLogs, isSmsDrawerOpen, setIsSmsDrawerOpen } = useNotifications()

  if (!isSmsDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-950 text-slate-100 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Live SMS Gateway Log</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  SENDER: VK-MNDSETU
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated farmer feature-phone alerts
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSmsDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-3 bg-emerald-950/40 border-b border-emerald-900/50 text-xs text-emerald-300 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Farmers without smartphones receive these transactional SMS in real-time.</span>
        </div>

        {/* SMS Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {smsLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No SMS alerts dispatched yet.
            </div>
          ) : (
            smsLogs.map((sms) => (
              <div
                key={sms.id}
                className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-sm relative group hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    To: {sms.recipientPhone} ({sms.farmerName})
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCheck className="w-3.5 h-3.5" />
                    {sms.status}
                  </span>
                </div>

                <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-sans">
                  {sms.message}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                  <span>{new Date(sms.sentAt).toLocaleTimeString()}</span>
                  {sms.tokenNumber && (
                    <span className="text-emerald-400 font-bold">{sms.tokenNumber}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 text-center text-xs text-slate-500 font-mono">
          Govt of India - Department of Agriculture SMS Push Service
        </div>
      </div>
    </div>
  )
}

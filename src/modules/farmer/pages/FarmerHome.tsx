import React from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Booking, QueueEntry, Commodity } from '@/types/procurement.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import {
  CalendarPlus,
  QrCode,
  MapPin,
  ReceiptText,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import type { FarmerTab } from '@/components/layout/FarmerBottomNav'

interface FarmerHomeProps {
  onNavigate: (tab: FarmerTab) => void
  activeBooking?: Booking
  activeQueue?: QueueEntry
  commodities: Commodity[]
}

export const FarmerHome: React.FC<FarmerHomeProps> = ({
  onNavigate,
  activeBooking,
  activeQueue,
  commodities,
}) => {
  const { user } = useAuth()
  const isCalled = activeBooking?.status === 'called' || activeQueue?.currentStage === 'called_to_gate'

  return (
    <div className="space-y-5 pb-20">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-emerald-100 mb-3 border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Verified PM-Kisan Member • {user?.kisanId || 'KCC-RJ-2024'}</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight leading-tight">
            Namaste, {user?.fullName || 'Kisan Mitra'}!
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm">
            Mandi Setu AI ensures zero waiting at the mandi gate. Book your time slot, get a digital token, and track weighment transparently.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('book')}
              leftIcon={<CalendarPlus className="w-4 h-4 text-emerald-400" />}
              className="bg-white text-emerald-900 hover:bg-emerald-50 border-none font-bold shadow-sm"
            >
              Book Procurement Slot
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('mandis')}
              leftIcon={<MapPin className="w-4 h-4" />}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Check Mandis
            </Button>
          </div>
        </div>

        {/* Decorative background wheat shape */}
        <div className="absolute -right-6 -bottom-10 opacity-10 text-white pointer-events-none">
          <svg className="w-56 h-56 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
      </div>

      {/* Active Token Callout Widget (if user has active booking) */}
      {activeBooking && activeBooking.status !== 'completed' && activeBooking.status !== 'cancelled' && (
        <div
          onClick={() => onNavigate('tokens')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            isCalled
              ? 'bg-rose-50 border-rose-500 ring-4 ring-rose-500/10'
              : 'bg-emerald-50/70 border-emerald-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Active Booking
                </span>
                <StatusPill stage={activeQueue?.currentStage} bookingStatus={activeBooking.status} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Token {activeBooking.tokenNumber}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {activeBooking.commodityName} • {activeBooking.centreName}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
              <QrCode className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {activeQueue && activeQueue.estimatedWaitMinutes > 0
                  ? `Queue wait ~${activeQueue.estimatedWaitMinutes}m`
                  : isCalled
                  ? '🚨 CALLED TO GATE NOW'
                  : 'Slot Confirmed'}
              </span>
            </div>

            <span className="font-bold text-emerald-800 inline-flex items-center gap-1 text-xs">
              View Digital Pass <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        <Card
          hoverEffect
          onClick={() => onNavigate('book')}
          className="p-4 border-slate-200 hover:border-emerald-300"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Book Slot</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Reserve mandi gate token</p>
        </Card>

        <Card
          hoverEffect
          onClick={() => onNavigate('tokens')}
          className="p-4 border-slate-200 hover:border-emerald-300"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
            <QrCode className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Digital Token</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Scan pass & live queue</p>
        </Card>

        <Card
          hoverEffect
          onClick={() => onNavigate('mandis')}
          className="p-4 border-slate-200 hover:border-emerald-300"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Mandi Centres</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Check capacity & slots</p>
        </Card>

        <Card
          hoverEffect
          onClick={() => onNavigate('payments')}
          className="p-4 border-slate-200 hover:border-emerald-300"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
            <ReceiptText className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">DBT Receipts</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Weighment & bank credits</p>
        </Card>
      </div>

      {/* Official MSP Rates Ticker */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Govt MSP Procurement Rates (2026 Season)
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
            Guaranteed
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {commodities.map((comm) => (
            <div key={comm.id} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">{comm.name}</p>
                <p className="text-[10px] text-slate-500">
                  {comm.variety} • Max Moisture: {comm.maxMoisturePercentage}%
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-800 font-mono">
                  ₹{comm.mspPricePerQuintal.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">/ Quintal</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

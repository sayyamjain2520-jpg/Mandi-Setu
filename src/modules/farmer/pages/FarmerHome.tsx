import React, { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Booking, QueueEntry, Commodity } from '@/types/procurement.types'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import type { FarmerTab } from '@/components/layout/FarmerBottomNav'
import { MSPTicker } from '@/components/layout/MSPTicker'
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  MapPin,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  WalletCards,
  Wheat,
  Zap,
} from 'lucide-react'

interface FarmerHomeProps {
  onNavigate: (tab: FarmerTab) => void
  activeBooking?: Booking
  activeQueue?: QueueEntry
  commodities: Commodity[]
}

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`

export const FarmerHome: React.FC<FarmerHomeProps> = ({
  onNavigate,
  activeBooking,
  activeQueue,
  commodities,
}) => {
  const { user } = useAuth()

  const isCalled =
    activeBooking?.status === 'called' ||
    activeQueue?.currentStage === 'called_to_gate'

  const activeWait = activeQueue?.estimatedWaitMinutes ?? 0

  const featuredCommodities = useMemo(
    () => commodities.filter((commodity) => commodity.isActive).slice(0, 3),
    [commodities],
  )

  return (
    <div className="min-h-full space-y-5 bg-gradient-to-b from-slate-50 via-white to-white pb-28">
      <section className="relative overflow-hidden rounded-[30px] border border-emerald-950/10 bg-[radial-gradient(circle_at_85%_15%,rgba(52,211,153,0.18),transparent_25%),linear-gradient(135deg,#052e2a_0%,#075846_48%,#0b8068_100%)] px-5 py-5 text-white shadow-[0_24px_70px_-32px_rgba(4,120,87,0.6)] sm:px-7 sm:py-7">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-50 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.12)]" />
              Smart procurement command centre
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/10 px-2.5 py-1.5 text-[9px] font-bold text-white/80">
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              Live connected
            </span>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_0.75fr] lg:items-end">
            <div>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                Namaste, {user?.fullName || 'Kisan Mitra'} 
              </h2>

              <p className="mt-3 max-w-2xl text-xs leading-6 text-emerald-50/80 sm:text-sm">
                Book ahead, follow your queue live, check today&apos;s MSP reference rates,
                and keep your procurement journey in one place.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate('book')}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-emerald-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white/60"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Book Procurement Slot
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('mandis')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-black text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <MapPin className="h-4 w-4" />
                  Explore Mandis
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <MSPTicker commodities={commodities} />

      {activeBooking &&
        activeBooking.status !== 'completed' &&
        activeBooking.status !== 'cancelled' && (
          <button
            type="button"
            onClick={() => onNavigate('tokens')}
            className={`group w-full rounded-[26px] border p-4 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.4)] transition-all sm:p-5 ${
              isCalled
                ? 'border-rose-300 bg-gradient-to-r from-rose-50 to-white hover:border-rose-400'
                : 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 hover:border-emerald-300'
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    isCalled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <QrCode className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Active booking
                    </span>

                    <StatusPill
                      stage={activeQueue?.currentStage}
                      bookingStatus={activeBooking.status}
                    />
                  </div>

                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    Token {activeBooking.tokenNumber}
                  </h2>

                  <p className="mt-0.5 max-w-xl truncate text-xs text-slate-600">
                    {activeBooking.commodityName} · {activeBooking.centreName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Queue status
                    </p>
                    <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  <p className={`mt-1 text-sm font-black ${isCalled ? 'text-rose-700' : 'text-emerald-800'}`}>
                    {isCalled
                      ? 'Called to gate now'
                      : activeWait > 0
                        ? `~${activeWait} min wait`
                        : 'Slot confirmed'}
                  </p>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCalled ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: isCalled ? '100%' : activeWait > 0 ? '62%' : '28%',
                      }}
                    />
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
              </div>
            </div>
          </button>
        )}


      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Quick access
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
              Your mandi tools
            </h2>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold text-slate-400"></p>
            <p className="text-[11px] font-bold text-slate-700"></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              tab: 'book' as FarmerTab,
              title: 'Book Slot',
              subtitle: 'Reserve your mandi visit.',
              icon: CalendarPlus,
              iconClass: 'bg-emerald-100 text-emerald-800',
            },
            {
              tab: 'tokens' as FarmerTab,
              title: 'Digital Token',
              subtitle: 'Open your pass and queue.',
              icon: QrCode,
              iconClass: 'bg-amber-100 text-amber-800',
            },
            {
              tab: 'mandis' as FarmerTab,
              title: 'Mandi Centres',
              subtitle: 'Capacity, timings and slots.',
              icon: Store,
              iconClass: 'bg-sky-100 text-sky-800',
            },
            {
              tab: 'payments' as FarmerTab,
              title: 'DBT Receipts',
              subtitle: 'Weighment and bank credits.',
              icon: ReceiptText,
              iconClass: 'bg-violet-100 text-violet-800',
            },
          ].map(({ tab, title, subtitle, icon: Icon, iconClass }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigate(tab)}
              className="group min-h-[138px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_14px_35px_-30px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_42px_-28px_rgba(5,150,105,0.35)] focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              aria-label={title}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass} transition-transform group-hover:scale-105`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-black text-slate-950">{title}</h3>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{subtitle}</p>

              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 opacity-80 transition group-hover:opacity-100">
                Open
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      </section>



      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">Plan before you travel</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Check slots and queue status before leaving for the mandi.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">Transparent queue</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                See your position, stage and estimated waiting time live.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">Digital records</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Keep procurement, weighment and payment records in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {featuredCommodities.length > 0 && (
        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Mandi catalogue
              </p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                Popular procurement crops
              </h2>
            </div>

            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[9px] font-bold text-emerald-700 sm:inline-flex">
              <TrendingUp className="h-3.5 w-3.5" />
              Reference rates
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {featuredCommodities.map((commodity) => (
              <div
                key={commodity.id}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Wheat className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    {commodity.category}
                  </span>
                </div>

                <p className="mt-3 truncate text-xs font-black text-slate-950">
                  {commodity.name}
                </p>

                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-black text-emerald-800">
                      {formatCurrency(commodity.mspPricePerQuintal)}
                    </p>
                    <p className="text-[9px] text-slate-400">per quintal</p>
                  </div>

                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[26px] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-slate-950">
                Ready for your next mandi visit?
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Pick a slot that matches your schedule and avoid unnecessary waiting.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => onNavigate('book')}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="shrink-0"
          >
            Book a Slot
          </Button>
        </div>
      </section>

      <span className="sr-only">
        <WalletCards />
      </span>
    </div>
  )
}

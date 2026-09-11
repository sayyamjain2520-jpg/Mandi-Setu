import React, { useState } from 'react'
import type { Booking, QueueEntry, QueueStage } from '@/types/procurement.types'
import { TokenQRPass } from '@/components/qr/TokenQRPass'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import {
  QrCode,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock3,
  Truck,
  Scale,
  ClipboardCheck,
  PackageCheck,
  MapPin,
} from 'lucide-react'

interface MyTokensViewProps {
  bookings: Booking[]
  queueEntries: QueueEntry[]
  onBookNewSlot: () => void
}

const TRACKING_STAGES: {
  key: QueueStage
  title: string
  hindi: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    key: 'waiting',
    title: 'Waiting in Queue',
    hindi: 'कतार में प्रतीक्षा',
    description: 'Your vehicle is waiting for its turn.',
    icon: <Clock3 className="w-5 h-5" />,
  },
  {
    key: 'called_to_gate',
    title: 'Called to Gate',
    hindi: 'गेट पर बुलाया गया',
    description: 'Please proceed to the mandi gate.',
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    key: 'gate_passed',
    title: 'Gate Passed',
    hindi: 'गेट चेक-इन',
    description: 'Your vehicle has entered the mandi yard.',
    icon: <Truck className="w-5 h-5" />,
  },
  {
    key: 'quality_check',
    title: 'Quality Check',
    hindi: 'गुणवत्ता जांच',
    description: 'Your crop is being inspected.',
    icon: <ClipboardCheck className="w-5 h-5" />,
  },
  {
    key: 'weighbridge',
    title: 'Weighbridge',
    hindi: 'वजन पुल',
    description: 'Your vehicle is at the weighbridge.',
    icon: <Scale className="w-5 h-5" />,
  },
  {
    key: 'unloading',
    title: 'Unloading',
    hindi: 'अनलोडिंग',
    description: 'Your crop is being unloaded.',
    icon: <Truck className="w-5 h-5" />,
  },
  {
    key: 'settled',
    title: 'Completed',
    hindi: 'पूर्ण',
    description: 'Procurement has been completed successfully.',
    icon: <PackageCheck className="w-5 h-5" />,
  },
]

const getStageIndex = (stage?: QueueStage) => {
  if (!stage) return 0

  const index = TRACKING_STAGES.findIndex((item) => item.key === stage)

  return index >= 0 ? index : 0
}

export const MyTokensView: React.FC<MyTokensViewProps> = ({
  bookings,
  queueEntries,
  onBookNewSlot,
}) => {
  const [expandedBookingId, setExpandedBookingId] = useState<string>('')

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto my-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <QrCode className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">
            No Bookings Yet
          </h3>

          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Book a mandi slot to get your digital token and live procurement
            tracking.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={onBookNewSlot}
          leftIcon={<CalendarPlus className="w-4 h-4" />}
        >
          Book Your First Slot
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            My Bookings
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            Track every booked mandi slot in real time
          </p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onBookNewSlot}
          leftIcon={<CalendarPlus className="w-4 h-4" />}
        >
          New Slot
        </Button>
      </div>

      {/* All real bookings */}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const queueEntry = queueEntries.find(
            (q) => q.bookingId === booking.id
          )

          const currentStage =
            queueEntry?.currentStage || 'waiting'

          const isExpanded =
            expandedBookingId === booking.id

          const currentStageIndex =
            getStageIndex(currentStage)

          return (
            <Card
              key={booking.id}
              className="overflow-hidden border-slate-200"
            >
              {/* Booking summary */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-base font-black text-slate-900">
                        {booking.tokenNumber}
                      </span>

                      <StatusPill
                        stage={queueEntry?.currentStage}
                        bookingStatus={booking.status}
                      />
                    </div>

                    <p className="text-sm font-semibold text-slate-800 mt-2">
                      {booking.commodityName}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {booking.slotDate} • {booking.slotTimeStart}–{booking.slotTimeEnd}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>
                        🚜 {booking.numberOfVehicles || 1} Vehicle
                        {(booking.numberOfVehicles || 1) > 1 ? 's' : ''}
                      </span>

                      {booking.vehicleNumber && (
                        <span className="font-mono">
                          {booking.vehicleNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {queueEntry?.currentStage === 'called_to_gate' ? (
                      <div className="text-center">
                        <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto animate-pulse">
                          <MapPin className="w-4 h-4" />
                        </div>

                        <span className="text-[9px] font-black text-rose-600 uppercase block mt-1">
                          Your Turn
                        </span>
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Track button */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedBookingId(
                      isExpanded ? '' : booking.id
                    )
                  }
                  className={`w-full mt-4 rounded-xl px-4 py-3 flex items-center justify-between text-sm font-bold transition ${
                    isExpanded
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {isExpanded ? 'Hide Tracking' : 'Track Procurement'}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Live tracking */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/70 p-4">
                  {/* Tracking header */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                          Procurement Status
                        </p>

                        <h3 className="text-lg font-black text-slate-900 mt-1">
                          {booking.tokenNumber}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Slot
                        </p>
                        <p className="text-xs font-semibold text-slate-800 mt-1">
                          {booking.slotDate}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.slotTimeStart}–{booking.slotTimeEnd}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Vehicles
                        </p>
                        <p className="text-xs font-semibold text-slate-800 mt-1">
                          {booking.numberOfVehicles || 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="space-y-0">
                      {TRACKING_STAGES.map((stage, index) => {
                        const isCompleted =
                          index < currentStageIndex

                        const isCurrent =
                          index === currentStageIndex

                        const isLast =
                          index === TRACKING_STAGES.length - 1

                        return (
                          <div
                            key={stage.key}
                            className="flex gap-3"
                          >
                            {/* Timeline rail */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition ${
                                  isCurrent
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200'
                                    : isCompleted
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  stage.icon
                                )}
                              </div>

                              {!isLast && (
                                <div
                                  className={`w-0.5 h-12 ${
                                    index < currentStageIndex
                                      ? 'bg-emerald-400'
                                      : 'bg-slate-200'
                                  }`}
                                />
                              )}
                            </div>

                            {/* Stage content */}
                            <div
                              className={`flex-1 pb-5 ${
                                isCurrent
                                  ? 'opacity-100'
                                  : index > currentStageIndex
                                    ? 'opacity-40'
                                    : 'opacity-80'
                              }`}
                            >
                              <div
                                className={`rounded-xl border p-3 ${
                                  isCurrent
                                    ? 'border-emerald-300 bg-emerald-50'
                                    : 'border-slate-200 bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      {stage.title}
                                    </h4>

                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      {stage.hindi}
                                    </p>
                                  </div>

                                  {isCurrent && (
                                    <span className="text-[9px] uppercase font-black px-2 py-1 rounded-full bg-emerald-600 text-white">
                                      Current
                                    </span>
                                  )}

                                  {isCompleted && (
                                    <span className="text-[9px] uppercase font-bold text-emerald-700">
                                      Done ✓
                                    </span>
                                  )}
                                </div>

                                {(isCurrent || isCompleted) && (
                                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                    {stage.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Queue information */}
                  {queueEntry && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Queue Position
                        </p>

                        <p className="text-xl font-black text-slate-900 mt-1">
                          #{queueEntry.priorityOrder}
                        </p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          Est. Wait
                        </p>

                        <p className="text-xl font-black text-slate-900 mt-1">
                          {queueEntry.estimatedWaitMinutes ?? 0}
                          <span className="text-xs font-semibold ml-1">
                            min
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* QR pass */}
                  <div className="mt-4">
                    <TokenQRPass
                      booking={booking}
                      queueEntry={queueEntry}
                    />
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
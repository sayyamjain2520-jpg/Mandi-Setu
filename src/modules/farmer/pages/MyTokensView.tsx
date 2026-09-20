import React, { useEffect, useState } from 'react'
import type { Booking, QueueEntry, QueueStage } from '@/types/procurement.types'
import type { ProcurementCentre } from '@/types/mandi.types'
import { TokenQRPass } from '@/components/qr/TokenQRPass'
import { MandiRouteMap } from '@/components/maps/MandiRouteMap'
import { api } from '@/services/api'
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
  Activity,
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

const getCongestionMeta = (
  estimatedWaitMinutes: number,
  farmersAhead: number
) => {
  if (estimatedWaitMinutes >= 60 || farmersAhead >= 15) {
    return {
      label: 'High Congestion',
      shortLabel: 'HIGH',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClassName: 'bg-rose-500',
    }
  }

  if (estimatedWaitMinutes >= 30 || farmersAhead >= 8) {
    return {
      label: 'Moderate Congestion',
      shortLabel: 'MODERATE',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClassName: 'bg-amber-500',
    }
  }

  return {
    label: 'Low Congestion',
    shortLabel: 'LOW',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClassName: 'bg-emerald-500',
  }
}

const getArrivalGuidance = (
  booking: Booking,
  queueEntry?: QueueEntry
) => {
  if (!queueEntry) {
    return {
      title: 'Waiting for queue activation',
      description: 'Your booking is confirmed. Live arrival guidance will appear when your token enters the queue.',
      action: 'Monitor booking',
      className: 'bg-slate-50 border-slate-200 text-slate-700',
      accentClassName: 'bg-slate-500',
    }
  }

  const stage = queueEntry.currentStage

  if (
    stage === 'gate_passed' ||
    stage === 'quality_check' ||
    stage === 'weighbridge' ||
    stage === 'unloading'
  ) {
    return {
      title: 'You are already at the Mandi',
      description: 'Your vehicle has entered the procurement workflow. Follow the current tracking stage.',
      action: 'Stay at Mandi',
      className: 'bg-blue-50 border-blue-200 text-blue-800',
      accentClassName: 'bg-blue-600',
    }
  }

  if (stage === 'called_to_gate') {
    return {
      title: 'Proceed to the Mandi now',
      description: 'Your token has been called. Please move to the gate and keep your digital pass ready.',
      action: 'Proceed now',
      className: 'bg-rose-50 border-rose-200 text-rose-800',
      accentClassName: 'bg-rose-600',
    }
  }

  if (stage === 'settled') {
    return {
      title: 'Procurement completed',
      description: 'Your procurement process is complete. No further arrival is required for this token.',
      action: 'Completed',
      className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      accentClassName: 'bg-emerald-600',
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const isToday = booking.slotDate === today

  if (isToday) {
    return {
      title: 'Stay ready for your turn',
      description: 'Your token is in the live queue. Keep checking the queue position and proceed when the gate call is shown.',
      action: 'Monitor queue',
      className: 'bg-amber-50 border-amber-200 text-amber-800',
      accentClassName: 'bg-amber-500',
    }
  }

  return {
    title: 'Plan for your booked slot',
    description: `Your arrival window is ${booking.slotTimeStart}–${booking.slotTimeEnd}. Live queue guidance will become relevant on the booking date.`,
    action: 'Plan arrival',
    className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    accentClassName: 'bg-emerald-600',
  }
}

const getPredictedServiceTime = (
  booking: Booking,
  estimatedWaitMinutes: number
) => {
  const [hours, minutes] = booking.slotTimeStart
    .split(':')
    .map(Number)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  const base = new Date(`${booking.slotDate}T${booking.slotTimeStart}`)
  if (Number.isNaN(base.getTime())) {
    return null
  }

  // For a future slot, project from the booked start time.
  // For an active/today queue, project from the current time.
  const now = new Date()
  const isToday =
    booking.slotDate ===
    now.toISOString().slice(0, 10)

  const anchor =
    isToday && now.getTime() > base.getTime()
      ? now
      : base

  const predicted = new Date(
    anchor.getTime() +
      Math.max(0, estimatedWaitMinutes) * 60 * 1000
  )

  return predicted.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const getLiveQueueStatus = (stage?: QueueStage) => {
  switch (stage) {
    case 'called_to_gate':
      return {
        label: 'Your token has been called',
        description: 'Please proceed to the mandi gate and keep your digital pass ready.',
        className: 'bg-rose-50 border-rose-200 text-rose-800',
        dotClassName: 'bg-rose-500',
      }
    case 'gate_passed':
      return {
        label: 'Inside Mandi',
        description: 'Your vehicle has entered the yard and is moving through procurement.',
        className: 'bg-blue-50 border-blue-200 text-blue-800',
        dotClassName: 'bg-blue-500',
      }
    case 'quality_check':
      return {
        label: 'Quality inspection in progress',
        description: 'Your crop is currently being inspected by the procurement team.',
        className: 'bg-violet-50 border-violet-200 text-violet-800',
        dotClassName: 'bg-violet-500',
      }
    case 'weighbridge':
      return {
        label: 'Weighment in progress',
        description: 'Your vehicle is at the weighbridge for official weighing.',
        className: 'bg-blue-50 border-blue-200 text-blue-800',
        dotClassName: 'bg-blue-500',
      }
    case 'unloading':
      return {
        label: 'Unloading in progress',
        description: 'Your crop is being unloaded at the procurement centre.',
        className: 'bg-amber-50 border-amber-200 text-amber-800',
        dotClassName: 'bg-amber-500',
      }
    case 'settled':
      return {
        label: 'Procurement completed',
        description: 'Your procurement has been completed and the receipt has been issued.',
        className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        dotClassName: 'bg-emerald-500',
      }
    case 'no_show':
      return {
        label: 'Marked as No Show',
        description: 'This token was marked as no-show by the mandi operator.',
        className: 'bg-slate-100 border-slate-200 text-slate-700',
        dotClassName: 'bg-slate-500',
      }
    case 'waiting':
    default:
      return {
        label: 'Waiting for your turn',
        description: 'Stay ready and watch your live queue position for the next gate call.',
        className: 'bg-amber-50 border-amber-200 text-amber-800',
        dotClassName: 'bg-amber-500',
      }
  }
}

export const MyTokensView: React.FC<MyTokensViewProps> = ({
  bookings,
  queueEntries,
  onBookNewSlot,
}) => {
  const [expandedBookingId, setExpandedBookingId] = useState<string>('')
  const [centresByBookingId, setCentresByBookingId] = useState<Record<string, ProcurementCentre | undefined>>({})

  useEffect(() => {
    let active = true

    const loadCentres = async () => {
      try {
        const centres = await api.getCentres()
        if (!active) return

        const next: Record<string, ProcurementCentre | undefined> = {}
        bookings.forEach((booking) => {
          next[booking.id] = centres.find((centre) => centre.id === booking.centreId)
        })
        setCentresByBookingId(next)
      } catch (error) {
        console.error('Failed to load mandi locations:', error)
      }
    }

    if (bookings.length > 0) loadCentres()

    return () => {
      active = false
    }
  }, [bookings])

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
                        {booking.tokenNumber || 'PENDING'}
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

                {/* Live Queue Status */}
                {queueEntry && booking.status !== 'completed' && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    {(() => {
                      const liveStatus = getLiveQueueStatus(
                        queueEntry.currentStage
                      )
                      const queuePosition = Math.max(
                        1,
                        Number(queueEntry.priorityOrder) || 1
                      )
                      const farmersAhead = Math.max(
                        0,
                        queuePosition - 1
                      )

                      const progressIndex = Math.max(
                        0,
                        Math.min(
                          TRACKING_STAGES.length - 1,
                          getStageIndex(queueEntry.currentStage)
                        )
                      )
                      const progressPercent =
                        (progressIndex /
                          Math.max(1, TRACKING_STAGES.length - 1)) *
                        100

                      return (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${liveStatus.dotClassName} ${
                                    queueEntry.currentStage ===
                                      'called_to_gate' ||
                                    queueEntry.currentStage === 'waiting'
                                      ? 'animate-pulse'
                                      : ''
                                  }`}
                                />
                                <p className="text-[10px] uppercase tracking-wider font-black text-slate-400">
                                  Live Queue Status
                                </p>
                              </div>

                              <p className="text-base font-black text-slate-900 mt-1">
                                {liveStatus.label}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {liveStatus.description}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${liveStatus.className}`}
                            >
                              LIVE
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                              <p className="text-[9px] uppercase font-bold tracking-wide text-emerald-700">
                                Queue Position
                              </p>
                              <p className="text-2xl font-black text-slate-900 mt-1">
                                #{queuePosition}
                              </p>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                your token
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-[9px] uppercase font-bold tracking-wide text-slate-400">
                                Farmers Ahead
                              </p>
                              <p className="text-2xl font-black text-slate-900 mt-1">
                                {farmersAhead}
                              </p>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                before your turn
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                              <span>Procurement Progress</span>
                              <span>{Math.round(progressPercent)}%</span>
                            </div>

                            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{
                                  width: `${progressPercent}%`,
                                }}
                              />
                            </div>

                            <div className="flex justify-between mt-2 text-[8px] font-semibold text-slate-400">
                              <span>Queue</span>
                              <span>Gate</span>
                              <span>QC</span>
                              <span>Weight</span>
                              <span>Done</span>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}

                {/* Smart Arrival */}
                {queueEntry && booking.status !== 'completed' && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                    {(() => {
                      const estimatedWait = Math.max(
                        0,
                        Number(queueEntry.estimatedWaitMinutes) || 0
                      )
                      const farmersAhead = Math.max(
                        0,
                        Number(queueEntry.priorityOrder || 1) - 1
                      )
                      const congestion = getCongestionMeta(
                        estimatedWait,
                        farmersAhead
                      )
                      const predictedServiceTime =
                        getPredictedServiceTime(
                          booking,
                          estimatedWait
                        )

                      return (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                                  <Activity className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider font-black text-emerald-700">
                                    Smart Arrival
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Live queue-based estimate
                                  </p>
                                </div>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${congestion.className}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${congestion.dotClassName}`}
                              />
                              {congestion.shortLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="rounded-xl bg-white border border-slate-200 p-3">
                              <p className="text-[9px] uppercase font-bold text-slate-400">
                                Ahead
                              </p>
                              <p className="text-lg font-black text-slate-900 mt-1">
                                {farmersAhead}
                              </p>
                              <p className="text-[9px] text-slate-500">
                                farmers
                              </p>
                            </div>

                            <div className="rounded-xl bg-white border border-slate-200 p-3">
                              <p className="text-[9px] uppercase font-bold text-slate-400">
                                Est. Wait
                              </p>
                              <p className="text-lg font-black text-slate-900 mt-1">
                                {estimatedWait}
                              </p>
                              <p className="text-[9px] text-slate-500">
                                minutes
                              </p>
                            </div>

                            <div className="rounded-xl bg-white border border-slate-200 p-3">
                              <p className="text-[9px] uppercase font-bold text-slate-400">
                                Queue
                              </p>
                              <p className="text-lg font-black text-slate-900 mt-1">
                                #{queueEntry.priorityOrder}
                              </p>
                              <p className="text-[9px] text-slate-500">
                                position
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl bg-white border border-emerald-200 px-3 py-2.5 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[9px] uppercase font-black tracking-wider text-emerald-700">
                                Predicted Service
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Based on current queue conditions
                              </p>
                            </div>
                            <p className="text-sm font-black text-slate-900 whitespace-nowrap">
                              {predictedServiceTime || 'Updating...'}
                            </p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}

                {/* Smart Arrival Guidance */}
                {booking.status !== 'completed' && (
                  <div className="mt-3">
                    {(() => {
                      const guidance = getArrivalGuidance(
                        booking,
                        queueEntry
                      )

                      return (
                        <div
                          className={`rounded-2xl border p-3.5 ${guidance.className}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 ${guidance.accentClassName}`}
                            >
                              <MapPin className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider font-black">
                                    Arrival Guidance
                                  </p>
                                  <p className="text-sm font-black mt-0.5">
                                    {guidance.title}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-full bg-white/80 border border-current/10 px-2.5 py-1 text-[9px] font-black uppercase">
                                  {guidance.action}
                                </span>
                              </div>

                              <p className="text-xs mt-1.5 leading-relaxed opacity-80">
                                {guidance.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

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

                  {/* Real GPS route */}
                  {(() => {
                    const centre = centresByBookingId[booking.id]
                    const hasValidCoordinates =
                      Number.isFinite(Number(centre?.latitude)) &&
                      Number.isFinite(Number(centre?.longitude)) &&
                      Number(centre?.latitude) !== 0 &&
                      Number(centre?.longitude) !== 0

                    if (!centre || !hasValidCoordinates) {
                      return (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-black text-emerald-700">
                                Live Route
                              </p>
                              <p className="text-xs font-bold text-slate-800 mt-1">
                                Mandi location is not configured yet.
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Add the real latitude and longitude for this procurement centre to enable GPS routing.
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <MandiRouteMap
                        centreName={centre.name}
                        destinationLat={Number(centre.latitude)}
                        destinationLon={Number(centre.longitude)}
                        className="mb-4"
                      />
                    )
                  })()}

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
                    <div className="mt-4">
                      <p className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-2">
                        Live Queue Details
                      </p>
                      <div className="grid grid-cols-2 gap-3">
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
                    </div>
                  )}

                  {/* Digital QR pass — available only after operator acceptance */}
                  <div className="mt-4">
                    {booking.status === 'confirmed' &&
                    booking.tokenNumber &&
                    booking.qrCodeData ? (
                      <TokenQRPass
                        booking={booking}
                        queueEntry={queueEntry}
                      />
                    ) : (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                            <QrCode className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-sm font-black text-amber-900">
                              Digital QR pass is not active yet
                            </p>
                            <p className="mt-1 text-xs leading-5 text-amber-800/80">
                              Your booking request must be accepted by the Mandi operator first.
                              Once accepted, Mandi Setu will generate your token and QR pass.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
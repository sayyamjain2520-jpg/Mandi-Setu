import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { Booking, QueueEntry, ProcurementRecord, QueueStage } from '@/types/procurement.types'
import type { ProcurementCentre } from '@/types/mandi.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { StatusPill } from '@/components/ui/Badge'
import { GateScanner } from '@/components/qr/GateScanner'
import { ProcurementEntryModal } from '@/modules/operator/components/ProcurementEntryModal'
import {
  Volume2,
  CheckCircle2,
  Truck,
  Scale,
  Building2,
  AlertCircle,
  Filter,
} from 'lucide-react'

export const OperatorDashboard: React.FC = () => {
  const { user } = useAuth()
  const [centres, setCentres] = useState<ProcurementCentre[]>([])
  const [centre, setCentre] = useState<ProcurementCentre | null>(null)
  const [selectedCentreId, setSelectedCentreId] = useState<string>('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [records, setRecords] = useState<ProcurementRecord[]>([])
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [selectedBookingForWeighment, setSelectedBookingForWeighment] = useState<Booking | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isCallingNext, setIsCallingNext] = useState(false)
  const [isWeighing, setIsWeighing] = useState(false)

  // All real procurement centres are loaded from Supabase.
  // The operator can switch the active mandi from the dropdown.
  const isValidUUID = (value?: string | null) => {
    if (!value) return false

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  }

  // Load all real procurement centres once.
  useEffect(() => {
    const loadCentres = async () => {
      const data = await api.getCentres()
      setCentres(data)

      if (data.length === 0) return

      const preferredCentreId =
        isValidUUID(user?.mandiId) &&
        data.some((c) => c.id === user?.mandiId)
          ? user!.mandiId!
          : data[0].id

      setSelectedCentreId((current) =>
        current && data.some((c) => c.id === current)
          ? current
          : preferredCentreId
      )
    }

    loadCentres()
  }, [user?.mandiId])

  const centreId = selectedCentreId

  const loadData = useCallback(async () => {
    if (!centreId) {
      setCentre(null)
      setBookings([])
      setQueue([])
      setRecords([])
      return
    }

    const [c, b, q, r] = await Promise.all([
      api.getCentreById(centreId),
      api.getBookings(undefined, centreId),
      api.getQueue(centreId),
      api.getProcurementRecords(undefined, centreId),
    ])

    setCentre(c || null)
    setBookings(b)
    setQueue(q)
    setRecords(r)
  }, [centreId])

  useEffect(() => {
    loadData()

    const unsubscribe = api.subscribe(() => {
      loadData()
    })

    return () => unsubscribe()
  }, [loadData])

  // Call next farmer in queue
  const handleCallNext = async () => {
    setIsCallingNext(true)
    setFeedbackMessage(null)
    try {
      const res = await api.callNextInQueue(centreId)
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.message })
      } else {
        setFeedbackMessage({ type: 'error', text: res.message })
      }
    } catch (error) {
  console.error('Call Next Farmer error:', error)

  setFeedbackMessage({
    type: 'error',
    text:
      error instanceof Error
        ? error.message
        : 'Failed to broadcast gate call',
  })
} finally {
      setIsCallingNext(false)
    }
  }

  // Gate QR / Manual scan check-in
  const handleGateScan = async (tokenOrBooking: string) => {
    setFeedbackMessage(null)
    const res = await api.checkInAtGate(tokenOrBooking)
    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message })
    } else {
      setFeedbackMessage({ type: 'error', text: res.message })
    }
  }

  // Update specific queue stage
  const handleUpdateStage = async (queueId: string, stage: QueueStage) => {
    await api.updateQueueStage(queueId, stage)
    loadData()
  }

  // Open weighbridge modal
  const handleOpenWeighment = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId)
    if (booking) {
      setSelectedBookingForWeighment(booking)
    }
  }

  // Submit weighment & procurement settlement
  const handleProcurementSubmit = async (data: {
    bookingId: string
    grossWeightKg: number
    tareWeightKg: number
    moisturePercentage: number
    qualityGrade: ProcurementRecord['qualityGrade']
  }) => {
    setIsWeighing(true)
    try {
      await api.recordProcurement({
        ...data,
        operatorId: user?.id || '',
      })
      setFeedbackMessage({
        type: 'success',
        text: `Procurement recorded successfully! Slip issued and payment initiated.`,
      })
      setSelectedBookingForWeighment(null)
    } finally {
      setIsWeighing(false)
    }
  }

  // Filtered queue entries
  const filteredQueue = queue.filter((q) => {
    if (stageFilter === 'all') return true
    if (stageFilter === 'active') return q.currentStage !== 'settled' && q.currentStage !== 'no_show'
    return q.currentStage === stageFilter
  })

  // Dynamic metrics calculated from live arrays
  const totalBookingsToday = bookings.length
  const activeWaiting = queue.filter((q) => q.currentStage === 'waiting').length
  const insideYard = queue.filter(
    (q) => q.currentStage === 'gate_passed' || q.currentStage === 'called_to_gate' || q.currentStage === 'weighbridge'
  ).length
  const completedToday = records.length

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-20">
      {/* Mandi Centre Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-bold mb-1">
            <Building2 className="w-4 h-4" />
            <span>OPERATOR CONSOLE • CODE: {centre?.code || 'RJ-KOTA-01'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {centre?.name || 'Mandi Procurement Centre'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operator Incharge: {user?.fullName || 'Rajesh Kumar Sharma'} • Yard Gate 1 & Weighbridge 2
          </p>
        </div>

        {/* Primary Call Next Action Button */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            variant="warning"
            isLoading={isCallingNext}
            onClick={handleCallNext}
            leftIcon={<Volume2 className="w-5 h-5 animate-pulse" />}
            className="w-full md:w-auto font-black shadow-lg hover:shadow-amber-500/20 text-slate-950 bg-amber-400 hover:bg-amber-300"
          >
            Call Next Farmer to Gate
          </Button>
        </div>
      </div>

      {/* Active Mandi Selector */}
      <Card className="p-4 border-slate-200">
        <Select
          label="Select Mandi Procurement Centre"
          value={selectedCentreId}
          onChange={(e) => {
            setSelectedCentreId(e.target.value)
            setStageFilter('all')
            setFeedbackMessage(null)
          }}
          options={centres.map((c) => ({
            label: `${c.name} (${c.district}, ${c.state})`,
            value: c.id,
          }))}
        />
        <p className="text-[11px] text-slate-500 mt-2">
          Queue, bookings, KPIs and gate operations below show live Supabase data for the selected mandi.
        </p>
      </Card>

      {/* Operational KPI Cards (Dynamically calculated) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Today's Scheduled
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-slate-900">{totalBookingsToday}</span>
            <span className="text-xs text-slate-500">Bookings</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Waiting Outside Gate
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-amber-600">{activeWaiting}</span>
            <span className="text-xs text-amber-700 font-medium">In Queue</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Inside Yard / Active
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-blue-600">{insideYard}</span>
            <span className="text-xs text-blue-700 font-medium">At Bays</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Settled / Dispatched
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-emerald-700">{completedToday}</span>
            <span className="text-xs text-emerald-700 font-medium">Slips Issued</span>
          </div>
        </Card>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Gate Verification & Barcode Scanner */}
      <GateScanner onScanSuccess={handleGateScan} />

      {/* Live Queue Operations Board */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Real-Time Mandi Queue & Yard Board</h3>
            <p className="text-xs text-slate-500">Live order of arrivals, inspection, and weighbridge bays</p>
          </div>

          {/* Stage Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active Queue' },
              { id: 'waiting', label: 'Waiting' },
              { id: 'called_to_gate', label: 'Called' },
              { id: 'gate_passed', label: 'In Yard' },
              { id: 'settled', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStageFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  stageFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Queue Cards / Table */}
        <div className="space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No queue entries found for this stage filter.
            </div>
          ) : (
            filteredQueue.map((entry) => {
              return (
                <Card
                  key={entry.id}
                  className={`p-4 border transition-all ${
                    entry.currentStage === 'called_to_gate'
                      ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Token and Farmer Details */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-mono font-black shrink-0 shadow-sm">
                        <span className="text-xs text-slate-400 font-sans">TOKEN</span>
                        <span className="text-base text-amber-400 leading-none mt-0.5">
                          {entry.tokenNumber}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{entry.farmerName}</h4>
                          <StatusPill stage={entry.currentStage} />
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {entry.bookingNumber} • {entry.farmerPhone}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 font-medium">
                          <span className="text-emerald-800 font-bold">{entry.commodityName}</span>
                          <span>•</span>
                          <span>~{entry.estimatedQuantityQuintals} Quintals</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            {entry.vehicleNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Operational Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {entry.currentStage === 'waiting' && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleUpdateStage(entry.id, 'called_to_gate')}
                          leftIcon={<Volume2 className="w-3.5 h-3.5" />}
                        >
                          Call to Gate
                        </Button>
                      )}

                      {entry.currentStage === 'called_to_gate' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleUpdateStage(entry.id, 'gate_passed')}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Mark Gate Admitted
                        </Button>
                      )}

                      {(entry.currentStage === 'gate_passed' || entry.currentStage === 'called_to_gate') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStage(entry.id, 'quality_check')}
                        >
                          Send to QC Lab
                        </Button>
                      )}

                      {(entry.currentStage === 'quality_check' || entry.currentStage === 'gate_passed') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStage(entry.id, 'weighbridge')}
                          leftIcon={<Scale className="w-3.5 h-3.5" />}
                        >
                          Send to Weighbridge
                        </Button>
                      )}

                      {/* Record Procurement & Weighment Button */}
                      {entry.currentStage !== 'settled' && entry.currentStage !== 'no_show' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleOpenWeighment(entry.bookingId)}
                          leftIcon={<Scale className="w-3.5 h-3.5" />}
                          className="font-bold"
                        >
                          Record Weighment & Settle
                        </Button>
                      )}

                      {entry.currentStage !== 'settled' && entry.currentStage !== 'no_show' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStage(entry.id, 'no_show')}
                          className="text-slate-400 hover:text-rose-600 text-xs"
                        >
                          No Show
                        </Button>
                      )}

                      {entry.currentStage === 'settled' && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          ✓ Settled & Receipt Issued
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Weighment Entry Modal */}
      {selectedBookingForWeighment && (
        <ProcurementEntryModal
          isOpen={!!selectedBookingForWeighment}
          onClose={() => setSelectedBookingForWeighment(null)}
          booking={selectedBookingForWeighment}
          onSubmit={handleProcurementSubmit}
          isLoading={isWeighing}
        />
      )}
    </div>
  )
}

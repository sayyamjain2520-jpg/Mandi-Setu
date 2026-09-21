import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { GateVerificationDetails } from '@/services/api'
import type {
  Booking,
  QueueEntry,
  ProcurementRecord,
  QueueStage,
} from '@/types/procurement.types'
import type { ProcurementCentre } from '@/types/mandi.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { GateScanner } from '@/components/qr/GateScanner'
import { GateVerificationModal } from '@/modules/operator/components/GateVerificationModal'
import { ProcurementEntryModal } from '@/modules/operator/components/ProcurementEntryModal'
import { QCInspectionModal, type QCResult } from '@/modules/operator/components/QCInspectionModal'
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

  const [centre, setCentre] = useState<ProcurementCentre | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [records, setRecords] = useState<ProcurementRecord[]>([])
  const [stageFilter, setStageFilter] = useState<string>('all')

  const [selectedBookingForWeighment, setSelectedBookingForWeighment] =
    useState<Booking | null>(null)

  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Inline action feedback: FIFO / queue-order messages stay next to
  // the button that triggered the action instead of appearing as a
  // technical banner at the top of the dashboard.
  const [queueActionToast, setQueueActionToast] = useState<{
    queueId: string
    text: string
  } | null>(null)

  const [isCallingNext, setIsCallingNext] = useState(false)
  const [isWeighing, setIsWeighing] = useState(false)
  const [processingBookingId, setProcessingBookingId] =
    useState<string | null>(null)

  const [gateVerification, setGateVerification] =
    useState<GateVerificationDetails | null>(null)
  const [gateIdentityChecked, setGateIdentityChecked] = useState(false)
  const [gateVehicleChecked, setGateVehicleChecked] = useState(false)
  const [isGateAdmitting, setIsGateAdmitting] = useState(false)

  const [selectedQueueForQC, setSelectedQueueForQC] = useState<QueueEntry | null>(null)
  const [qcResults, setQcResults] = useState<Record<string, QCResult>>({})
  const [qcCommodityMaxMoisture, setQcCommodityMaxMoisture] = useState<number | undefined>(undefined)


  // ------------------------------------------------------------
  // Assigned mandi is the single source of truth.
  // The operator never chooses a mandi from the UI.
  // It comes from public.profiles.mandi_id loaded by AuthContext.
  // ------------------------------------------------------------
  const assignedCentreId = user?.mandiId || ''

  // ------------------------------------------------------------
  // IMPORTANT:
  // Always load using the exact centre ID passed to this function.
  // This prevents stale centre IDs from being used by realtime
  // callbacks.
  // ------------------------------------------------------------
  const loadData = useCallback(async (requestedCentreId: string) => {
    console.log(
      'OPERATOR LOAD DATA CENTRE ID:',
      requestedCentreId
    )

    if (!requestedCentreId) {
      setCentre(null)
      setBookings([])
      setQueue([])
      setRecords([])
      return
    }

    try {
      const [c, b, q, r] = await Promise.all([
        api.getCentreById(requestedCentreId),
        api.getBookings(undefined, requestedCentreId),
        api.getQueue(requestedCentreId),
        api.getProcurementRecords(undefined, requestedCentreId),
      ])

      console.log('OPERATOR DATA LOADED:', {
        centreId: requestedCentreId,
        centre: c,
        bookings: b,
        bookingsCount: b.length,
        queue: q,
        queueCount: q.length,
        records: r,
        recordsCount: r.length,
      })

      if (!c) {
        throw new Error(
          'The assigned procurement centre could not be found.'
        )
      }

      setCentre(c)
      setBookings(b)
      setQueue(q)
      setRecords(r)
    } catch (error) {
      console.error(
        'OPERATOR DASHBOARD LOAD ERROR:',
        error
      )

      setFeedbackMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to load operator dashboard data.',
      })
    }
  }, [])

  // ------------------------------------------------------------
  // Load data whenever the authenticated operator's assigned mandi changes.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!assignedCentreId) {
      setCentre(null)
      setBookings([])
      setQueue([])
      setRecords([])
      setFeedbackMessage({
        type: 'error',
        text: 'No procurement centre is assigned to this operator account.',
      })
      return
    }

    const activeCentreId = assignedCentreId

    console.log(
      'OPERATOR ASSIGNED CENTRE ID:',
      activeCentreId
    )

    loadData(activeCentreId)

    const unsubscribe = api.subscribe(() => {
      console.log(
        'OPERATOR REALTIME REFRESH FOR ASSIGNED CENTRE:',
        activeCentreId
      )

      loadData(activeCentreId)
    })

    return () => {
      unsubscribe()
    }
  }, [assignedCentreId, loadData])

  // ------------------------------------------------------------
  // Call next farmer in queue
  // ------------------------------------------------------------
  const handleCallNext = async () => {
    if (!assignedCentreId) {
      setFeedbackMessage({
        type: 'error',
        text: 'No procurement centre is assigned to this operator account.',
      })
      return
    }

    setIsCallingNext(true)
    setFeedbackMessage(null)

    try {
      const res = await api.callNextInQueue(assignedCentreId)

      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: res.message,
        })

        await loadData(assignedCentreId)
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.message,
        })
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

  // ------------------------------------------------------------
  // Gate QR / Manual scan check-in
  // ------------------------------------------------------------
  const handleGateScan = async (tokenOrBooking: string) => {
    setFeedbackMessage(null)

    try {
      const details = await api.getGateVerificationDetails(
        tokenOrBooking,
        assignedCentreId
      )

      if (!details) {
        setFeedbackMessage({
          type: 'error',
          text: 'Invalid or expired token / booking number.',
        })
        return
      }

      setGateIdentityChecked(false)
      setGateVehicleChecked(false)
      setGateVerification(details)
    } catch (error) {
      console.error('Gate verification lookup error:', error)

      setFeedbackMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to load farmer verification details.',
      })
    }
  }

  const handleConfirmGateAdmission = async () => {
    if (!gateVerification || isGateAdmitting) return

    setIsGateAdmitting(true)
    setFeedbackMessage(null)

    try {
      const query =
        gateVerification.booking.tokenNumber ||
        gateVerification.booking.bookingNumber

      const res = await api.checkInAtGate(query)

      if (!res.success) {
        setFeedbackMessage({
          type: 'error',
          text: res.message,
        })
        return
      }

      setGateVerification(null)
      setGateIdentityChecked(false)
      setGateVehicleChecked(false)

      setFeedbackMessage({
        type: 'success',
        text: res.message,
      })

      await loadData(assignedCentreId)
    } catch (error) {
      console.error('Gate admission error:', error)

      setFeedbackMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to admit farmer at the gate.',
      })
    } finally {
      setIsGateAdmitting(false)
    }
  }

  // ------------------------------------------------------------
  // Quality Control inspection
  // ------------------------------------------------------------
  const handleOpenQC = async (entry: QueueEntry) => {
    setFeedbackMessage(null)

    try {
      const [existing, commodities] = await Promise.all([
        api.getQCInspection(entry.id),
        api.getCommodities(),
      ])

      if (existing) {
        const mapped: QCResult = {
          sampleId: existing.sampleId,
          sampleWeightKg: existing.sampleWeightKg,
          moisture: existing.moisture,
          foreignMatter: existing.foreignMatter,
          damagedGrains: existing.damagedGrains,
          otherImpurities: existing.otherImpurities,
          totalImpurities: existing.totalImpurities,
          grade: existing.grade,
          result: existing.result,
          remarks: existing.remarks,
          inspectedAt: existing.inspectedAt,
        }
        setQcResults((current) => ({ ...current, [entry.id]: mapped }))
      }

      const booking = bookings.find((item) => item.id === entry.bookingId)
      const commodity = commodities.find((item) => item.id === booking?.commodityId)
      setQcCommodityMaxMoisture(
        commodity?.maxMoisturePercentage ?? undefined
      )
      setSelectedQueueForQC(entry)
    } catch (error) {
      console.error('Failed to open QC inspection:', error)
      setFeedbackMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load QC inspection details.',
      })
    }
  }

  const handleQCSubmit = async (data: Omit<QCResult, 'inspectedAt'>) => {
    if (!selectedQueueForQC) return

    const queueEntry = selectedQueueForQC
    const inspectedAt = new Date().toISOString()

    try {
      const saved = await api.saveQCInspection({
        queueEntryId: queueEntry.id,
        operatorId: user?.id || '',
        sampleId: data.sampleId,
        sampleWeightKg: data.sampleWeightKg,
        moisture: data.moisture,
        foreignMatter: data.foreignMatter,
        damagedGrains: data.damagedGrains,
        otherImpurities: data.otherImpurities,
        totalImpurities: data.totalImpurities,
        grade: data.grade,
        result: data.result,
        remarks: data.remarks,
      })

      const mapped: QCResult = {
        ...data,
        inspectedAt: saved.inspectedAt || inspectedAt,
      }

      setQcResults((current) => ({ ...current, [queueEntry.id]: mapped }))

      if (data.result === 'failed') {
        setSelectedQueueForQC(null)
        setFeedbackMessage({
          type: 'error',
          text: `QC failed for ${queueEntry.tokenNumber}. The inspection is saved and the token remains in QC for re-test or rejection.`,
        })
        return
      }

      // Only a successfully saved QC inspection can move the token to weighbridge.
      await api.updateQueueStage(queueEntry.id, 'weighbridge')
      setSelectedQueueForQC(null)
      setFeedbackMessage({
        type: 'success',
        text: data.result === 'passed_with_remarks'
          ? `QC completed for ${queueEntry.tokenNumber}. Inspection saved; passed with remarks and sent to weighbridge.`
          : `QC passed for ${queueEntry.tokenNumber}. Inspection saved and sent to weighbridge.`,
      })
      await loadData(assignedCentreId)
    } catch (error) {
      console.error('Failed to save/advance QC:', error)
      setFeedbackMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'QC inspection could not be completed.',
      })
    }
  }

  // ------------------------------------------------------------
  // Update queue stage
  // ------------------------------------------------------------
  const handleUpdateStage = async (
    queueId: string,
    stage: QueueStage
  ) => {
    try {
      setFeedbackMessage(null)
      setQueueActionToast(null)

      await api.updateQueueStage(queueId, stage)

      setFeedbackMessage({
        type: 'success',
        text: `Queue status updated to ${stage.replaceAll('_', ' ')}.`,
      })

      await loadData(assignedCentreId)
    } catch (error) {
      console.error('Failed to update queue stage:', error)

      const errorText =
        error instanceof Error
          ? error.message
          : 'Failed to update queue stage.'

      // Keep FIFO guidance local to the queue card that triggered it.
      if (errorText.toLowerCase().includes('fifo queue rule')) {
        const tokenMatch = errorText.match(
          /Token\s+([A-Z0-9-]+)\s+must be completed or marked No Show before Token\s+([A-Z0-9-]+)\s+can proceed/i
        )

        const earlierToken = tokenMatch?.[1] || 'the earlier token'

        setQueueActionToast({
          queueId,
          text: `Please process ${earlierToken} first. This farmer is ahead in the queue.`,
        })

        window.setTimeout(() => {
          setQueueActionToast((current) =>
            current?.queueId === queueId ? null : current
          )
        }, 5000)

        return
      }

      // Other errors can still use the normal dashboard feedback banner.
      setFeedbackMessage({
        type: 'error',
        text: errorText,
      })
    }
  }

  // ------------------------------------------------------------
  // Open weighbridge modal
  // ------------------------------------------------------------
  const handleOpenWeighment = async (bookingId: string) => {
    setFeedbackMessage(null)

    let booking = bookings.find(
      (b) => b.id === bookingId
    )

    if (!booking) {
      try {
        booking = await api.getBookingById(bookingId)
      } catch (error) {
        console.error(
          'Failed to load booking for weighment:',
          error
        )
      }
    }

    if (!booking) {
      setFeedbackMessage({
        type: 'error',
        text:
          'Booking details could not be loaded. Please refresh the operator console.',
      })
      return
    }

    setSelectedBookingForWeighment(booking)
  }

  // ------------------------------------------------------------
  // Submit weighment & procurement settlement
  // ------------------------------------------------------------
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
        text:
          'Procurement recorded successfully! Slip issued and payment initiated.',
      })

      setSelectedBookingForWeighment(null)

      await loadData(assignedCentreId)
    } catch (error) {
      console.error(
        'Failed to record procurement:',
        error
      )

      setFeedbackMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to record procurement.',
      })
    } finally {
      setIsWeighing(false)
    }
  }

  // ------------------------------------------------------------
  // Complete unloading & settle booking
  // ------------------------------------------------------------
  const handleCompleteUnloading = async (
    bookingId: string
  ) => {
    setFeedbackMessage(null)

    try {
      await api.completeUnloading(bookingId)

      setFeedbackMessage({
        type: 'success',
        text:
          'Unloading completed successfully. Booking settled and receipt issued.',
      })

      await loadData(assignedCentreId)
    } catch (error) {
      console.error(
        'Failed to complete unloading:',
        error
      )

      setFeedbackMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to complete unloading.',
      })
    }
  }

  // ------------------------------------------------------------
  // ACCEPT BOOKING
  // Pending -> Confirmed -> Token + QR -> Queue
  // ------------------------------------------------------------
  const handleAcceptBooking = async (
    bookingId: string
  ) => {
    setFeedbackMessage(null)
    setProcessingBookingId(bookingId)

    try {
      const acceptedBooking =
        await api.acceptBooking(bookingId)

      setFeedbackMessage({
        type: 'success',
        text:
          `Booking ${acceptedBooking.bookingNumber} accepted. ` +
          `Token ${acceptedBooking.tokenNumber || 'generated'} is now active.`,
      })

      await loadData(assignedCentreId)
    } catch (error) {
      console.error(
        'Failed to accept booking:',
        error
      )

      setFeedbackMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to accept booking request.',
      })
    } finally {
      setProcessingBookingId(null)
    }
  }

  // ------------------------------------------------------------
  // REJECT BOOKING
  // ------------------------------------------------------------
  const handleRejectBooking = async (
    bookingId: string
  ) => {
    setFeedbackMessage(null)
    setProcessingBookingId(bookingId)

    try {
      await api.rejectBooking(bookingId)

      setFeedbackMessage({
        type: 'success',
        text:
          'Booking request rejected successfully.',
      })

      await loadData(assignedCentreId)
    } catch (error) {
      console.error(
        'Failed to reject booking:',
        error
      )

      setFeedbackMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to reject booking request.',
      })
    } finally {
      setProcessingBookingId(null)
    }
  }

  // ------------------------------------------------------------
  // Filtered queue entries
  // ------------------------------------------------------------
  const filteredQueue = queue.filter((q) => {
    if (stageFilter === 'all') return true

    if (stageFilter === 'active') {
      return (
        q.currentStage !== 'settled' &&
        q.currentStage !== 'no_show'
      )
    }

    return q.currentStage === stageFilter
  })

  // ------------------------------------------------------------
  // Dynamic metrics
  // ------------------------------------------------------------
  const totalBookingsToday = bookings.length

  const activeWaiting = queue.filter(
    (q) => q.currentStage === 'waiting'
  ).length

  const insideYard = queue.filter(
    (q) =>
      q.currentStage === 'gate_passed' ||
      q.currentStage === 'called_to_gate' ||
      q.currentStage === 'weighbridge'
  ).length

  const completedToday = records.length

  const pendingBookings = bookings.filter(
    (b) => b.status === 'pending'
  )

  // ------------------------------------------------------------
  // Visual FIFO queue order
  // ------------------------------------------------------------
  const orderedActiveQueue = [...queue]
    .filter(
      (q) =>
        q.currentStage !== 'settled' &&
        q.currentStage !== 'no_show'
    )
    .sort((a, b) => {
      // QueueEntry does not expose createdAt. FIFO tokens are sequential,
      // so use the numeric token order as the visual queue order.
      const aToken = Number.parseInt(
        String(a.tokenNumber).replace(/\D/g, ''),
        10
      )
      const bToken = Number.parseInt(
        String(b.tokenNumber).replace(/\D/g, ''),
        10
      )

      if (Number.isFinite(aToken) && Number.isFinite(bToken)) {
        return aToken - bToken
      }

      return String(a.tokenNumber).localeCompare(
        String(b.tokenNumber),
        undefined,
        { numeric: true }
      )
    })

  const activeQueuePosition = new Map(
    orderedActiveQueue.map((entry, index) => [
      entry.id,
      index + 1,
    ])
  )

  const currentServingEntry = orderedActiveQueue.find(
    (entry) =>
      entry.currentStage === 'called_to_gate' ||
      entry.currentStage === 'gate_passed' ||
      entry.currentStage === 'quality_check' ||
      entry.currentStage === 'weighbridge' ||
      entry.currentStage === 'unloading'
  )

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-20">

      {/* Mandi Centre Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-bold mb-1">
            <Building2 className="w-4 h-4" />

            <span>
              OPERATOR CONSOLE • CODE:{' '}
              {centre?.code || 'RJ-KOTA-01'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white">
            {centre?.name ||
              'Mandi Procurement Centre'}
          </h1>

          <p className="text-xs text-slate-400 mt-0.5">
            Operator Incharge:{' '}
            {user?.fullName ||
              'Rajesh Kumar Sharma'}{' '}
            • Yard Gate 1 & Weighbridge 2
          </p>
        </div>

        {/* Primary Call Next Action */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            variant="warning"
            isLoading={isCallingNext}
            onClick={handleCallNext}
            leftIcon={
              <Volume2 className="w-5 h-5 animate-pulse" />
            }
            className="w-full md:w-auto font-black shadow-lg hover:shadow-amber-500/20 text-slate-950 bg-amber-400 hover:bg-amber-300"
          >
            Call Next Farmer to Gate
          </Button>
        </div>
      </div>

      {/* Assigned Mandi - read only */}
      <Card className="p-4 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Assigned Mandi Procurement Centre
            </span>
            <h2 className="text-sm font-black text-slate-900 mt-1">
              {centre?.name || 'Loading assigned mandi...'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {centre
                ? `${centre.code} • ${centre.district}, ${centre.state}`
                : 'This operator can access only the procurement centre assigned by the administrator.'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Building2 className="w-4 h-4" />
            Administrator Assigned
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-3">
          Queue, bookings, KPIs and gate operations below show live Supabase data only for this operator's assigned mandi.
        </p>
      </Card>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">

        <Card className="p-4 border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Today's Scheduled
          </span>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-slate-900">
              {totalBookingsToday}
            </span>

            <span className="text-xs text-slate-500">
              Bookings
            </span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Waiting Outside Gate
          </span>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-amber-600">
              {activeWaiting}
            </span>

            <span className="text-xs text-amber-700 font-medium">
              In Queue
            </span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Inside Yard / Active
          </span>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-blue-600">
              {insideYard}
            </span>

            <span className="text-xs text-blue-700 font-medium">
              At Bays
            </span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Settled / Dispatched
          </span>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black font-mono text-emerald-700">
              {completedToday}
            </span>

            <span className="text-xs text-emerald-700 font-medium">
              Slips Issued
            </span>
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

            <span>
              {feedbackMessage.text}
            </span>
          </div>

          <button
            onClick={() =>
              setFeedbackMessage(null)
            }
            className="text-xs font-bold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =======================================================
          PENDING BOOKING REQUESTS
          ======================================================= */}
      <div className="space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Booking Requests
            </h3>

            <p className="text-xs text-slate-500">
              Review farmer requests before activating a token
              and queue entry.
            </p>
          </div>

          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            {pendingBookings.length} Pending
          </span>
        </div>

        <div className="space-y-3">

          {pendingBookings.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No pending booking requests for this mandi.
            </div>
          ) : (
            pendingBookings.map((booking) => {
              const isProcessing =
                processingBookingId === booking.id

              return (
                <Card
                  key={booking.id}
                  className="p-4 border-amber-200 bg-amber-50/30"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {booking.farmerName}
                        </h4>

                        <span className="text-xs font-mono font-bold text-slate-500">
                          {booking.bookingNumber}
                        </span>

                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-800">
                          PENDING
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-1 mt-2 text-xs text-slate-600">

                        <span>
                          <strong>Commodity:</strong>{' '}
                          {booking.commodityName}
                        </span>

                        <span>
                          <strong>Vehicles:</strong>{' '}
                          {booking.numberOfVehicles}
                        </span>

                        <span>
                          <strong>Vehicle:</strong>{' '}
                          {booking.vehicleNumber}
                        </span>

                        <span>
                          <strong>Slot:</strong>{' '}
                          {booking.slotDate} •{' '}
                          {booking.slotTimeStart}–
                          {booking.slotTimeEnd}
                        </span>

                      </div>
                    </div>

                    {/* ACCEPT / REJECT */}
                    <div className="flex items-center gap-2 shrink-0">

                      <Button
                        size="sm"
                        variant="success"
                        isLoading={isProcessing}
                        disabled={
                          processingBookingId !== null
                        }
                        onClick={() =>
                          handleAcceptBooking(
                            booking.id
                          )
                        }
                        leftIcon={
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        }
                        className="font-bold"
                      >
                        Accept
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          processingBookingId !== null
                        }
                        onClick={() =>
                          handleRejectBooking(
                            booking.id
                          )
                        }
                        className="font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Reject
                      </Button>

                    </div>

                  </div>
                </Card>
              )
            })
          )}

        </div>
      </div>

      {/* =======================================================
          GATE VERIFICATION & SCANNER
          ======================================================= */}
      <GateScanner
        onScanSuccess={handleGateScan}
      />

      {/* =======================================================
          LIVE QUEUE OPERATIONS BOARD
          ======================================================= */}
      <div className="space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Real-Time Mandi Queue & Yard Board
            </h3>

            <p className="text-xs text-slate-500">
              Live order of arrivals, inspection, and
              weighbridge bays
            </p>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">

            <Filter className="w-4 h-4 text-slate-400 shrink-0" />

            {[
              {
                id: 'all',
                label: 'All',
              },
              {
                id: 'active',
                label: 'Active Queue',
              },
              {
                id: 'waiting',
                label: 'Waiting',
              },
              {
                id: 'called_to_gate',
                label: 'Called',
              },
              {
                id: 'gate_passed',
                label: 'In Yard',
              },
              {
                id: 'settled',
                label: 'Completed',
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setStageFilter(tab.id)
                }
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

        {/* Queue Cards */}
        <div className="space-y-3">

          {filteredQueue.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No queue entries found for this stage
              filter.
            </div>
          ) : (
            filteredQueue.map((entry) => {
              // Prefer the farmer name stored on the booking. This prevents
              // the generic "Farmer" fallback in a queue entry from hiding
              // the actual registered farmer name.
              const bookingForEntry = bookings.find(
                (booking) => booking.id === entry.bookingId
              )

              const displayFarmerName =
                bookingForEntry?.farmerName?.trim() ||
                entry.farmerName?.trim() ||
                'Farmer'

              const displayFarmerPhone =
                bookingForEntry?.farmerPhone ||
                entry.farmerPhone ||
                ''

              return (
                <Card
                  key={entry.id}
                  className={`p-4 border transition-all ${
                    activeQueuePosition.get(entry.id) === 1 &&
                    entry.currentStage === 'waiting'
                      ? 'border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-500/10'
                      : currentServingEntry?.id === entry.id
                        ? 'border-blue-300 bg-blue-50/30 ring-2 ring-blue-500/10'
                        : entry.currentStage === 'called_to_gate'
                          ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-500/10'
                          : 'border-slate-200'
                  }`}
                >

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    {/* Token + Farmer */}
                    <div className="flex items-start gap-3.5">

                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center font-mono font-black shrink-0 shadow-sm">

                        <span className="text-xs text-slate-400 font-sans">
                          TOKEN
                        </span>

                        <span className="text-base text-amber-400 leading-none mt-0.5">
                          {entry.tokenNumber}
                        </span>

                      </div>

                      <div>

                        {(() => {
                          const position = activeQueuePosition.get(entry.id)
                          const isCurrentServing =
                            currentServingEntry?.id === entry.id
                          const isNextToBeCalled =
                            position === 1 &&
                            entry.currentStage === 'waiting'

                          return (
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              {position && (
                                <span
                                  className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                                    isNextToBeCalled
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isCurrentServing
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  #{position}
                                </span>
                              )}

                              {isNextToBeCalled && (
                                <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                                  🟢 Next to be called
                                </span>
                              )}

                              {isCurrentServing && (
                                <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                                  🔵 Currently serving
                                </span>
                              )}

                              {position &&
                                entry.currentStage === 'waiting' &&
                                position > 1 && (
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    ⏳ {position - 1} farmer
                                    {position - 1 === 1 ? '' : 's'} ahead
                                  </span>
                                )}
                            </div>
                          )
                        })()}

                        <div className="flex items-center gap-2">

                          <h4 className="text-sm font-black text-slate-900">
                            {displayFarmerName}
                          </h4>

                          <StatusPill
                            stage={
                              entry.currentStage
                            }
                          />

                        </div>

                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {entry.bookingNumber}
                          {displayFarmerPhone
                            ? ` • ${displayFarmerPhone}`
                            : ''}
                        </p>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 font-medium">

                          <span className="text-emerald-800 font-bold">
                            {entry.commodityName}
                          </span>

                          <span>•</span>

                          <span>
                            ~{entry.numberOfVehicles}{' '}
                            Vehicle(s)
                          </span>

                          <span>•</span>

                          <span className="flex items-center gap-1 font-mono">

                            <Truck className="w-3.5 h-3.5 text-slate-400" />

                            {entry.vehicleNumber}

                          </span>

                        </div>

                      </div>

                    </div>

                    {/* Operational Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">

                      {/* Inline queue-order feedback */}
                      {queueActionToast?.queueId === entry.id && (
                        <div className="basis-full flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />

                          <div className="min-w-0">
                            <p className="font-black">
                              Please process the earlier token first
                            </p>
                            <p className="mt-0.5 text-amber-800">
                              {queueActionToast.text}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setQueueActionToast(null)}
                            className="ml-auto font-bold text-amber-700 hover:text-amber-900"
                            aria-label="Dismiss"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Waiting -> Called */}
                      {entry.currentStage ===
                        'waiting' && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() =>
                            handleUpdateStage(
                              entry.id,
                              'called_to_gate'
                            )
                          }
                          leftIcon={
                            <Volume2 className="w-3.5 h-3.5" />
                          }
                        >
                          Call to Gate
                        </Button>
                      )}

                      {/* QR verification is the only way to admit a called token. */}
                      {entry.currentStage ===
                        'called_to_gate' && (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Awaiting QR Gate Verification
                        </span>
                      )}

                      {/* Gate -> QC */}
                      {entry.currentStage ===
                        'gate_passed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUpdateStage(
                              entry.id,
                              'quality_check'
                            )
                          }
                        >
                          Send to QC Lab
                        </Button>
                      )}

                      {/* QC inspection */}
                      {entry.currentStage === 'quality_check' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenQC(entry)}
                            className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          >
                            Open QC Inspection
                          </Button>
                          {qcResults[entry.id] && (
                            <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${qcResults[entry.id].result === 'failed' ? 'border-rose-200 bg-rose-50 text-rose-700' : qcResults[entry.id].result === 'passed_with_remarks' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                              {qcResults[entry.id].result === 'failed' ? 'QC Failed' : qcResults[entry.id].result === 'passed_with_remarks' ? 'QC Passed • Remarks' : 'QC Passed'}
                            </span>
                          )}
                        </>
                      )}

                      {/* Weighbridge -> Record Weighment */}
                      {entry.currentStage ===
                        'weighbridge' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() =>
                            handleOpenWeighment(
                              entry.bookingId
                            )
                          }
                          leftIcon={
                            <Scale className="w-3.5 h-3.5" />
                          }
                          className="font-bold"
                        >
                          Record Weighment
                        </Button>
                      )}

                      {/* Unloading -> Settlement */}
                      {entry.currentStage ===
                        'unloading' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() =>
                            handleCompleteUnloading(
                              entry.bookingId
                            )
                          }
                          leftIcon={
                            <Truck className="w-3.5 h-3.5" />
                          }
                          className="font-bold"
                        >
                          Complete Unloading & Settle
                        </Button>
                      )}

                      {/* No Show */}
                      {entry.currentStage !==
                        'settled' &&
                        entry.currentStage !==
                          'no_show' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleUpdateStage(
                                entry.id,
                                'no_show'
                              )
                            }
                            className="text-slate-400 hover:text-rose-600 text-xs"
                          >
                            No Show
                          </Button>
                        )}

                      {/* Settled */}
                      {entry.currentStage ===
                        'settled' && (
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

      {/* =======================================================
          QUALITY CONTROL INSPECTION MODAL
          ======================================================= */}
      {selectedQueueForQC && (
        <QCInspectionModal
          isOpen={!!selectedQueueForQC}
          entry={selectedQueueForQC}
          existingResult={qcResults[selectedQueueForQC.id]}
          commodityMaxMoisture={qcCommodityMaxMoisture}
          onClose={() => setSelectedQueueForQC(null)}
          onSubmit={handleQCSubmit}
        />
      )}

      {/* =======================================================
          WEIGHMENT ENTRY MODAL
          ======================================================= */}
      {selectedBookingForWeighment && (
        <ProcurementEntryModal
          isOpen={
            !!selectedBookingForWeighment
          }
          onClose={() =>
            setSelectedBookingForWeighment(null)
          }
          booking={
            selectedBookingForWeighment
          }
          onSubmit={
            handleProcurementSubmit
          }
          isLoading={isWeighing}
        />
      )}


      <GateVerificationModal
        details={gateVerification}
        isLoading={isGateAdmitting}
        identityChecked={gateIdentityChecked}
        vehicleChecked={gateVehicleChecked}
        onIdentityCheckedChange={setGateIdentityChecked}
        onVehicleCheckedChange={setGateVehicleChecked}
        onConfirm={handleConfirmGateAdmission}
        onClose={() => {
          if (isGateAdmitting) return
          setGateVerification(null)
          setGateIdentityChecked(false)
          setGateVehicleChecked(false)
        }}
      />

    </div>
  )
}
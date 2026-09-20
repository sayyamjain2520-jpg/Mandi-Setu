import React, { useEffect, useState } from 'react'
import type {
  Booking,
  QueueEntry,
  ProcurementRecord,
} from '@/types/procurement.types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Scale, CheckCircle2 } from 'lucide-react'
import { api } from '@/services/api'

interface ProcurementEntryModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
  queueEntry?: QueueEntry
  onSubmit: (data: {
    bookingId: string
    grossWeightKg: number
    tareWeightKg: number
    moisturePercentage: number
    qualityGrade: ProcurementRecord['qualityGrade']
  }) => Promise<void>
  isLoading?: boolean
}

export const ProcurementEntryModal: React.FC<
  ProcurementEntryModalProps
> = ({
  isOpen,
  onClose,
  booking,
  onSubmit,
  isLoading = false,
}) => {
  const [grossWeight, setGrossWeight] = useState<number | ''>('')
  const [tareWeight, setTareWeight] = useState<number | ''>('')
  const [moisture, setMoisture] = useState<number | ''>('')
  const [grade, setGrade] =
    useState<ProcurementRecord['qualityGrade']>('Grade A')

  const [ratePerQuintal, setRatePerQuintal] = useState<number | null>(null)
  const [maxMoisture, setMaxMoisture] = useState<number | null>(null)

  const [isLoadingCommodity, setIsLoadingCommodity] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset physical readings whenever a new booking is opened.
  // Never carry demo/previous scale values into another farmer's settlement.
  useEffect(() => {
    if (!isOpen) return

    setGrossWeight('')
    setTareWeight('')
    setMoisture('')
    setError(null)
  }, [isOpen, booking.id])

  // Load actual commodity pricing/rules from Supabase
  useEffect(() => {
    if (!isOpen || !booking.commodityId) return

    let cancelled = false

    const loadCommodity = async () => {
      setIsLoadingCommodity(true)
      setError(null)

      try {
        const commodities = await api.getCommodities()

        const commodity = commodities.find(
          (item) => item.id === booking.commodityId
        )

        if (!commodity) {
          throw new Error(
            `Commodity details not found for ${booking.commodityName}.`
          )
        }

        if (cancelled) return

        setRatePerQuintal(Number(commodity.mspPricePerQuintal))
        setMaxMoisture(Number(commodity.maxMoisturePercentage))
      } catch (err: unknown) {
        if (cancelled) return

        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load commodity pricing details.'

        setRatePerQuintal(null)
        setMaxMoisture(null)
        setError(message)
      } finally {
        if (!cancelled) {
          setIsLoadingCommodity(false)
        }
      }
    }

    void loadCommodity()

    return () => {
      cancelled = true
    }
  }, [isOpen, booking.commodityId, booking.commodityName])

  // Dynamic calculations
  const grossWeightKgValue = Number(grossWeight || 0)
  const tareWeightKgValue = Number(tareWeight || 0)
  const moistureValue = Number(moisture || 0)

  const netWeightKg = Math.max(
    0,
    grossWeightKgValue - tareWeightKgValue
  )

  const moistureDeductionKg =
    maxMoisture !== null && moistureValue > maxMoisture
      ? Math.round(
          (netWeightKg * (moistureValue - maxMoisture)) / 100
        )
      : 0

  const finalNetKg = Math.max(
    0,
    netWeightKg - moistureDeductionKg
  )

  const finalQuintals = Number(
    (finalNetKg / 100).toFixed(2)
  )

  const estimatedBookingQuintals = Number(
    booking.estimatedQuantityQuintals || 0
  )

  const quantityVarianceRatio =
    estimatedBookingQuintals > 0
      ? Math.abs(finalQuintals - estimatedBookingQuintals) /
        estimatedBookingQuintals
      : 0

  const hasLargeQuantityVariance =
    estimatedBookingQuintals > 0 &&
    finalQuintals > 0 &&
    quantityVarianceRatio >= 0.25

  const estimatedPayable =
    ratePerQuintal !== null
      ? Math.round(finalQuintals * ratePerQuintal)
      : 0

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()
    setError(null)

    if (isLoadingCommodity) {
      setError(
        'Please wait while commodity pricing details are loading.'
      )
      return
    }

    if (
      ratePerQuintal === null ||
      maxMoisture === null
    ) {
      setError(
        'Commodity pricing details could not be loaded. Please close and reopen the weighment form.'
      )
      return
    }

    if (grossWeight === '' || grossWeight <= 0) {
      setError(
        'Please enter the actual gross weight measured on the weighbridge.'
      )
      return
    }

    if (tareWeight === '' || tareWeight <= 0) {
      setError(
        'Please enter the actual tare weight measured for the empty vehicle.'
      )
      return
    }

    if (grossWeight <= tareWeight) {
      setError(
        'Gross weight must be greater than tare weight (empty vehicle).'
      )
      return
    }

    if (moisture === '' || moisture < 0) {
      setError(
        'Please enter the actual moisture percentage.'
      )
      return
    }

    if (hasLargeQuantityVariance) {
      setError(
        `WEIGHMENT BLOCKED: booking estimate ${estimatedBookingQuintals.toFixed(
          2
        )} Qtl vs actual accepted ${finalQuintals.toFixed(
          2
        )} Qtl. The difference is too high. Re-check Gross Weight and Tare Weight before issuing the receipt.`
      )
      return
    }

    try {
      await onSubmit({
        bookingId: booking.id,
        grossWeightKg: Number(grossWeight),
        tareWeightKg: Number(tareWeight),
        moisturePercentage: Number(moisture),
        qualityGrade: grade,
      })

      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error recording weighment'

      setError(msg)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Weighment & Quality Certification — ${booking.tokenNumber}`}
      subtitle={`Farmer: ${booking.farmerName} • Vehicle: ${booking.vehicleNumber}`}
      maxWidth="lg"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Commodity reference */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-emerald-950">
              {booking.commodityName}
            </span>

            <p className="text-emerald-700">
              Vehicles in booking:{' '}
              {booking.numberOfVehicles}
            </p>

            {maxMoisture !== null && (
              <p className="text-emerald-700 mt-0.5">
                Max moisture:{' '}
                {maxMoisture.toFixed(1)}%
              </p>
            )}
          </div>

          <span className="font-mono font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
            {ratePerQuintal !== null
              ? `₹${ratePerQuintal.toLocaleString(
                  'en-IN'
                )}/Qtl`
              : isLoadingCommodity
                ? 'Loading...'
                : 'Price unavailable'}
          </span>
        </div>

        {/* Weighbridge Entry */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Gross Weight (Loaded kg)"
            type="number"
            value={grossWeight}
            onChange={(e) =>
              setGrossWeight(
                Number(e.target.value)
              )
            }
            leftIcon={
              <Scale className="w-4 h-4" />
            }
          />

          <Input
            label="Tare Weight (Empty Vehicle kg)"
            type="number"
            value={tareWeight}
            onChange={(e) =>
              setTareWeight(
                Number(e.target.value)
              )
            }
            leftIcon={
              <Scale className="w-4 h-4" />
            }
          />
        </div>

        {/* Quality and Moisture */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Moisture Content (%)"
            type="number"
            step="0.1"
            value={moisture}
            onChange={(e) =>
              setMoisture(
                Number(e.target.value)
              )
            }
            helperText={
              maxMoisture !== null
                ? `Max ${maxMoisture.toFixed(
                    1
                  )}% without deduction`
                : 'Loading moisture limit...'
            }
          />

          <Select
            label="Quality Grade"
            value={grade}
            onChange={(e) =>
              setGrade(
                e.target.value as ProcurementRecord['qualityGrade']
              )
            }
            options={[
              {
                label:
                  'Grade A (FAQ Premium)',
                value: 'Grade A',
              },
              {
                label:
                  'Grade B (Standard)',
                value: 'Grade B',
              },
              {
                label:
                  'Fair Average Quality (FAQ)',
                value:
                  'Fair Average Quality (FAQ)',
              },
            ]}
          />
        </div>

        {/* Booking estimate vs actual weighment */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Booking estimate
              </p>
              <p className="mt-1 font-mono text-base font-black text-slate-900">
                {estimatedBookingQuintals.toFixed(2)} Qtl
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Actual accepted
              </p>
              <p className="mt-1 font-mono text-base font-black text-emerald-700">
                {Number(
                  ((netWeightKg - moistureDeductionKg) / 100).toFixed(2)
                ).toFixed(2)}{' '}
                Qtl
              </p>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Final payment is calculated from the actual weighbridge reading
            and applicable moisture deduction, not from the booking estimate.
            Net accepted weight: {Math.max(
              0,
              netWeightKg - moistureDeductionKg
            ).toLocaleString()} kg.
          </p>
        </div>

        {hasLargeQuantityVariance && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-rose-100 px-2 py-1 text-rose-700">
                🚫
              </div>

              <div className="flex-1">
                <p className="text-xs font-black text-rose-900">
                  Weighment blocked
                </p>

                <p className="mt-1 text-[11px] leading-5 text-rose-800">
                  Booking estimate: <b>{estimatedBookingQuintals.toFixed(2)} Qtl</b>
                  {' '}• Actual accepted: <b>{finalQuintals.toFixed(2)} Qtl</b>.
                </p>

                <p className="mt-2 text-[11px] leading-5 font-semibold text-rose-800">
                  The quantity difference is too high to issue a procurement receipt.
                  Re-check the gross and tare readings and enter the actual weighbridge values.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Calculation Summary Card */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">
              Net Weight (Gross - Tare):
            </span>

            <span className="font-mono font-bold">
              {netWeightKg.toLocaleString()} kg
            </span>
          </div>

          {moistureDeductionKg > 0 && (
            <div className="flex items-center justify-between text-amber-300 border-b border-slate-800 pb-2">
              <span>
                Moisture Excess Deduction (
                {moistureValue.toFixed(1)}% &gt;{' '}
                {maxMoisture?.toFixed(1)}%):
              </span>

              <span className="font-mono font-bold">
                -{moistureDeductionKg} kg
              </span>
            </div>
          )}

          {moistureDeductionKg === 0 &&
            maxMoisture !== null && (
              <div className="flex items-center justify-between text-emerald-300 border-b border-slate-800 pb-2">
                <span>
                  Moisture Deduction:
                </span>

                <span className="font-mono font-bold">
                  0 kg
                </span>
              </div>
            )}

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-emerald-400 font-bold">
              Final Accepted Quantity:
            </span>

            <span className="font-mono font-black text-emerald-400 text-sm">
              {Number(
                ((netWeightKg - moistureDeductionKg) / 100).toFixed(2)
              )}{' '}
              Quintals
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Total Payable (DBT Settlement):
            </span>

            <span className="font-mono font-black text-lg text-emerald-400">
              {ratePerQuintal !== null
                ? `₹${estimatedPayable.toLocaleString(
                    'en-IN'
                  )}`
                : '—'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={
              isLoading || isLoadingCommodity
            }
            disabled={
              isLoadingCommodity ||
              ratePerQuintal === null ||
              maxMoisture === null ||
              hasLargeQuantityVariance
            }
            leftIcon={
              <CheckCircle2 className="w-4 h-4" />
            }
            className="font-bold shadow-md"
          >
            Authorize & Issue Procurement Receipt
          </Button>
        </div>
      </form>
    </Modal>
  )
}
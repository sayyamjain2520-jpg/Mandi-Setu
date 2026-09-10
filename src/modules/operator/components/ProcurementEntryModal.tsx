import React, { useState } from 'react'
import type { Booking, QueueEntry, ProcurementRecord } from '@/types/procurement.types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Scale, CheckCircle2 } from 'lucide-react'

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

export const ProcurementEntryModal: React.FC<ProcurementEntryModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSubmit,
  isLoading = false,
}) => {
  const [grossWeight, setGrossWeight] = useState<number>(8500)
  const [tareWeight, setTareWeight] = useState<number>(3200)
  const [moisture, setMoisture] = useState<number>(11.2)
  const [grade, setGrade] = useState<ProcurementRecord['qualityGrade']>('Grade A')
  const [error, setError] = useState<string | null>(null)

  // Dynamic calculations
  const netWeightKg = Math.max(0, grossWeight - tareWeight)
  const maxMoisture = 12.0 // Standard FAQ benchmark
  const moistureDeductionKg = moisture > maxMoisture ? Math.round((netWeightKg * (moisture - maxMoisture)) / 100) : 0
  const finalNetKg = Math.max(0, netWeightKg - moistureDeductionKg)
  const finalQuintals = Number((finalNetKg / 100).toFixed(2))

  // Estimate price with default MSP
  const ratePerQuintal = 2275.0
  const estimatedPayable = Math.round(finalQuintals * ratePerQuintal)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (grossWeight <= tareWeight) {
      setError('Gross weight must be greater than tare weight (empty vehicle).')
      return
    }

    if (tareWeight <= 0) {
      setError('Please enter a valid tare weight.')
      return
    }

    try {
      await onSubmit({
        bookingId: booking.id,
        grossWeightKg: grossWeight,
        tareWeightKg: tareWeight,
        moisturePercentage: moisture,
        qualityGrade: grade,
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error recording weighment'
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Commodity reference */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-emerald-950">{booking.commodityName}</span>
            <p className="text-emerald-700">Estimated booking: {booking.estimatedQuantityQuintals} Qtl</p>
          </div>
          <span className="font-mono font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
            ₹{ratePerQuintal}/Qtl
          </span>
        </div>

        {/* Weighbridge Entry */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Gross Weight (Loaded kg)"
            type="number"
            value={grossWeight}
            onChange={(e) => setGrossWeight(Number(e.target.value))}
            leftIcon={<Scale className="w-4 h-4" />}
          />

          <Input
            label="Tare Weight (Empty Vehicle kg)"
            type="number"
            value={tareWeight}
            onChange={(e) => setTareWeight(Number(e.target.value))}
            leftIcon={<Scale className="w-4 h-4" />}
          />
        </div>

        {/* Quality and Moisture */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Moisture Content (%)"
            type="number"
            step="0.1"
            value={moisture}
            onChange={(e) => setMoisture(Number(e.target.value))}
            helperText="Max 12.0% without deduction"
          />

          <Select
            label="Quality Grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value as ProcurementRecord['qualityGrade'])}
            options={[
              { label: 'Grade A (FAQ Premium)', value: 'Grade A' },
              { label: 'Grade B (Standard)', value: 'Grade B' },
              { label: 'Fair Average Quality (FAQ)', value: 'Fair Average Quality (FAQ)' },
            ]}
          />
        </div>

        {/* Dynamic Calculation Summary Card */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Net Weight (Gross - Tare):</span>
            <span className="font-mono font-bold">{netWeightKg.toLocaleString()} kg</span>
          </div>

          {moistureDeductionKg > 0 && (
            <div className="flex items-center justify-between text-amber-300 border-b border-slate-800 pb-2">
              <span>Moisture Excess Deduction ({moisture}% &gt; 12%):</span>
              <span className="font-mono font-bold">-{moistureDeductionKg} kg</span>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-emerald-400 font-bold">Final Accepted Quantity:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">{finalQuintals} Quintals</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Total Payable (DBT Settlement):
            </span>
            <span className="font-mono font-black text-lg text-emerald-400">
              ₹{estimatedPayable.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="font-bold shadow-md"
          >
            Authorize & Issue Procurement Receipt
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { ProcurementCentre } from '@/types/mandi.types'
import type { Commodity, TimeSlot, Booking } from '@/types/procurement.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Truck, CheckCircle2, Clock } from 'lucide-react'

interface SlotBookingWizardProps {
  centres: ProcurementCentre[]
  commodities: Commodity[]
  slots: TimeSlot[]
  preselectedCentreId?: string
  onBookingSuccess: (booking: Booking) => void
  onCancel: () => void
}

export const SlotBookingWizard: React.FC<SlotBookingWizardProps> = ({
  centres,
  commodities,
  slots,
  preselectedCentreId,
  onBookingSuccess,
  onCancel,
}) => {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  const [centreId, setCentreId] = useState(preselectedCentreId || centres[0]?.id || '')
  const [commodityId, setCommodityId] = useState(commodities[0]?.id || '')
  const [slotDate] = useState(today)
  const [selectedSlotId, setSelectedSlotId] = useState<string>('')
  const [estimatedQuantity, setEstimatedQuantity] = useState<number>(50)
  const [vehicleType, setVehicleType] = useState<Booking['vehicleType']>('Tractor Trolley')
  const [vehicleNumber, setVehicleNumber] = useState('RJ-20-EA-4122')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (preselectedCentreId) {
      setCentreId(preselectedCentreId)
    } else if (!centreId && centres.length > 0) {
      setCentreId(centres[0].id)
    }
  }, [preselectedCentreId, centres, centreId])

  React.useEffect(() => {
    if (!commodityId && commodities.length > 0) {
      setCommodityId(commodities[0].id)
    }
  }, [commodities, commodityId])

  // Available slots for selected centre
  const availableSlots = slots.filter((s) => s.centreId === centreId && s.slotDate === slotDate)

  // Current selected commodity
  const selectedCommodity = commodities.find((c) => c.id === commodityId)
  const estimatedValueInr = selectedCommodity
    ? Math.round(estimatedQuantity * selectedCommodity.mspPricePerQuintal)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!centreId) {
      setError('Please select a Mandi Procurement Centre.')
      return
    }
    if (!commodityId) {
      setError('Please select a crop commodity.')
      return
    }
    if (!vehicleNumber.trim()) {
      setError('Please enter a vehicle registration number.')
      return
    }
    if (estimatedQuantity <= 0 || estimatedQuantity > 1000) {
      setError('Estimated quantity must be between 1 and 1000 quintals.')
      return
    }

    const chosenSlot = availableSlots.find((s) => s.id === selectedSlotId) || availableSlots[0]
    const startTime = chosenSlot?.startTime || '08:00'
    const endTime = chosenSlot?.endTime || '10:00'

    setIsSubmitting(true)
    try {
      const booking = await api.createBooking({
        farmerId: user?.id || 'usr-farmer-ramesh',
        farmerName: user?.fullName || 'Rameshwar Dayal Patel',
        farmerPhone: user?.phoneNumber || '+91 98260 12345',
        centreId,
        commodityId,
        slotDate,
        slotTimeStart: startTime,
        slotTimeEnd: endTime,
        estimatedQuantityQuintals: estimatedQuantity,
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        notes: notes.trim() || undefined,
      })

      onBookingSuccess(booking)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to book slot'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-24">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Procurement Slot Booking</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Select Mandi, crop variety, and vehicle to generate your confirmed gate token.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Mandi & Commodity */}
        <Card className="p-4 space-y-3.5 border-slate-200">
          <Select
            label="1. Select Mandi Procurement Centre"
            value={centreId}
            onChange={(e) => setCentreId(e.target.value)}
            options={centres.map((c) => ({
              label: `${c.name} (${c.district}, ${c.state})`,
              value: c.id,
            }))}
          />

          <Select
            label="2. Select Crop Commodity"
            value={commodityId}
            onChange={(e) => setCommodityId(e.target.value)}
            options={commodities.map((c) => ({
              label: `${c.name} — MSP ₹${c.mspPricePerQuintal}/Qtl`,
              value: c.id,
            }))}
          />

          {selectedCommodity && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span className="font-bold">{selectedCommodity.name}</span>
                <p className="text-[11px] text-emerald-700">
                  Variety: {selectedCommodity.variety} • Max Moisture: {selectedCommodity.maxMoisturePercentage}%
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black font-mono">
                  ₹{selectedCommodity.mspPricePerQuintal}
                </span>
                <span className="text-[10px] block text-emerald-600">per Quintal</span>
              </div>
            </div>
          )}
        </Card>

        {/* Step 2: Time Window */}
        <Card className="p-4 border-slate-200">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            3. Choose Time Window (Today: {slotDate})
          </label>

          <div className="grid grid-cols-2 gap-2">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlotId === slot.id || (!selectedSlotId && slot === availableSlots[0])
              const remaining = slot.maxCapacityFarmers - slot.bookedCount

              return (
                <button
                  type="button"
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-800 ring-2 ring-emerald-600/30'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] mt-1 block ${
                      isSelected ? 'text-emerald-200' : 'text-slate-500'
                    }`}
                  >
                    {remaining} gate slots open
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Step 3: Vehicle & Quantity */}
        <Card className="p-4 space-y-3.5 border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Vehicle Type"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as Booking['vehicleType'])}
              options={[
                { label: '🚜 Tractor Trolley', value: 'Tractor Trolley' },
                { label: '🛻 Mini Truck / Pickup', value: 'Mini Truck' },
                { label: '🚛 Heavy Truck', value: 'Truck' },
                { label: '🐂 Bullock Cart', value: 'Bullock Cart' },
                { label: '🚐 Pickup Van', value: 'Pickup Van' },
              ]}
            />

            <Input
              label="Vehicle Reg. Number"
              placeholder="e.g. RJ-20-EA-4122"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              leftIcon={<Truck className="w-4 h-4" />}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Estimated Quantity (Quintals)
              </label>
              <span className="font-mono font-bold text-sm text-emerald-800">
                {estimatedQuantity} Qtl (~{(estimatedQuantity * 100).toLocaleString('en-IN')} kg)
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="250"
              step="5"
              value={estimatedQuantity}
              onChange={(e) => setEstimatedQuantity(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5 Qtl</span>
              <span>100 Qtl</span>
              <span>250 Qtl</span>
            </div>
          </div>

          <Input
            label="Remarks / Notes (Optional)"
            placeholder="e.g. Driver contact, dry moisture grain"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Expected MSP Payout preview */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Estimated Govt MSP Value
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Direct to Bank A/C via PFMS/DBT
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-lg font-black text-emerald-400">
                ₹{estimatedValueInr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </Card>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} className="w-1/3">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="flex-1 text-sm font-bold shadow-md"
          >
            Confirm & Generate Token
          </Button>
        </div>
      </form>
    </div>
  )
}

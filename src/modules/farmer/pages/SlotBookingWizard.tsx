import React, { useEffect, useState } from 'react'
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

  const [centreId, setCentreId] = useState(
    preselectedCentreId || centres[0]?.id || ''
  )

  const [commodityId, setCommodityId] = useState(
    commodities[0]?.id || ''
  )

  const [slotDate, setSlotDate] = useState(today)
  const [selectedSlotId, setSelectedSlotId] = useState<string>('')
  const [liveSlots, setLiveSlots] = useState<TimeSlot[]>(slots)

  // Admin-controlled Mandi status.
  // The Farmer page may have an older `centres` prop if Admin changed the
  // Mandi after the Farmer page was already open. Keep a fresh local copy.
  const [liveCentre, setLiveCentre] = useState<ProcurementCentre | undefined>(
    () => centres.find((c) => c.id === centreId)
  )

  const selectedCentre = liveCentre ?? centres.find((c) => c.id === centreId)

  const centreOperationalStatus = String(
    (selectedCentre as ProcurementCentre & { operationalStatus?: string })?.operationalStatus ?? ''
  ).trim().toLowerCase()

  const isCentreActive = centreOperationalStatus === 'active'

  useEffect(() => {
    setLiveSlots(slots)
  }, [slots])

  useEffect(() => {
    let active = true

    const refreshCentreAndSlots = async () => {
      if (!centreId) {
        setLiveCentre(undefined)
        setLiveSlots([])
        setSelectedSlotId('')
        return
      }

      try {
        // Always fetch the selected Mandi again so Admin status changes are
        // reflected even when the Farmer page was opened earlier.
        const freshCentre = await api.getCentreById(centreId)

        if (!active) return

        setLiveCentre(freshCentre)

        const freshStatus = String(
          (freshCentre as ProcurementCentre & { operationalStatus?: string })?.operationalStatus ?? ''
        ).trim().toLowerCase()

        if (freshStatus !== 'active') {
          setLiveSlots([])
          setSelectedSlotId('')
          return
        }

        if (!slotDate) {
          setLiveSlots([])
          setSelectedSlotId('')
          return
        }

        const freshSlots = await api.getSlots(centreId, slotDate)

        if (active) {
          setLiveSlots(freshSlots)
        }
      } catch (error) {
        console.error('Failed to refresh Mandi status / time slots:', error)
      }
    }

    refreshCentreAndSlots()

    // Fallback live check: if Admin closes/opens a Mandi while this wizard
    // is already open, the Farmer UI updates automatically within 3 seconds.
    const intervalId = window.setInterval(refreshCentreAndSlots, 3000)

    const unsubscribe = api.subscribe(() => {
      refreshCentreAndSlots()
    })

    return () => {
      active = false
      window.clearInterval(intervalId)
      unsubscribe()
    }
  }, [centreId, slotDate])

  // Estimated quantity in quintals
  const [estimatedQuantity, setEstimatedQuantity] =
    useState<number>(50)

  const [numberOfVehicles, setNumberOfVehicles] = useState<number>(1)

  const [vehicleType, setVehicleType] =
    useState<Booking['vehicleType']>('Tractor Trolley')

  const [vehicleNumber, setVehicleNumber] =
    useState('RJ-20-EA-4122')

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

  const selectedCommodity = commodities.find(
    (c) => c.id === commodityId
  )

  // Available slots
  const availableSlots = liveSlots.filter(
  (s) => s.centreId === centreId && s.slotDate === slotDate
)

  const handleDateChange = (value: string) => {
    setSlotDate(value)
    setSelectedSlotId('')
    setError(null)
  }

  const handleCentreChange = (value: string) => {
    setCentreId(value)
    setSelectedSlotId('')
    setError(null)
  }

  // Estimated value at MSP
  const estimatedMspValue =
    selectedCommodity
      ? estimatedQuantity * selectedCommodity.mspPricePerQuintal
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!centreId) {
      setError('Please select a Mandi Procurement Centre.')
      return
    }

    // Final fresh status check immediately before creating a booking.
    // This prevents a booking if Admin closed the Mandi after the screen loaded.
    const freshCentre = await api.getCentreById(centreId)
    const freshCentreStatus = String(
      (freshCentre as ProcurementCentre & { operationalStatus?: string })?.operationalStatus ?? ''
    ).trim().toLowerCase()

    setLiveCentre(freshCentre)

    if (freshCentreStatus !== 'active') {
      setLiveSlots([])
      setSelectedSlotId('')
      setError('This procurement centre is currently closed and is not accepting new bookings.')
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

    if (numberOfVehicles < 1 || numberOfVehicles > 10) {
      setError('Number of vehicles must be between 1 and 10.')
      return
    }

    if (!Number.isFinite(estimatedQuantity) || estimatedQuantity <= 0) {
      setError('Please enter an estimated quantity greater than 0 quintals.')
      return
    }

    if (availableSlots.length === 0) {
      setError('No time slots are available for the selected date.')
      return
    }

    const chosenSlot =
      availableSlots.find((s) => s.id === selectedSlotId) ||
      availableSlots[0]

    const startTime = chosenSlot.startTime
    const endTime = chosenSlot.endTime

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
        numberOfVehicles,

        vehicleType,

        vehicleNumber: vehicleNumber
          .trim()
          .toUpperCase(),

        notes: notes.trim() || undefined,
      })

      onBookingSuccess(booking)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to book slot'

      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-24">

      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">
          Procurement Slot Booking
        </h2>

        <p className="text-xs text-slate-500 mt-0.5">
          Select Mandi, crop commodity, quantity and vehicle
          to generate your confirmed gate token.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {/* Step 1: Mandi & Commodity */}
        <Card className="p-4 space-y-3.5 border-slate-200">

          <Select
            label="1. Select Mandi Procurement Centre"
            value={centreId}
            onChange={(e) => {
              handleCentreChange(e.target.value)
            }}
            options={centres.map((c) => ({
              label: `${c.name} (${c.district}, ${c.state})`,
              value: c.id,
            }))}
          />

          <Select
            label="2. Select Crop Commodity"
            value={commodityId}
            onChange={(e) =>
              setCommodityId(e.target.value)
            }
            options={commodities.map((c) => ({
              label: `${c.name} — MSP ₹${c.mspPricePerQuintal.toLocaleString('en-IN')}/Qtl`,
              value: c.id,
            }))}
          />

          {/* Selected Commodity + MSP */}
          {selectedCommodity && (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">

              <div className="flex items-center justify-between gap-3">

                <div>
                  <span className="text-sm font-bold text-emerald-900">
                    {selectedCommodity.name}
                  </span>

                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Variety: {selectedCommodity.variety || 'Standard'}
                  </p>

                  <p className="text-[11px] text-emerald-700">
                    Max Moisture: {selectedCommodity.maxMoisturePercentage}%
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                    MSP
                  </span>

                  <div className="text-lg font-black font-mono text-emerald-900">
                    ₹{selectedCommodity.mspPricePerQuintal.toLocaleString('en-IN')}
                  </div>

                  <span className="text-[10px] text-emerald-600">
                    per Quintal
                  </span>
                </div>

              </div>
            </div>
          )}

        </Card>

        {/* Step 2: Date & Time Window */}
        {isCentreActive ? (
          <Card className="p-4 border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                3. Select Booking Date
              </label>

              <Input
                type="date"
                value={slotDate}
                min={today}
                onChange={(e) => handleDateChange(e.target.value)}
              />

              <p className="text-[11px] text-slate-400 mt-1">
                Select the date when your vehicle(s) will arrive at the Mandi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                4. Choose Time Window
              </label>

              {availableSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500 text-center">
                  No time slots available for this Mandi on {slotDate}.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected =
                      selectedSlotId === slot.id ||
                      (!selectedSlotId && slot === availableSlots[0])

                    const remaining = Math.max(
                      0,
                      slot.maxCapacityFarmers - slot.bookedCount
                    )

                    const isFull = remaining <= 0

                    return (
                      <button
                        type="button"
                        key={slot.id}
                        disabled={isFull}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isFull
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isSelected
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
                            isFull
                              ? 'text-slate-400'
                              : isSelected
                                ? 'text-emerald-200'
                                : 'text-slate-500'
                          }`}
                        >
                          {isFull ? 'Slot full' : `${remaining} gate slots open`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-5 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-red-800">
                  Procurement Centre Closed
                </h3>
                <p className="text-xs text-red-700 mt-1">
                  {selectedCentre?.name || 'This Mandi'} is currently closed and is not accepting new bookings.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Quantity & Vehicle */}
        <Card className="p-4 space-y-3.5 border-slate-200">

          {/* Estimated Quantity */}
          <div>

            <div className="flex items-center justify-between mb-1.5">

              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                5. Estimated Quantity (Quintals)
              </label>

              <span className="font-mono font-bold text-sm text-emerald-800">
                {estimatedQuantity} Qtl
              </span>

            </div>

            <Input
              type="number"
              min="0.01"
              step="any"
              value={estimatedQuantity || ''}
              onChange={(e) => {
                const value = e.target.value
                setEstimatedQuantity(value === '' ? 0 : Number(value))
              }}
              placeholder="Enter estimated quantity in quintals"
            />

            <p className="text-[11px] text-slate-400 mt-1">
              Enter the approximate quantity you plan to bring.
            </p>

          </div>

          {/* Estimated MSP Value */}
          {selectedCommodity && (
            <div className="p-3.5 bg-slate-900 text-white rounded-xl">

              <div className="flex items-center justify-between">

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                    Estimated Value at MSP
                  </span>

                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {estimatedQuantity} Qtl × ₹
                    {selectedCommodity.mspPricePerQuintal.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black font-mono">
                    ₹{estimatedMspValue.toLocaleString('en-IN')}
                  </div>

                  <span className="text-[10px] text-slate-400">
                    Estimated only
                  </span>
                </div>

              </div>

            </div>
          )}

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <Select
              label="Vehicle Type"
              value={vehicleType}
              onChange={(e) =>
                setVehicleType(
                  e.target.value as Booking['vehicleType']
                )
              }
              options={[
                {
                  label: '🚜 Tractor Trolley',
                  value: 'Tractor Trolley',
                },
                {
                  label: '🛻 Mini Truck / Pickup',
                  value: 'Mini Truck',
                },
                {
                  label: '🚛 Heavy Truck',
                  value: 'Truck',
                },
                {
                  label: '🐂 Bullock Cart',
                  value: 'Bullock Cart',
                },
                {
                  label: '🚐 Pickup Van',
                  value: 'Pickup Van',
                },
              ]}
            />

            <Input
              label="Number of Vehicles"
              type="number"
              min={1}
              max={10}
              value={numberOfVehicles}
              onChange={(e) =>
                setNumberOfVehicles(
                  Math.max(1, Math.min(10, Number(e.target.value) || 1))
                )
              }
              leftIcon={<Truck className="w-4 h-4" />}
            />

            <Input
              label="Vehicle Reg. Number" 
              placeholder="e.g. RJ-20-EA-4122"
              value={vehicleNumber}
              onChange={(e) =>
                setVehicleNumber(e.target.value)
              }
              leftIcon={
                <Truck className="w-4 h-4" />
              }
            />

          </div>

          {/* Notes */}
          <Input
            label="Remarks / Notes (Optional)"
            placeholder="e.g. Driver contact, dry moisture grain"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />

        </Card>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">

          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-1/3"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!isCentreActive}
            leftIcon={
              <CheckCircle2 className="w-4 h-4" />
            }
            className="flex-1 text-sm font-bold shadow-md"
          >
            Confirm & Generate Token
          </Button>

        </div>

      </form>

    </div>
  )
}
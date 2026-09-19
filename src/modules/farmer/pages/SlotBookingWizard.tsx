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

  // Smart Slot Recommendation
  const [recommendedSlotId, setRecommendedSlotId] = useState<string>('')
  const [recommendedWaitMinutes, setRecommendedWaitMinutes] = useState<number | null>(null)
  const [isCalculatingRecommendation, setIsCalculatingRecommendation] = useState(false)

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

  const [numberOfVehicles, setNumberOfVehicles] = useState<string>('1')

  const [vehicleType, setVehicleType] =
    useState<Booking['vehicleType']>('Tractor Trolley')

  const [vehicleNumber, setVehicleNumber] =
    useState('')

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

  // Recommend the available slot with the lowest expected waiting time.
  // Recalculate silently so the recommendation never disappears/blinks while
  // the 3-second live Mandi refresh is running.
  useEffect(() => {
    let active = true

    const calculateRecommendation = async () => {
      const eligibleSlots = availableSlots.filter(
        (slot) => slot.maxCapacityFarmers - slot.bookedCount > 0
      )

      if (!centreId || eligibleSlots.length === 0 || !isCentreActive) {
        if (active) {
          setRecommendedSlotId('')
          setRecommendedWaitMinutes(null)
          setIsCalculatingRecommendation(false)
        }
        return
      }

      // IMPORTANT: Do not clear the current recommendation here.
      // The old version cleared it before every calculation, while the
      // live 3-second slot refresh was running. That caused the visible blink.
      setIsCalculatingRecommendation(true)

      try {
        const scoredSlots = await Promise.all(
          eligibleSlots.map(async (slot) => {
            try {
              const smartWait = await api.calculateSmartWaitTime({
                centreId,
                farmersAhead: slot.bookedCount,
                numberOfVehicles: Math.max(1, Math.min(10, Number(numberOfVehicles) || 1)),
              })

              return {
                slot,
                waitMinutes: smartWait.estimatedWaitMinutes,
              }
            } catch (error) {
              console.warn(
                'Failed to calculate smart slot recommendation:',
                error
              )

              return {
                slot,
                waitMinutes: Math.max(
                  5,
                  Math.ceil(
                    (slot.bookedCount * 8) /
                      Math.max(1, Math.min(slot.maxCapacityFarmers, 3))
                  )
                ),
              }
            }
          })
        )

        if (!active || scoredSlots.length === 0) return

        scoredSlots.sort((a, b) => {
          if (a.waitMinutes !== b.waitMinutes) {
            return a.waitMinutes - b.waitMinutes
          }

          const aRemaining =
            a.slot.maxCapacityFarmers - a.slot.bookedCount
          const bRemaining =
            b.slot.maxCapacityFarmers - b.slot.bookedCount

          return bRemaining - aRemaining
        })

        const best = scoredSlots[0]

        // Update only after a complete calculation is ready.
        // The previous recommendation remains visible during calculation.
        setRecommendedSlotId(best.slot.id)
        setRecommendedWaitMinutes(best.waitMinutes)

        setSelectedSlotId((current) => {
          const currentSlot = eligibleSlots.find(
            (slot) => slot.id === current
          )

          return currentSlot ? current : best.slot.id
        })
      } finally {
        if (active) {
          setIsCalculatingRecommendation(false)
        }
      }
    }

    calculateRecommendation()

    return () => {
      active = false
    }
  }, [
    centreId,
    slotDate,
    liveSlots,
    numberOfVehicles,
    isCentreActive,
  ])

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

    const vehicleCount = Number(numberOfVehicles)

    if (!Number.isInteger(vehicleCount) || vehicleCount < 1 || vehicleCount > 10) {
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
        numberOfVehicles: vehicleCount,

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
                <>
                  {recommendedSlotId && (
                    <div className="mb-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-black text-emerald-800">
                                Smart Recommendation
                              </p>
                              <p className="text-xs text-emerald-700 mt-0.5">
                                Lowest expected waiting time among available slots
                              </p>
                            </div>

                            {isCalculatingRecommendation && (
                              <span className="text-[10px] font-bold text-emerald-700">
                                Updating...
                              </span>
                            )}
                          </div>

                          {(() => {
                            const recommendedSlot = availableSlots.find(
                              (slot) => slot.id === recommendedSlotId
                            )

                            if (!recommendedSlot) return null

                            return (
                              <div className="mt-2.5 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-emerald-950">
                                    {recommendedSlot.startTime} - {recommendedSlot.endTime}
                                  </p>
                                  <p className="text-[10px] text-emerald-700 mt-0.5">
                                    {Math.max(
                                      0,
                                      recommendedSlot.maxCapacityFarmers -
                                        recommendedSlot.bookedCount
                                    )}{' '}
                                    gate slots open
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-[9px] uppercase font-black tracking-wider text-emerald-700">
                                    Expected Wait
                                  </p>
                                  <p className="text-sm font-black text-emerald-950">
                                    {recommendedWaitMinutes ?? '—'} min
                                  </p>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {isCalculatingRecommendation && !recommendedSlotId && (
                    <div className="mb-3 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
                      Calculating the lowest-wait slot from live mandi conditions...
                    </div>
                  )}

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
                      const isRecommended =
                        recommendedSlotId === slot.id

                      return (
                        <button
                          type="button"
                          key={slot.id}
                          disabled={isFull}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`relative p-3 rounded-xl border text-left transition-all ${
                            isFull
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : isSelected
                                ? 'bg-emerald-800 text-white border-emerald-800 ring-2 ring-emerald-600/30'
                                : isRecommended
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isRecommended && !isFull && (
                            <span
                              className={`absolute -top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                isSelected
                                  ? 'bg-white text-emerald-800'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              Recommended
                            </span>
                          )}

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
                                  : isRecommended
                                    ? 'text-emerald-700'
                                    : 'text-slate-500'
                            }`}
                          >
                            {isFull
                              ? 'Slot full'
                              : `${remaining} gate slots open`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
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
              placeholder="Enter quantity"
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
              onFocus={() => {
                if (numberOfVehicles === '1') {
                  setNumberOfVehicles('')
                }
              }}
              onBlur={() => {
                if (numberOfVehicles === '') {
                  setNumberOfVehicles('1')
                }
              }}
              onChange={(e) => {
                const value = e.target.value

                // Allow the field to be temporarily empty while typing.
                if (value === '') {
                  setNumberOfVehicles('')
                  return
                }

                // Only allow whole numbers from 1 to 10.
                if (/^\d+$/.test(value)) {
                  const num = Number(value)

                  if (num >= 1 && num <= 10) {
                    setNumberOfVehicles(value)
                  }
                }
              }}
              leftIcon={<Truck className="w-4 h-4" />}
            />

            <Input
              label="Vehicle Reg. Number" 
              placeholder="Enter vehicle number"
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
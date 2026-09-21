import React from 'react'
import type { GateVerificationDetails } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  CheckCircle2,
  ShieldCheck,
  UserRound,
  Truck,
  Wheat,
  TicketCheck,
  AlertCircle,
} from 'lucide-react'

interface GateVerificationModalProps {
  details: GateVerificationDetails | null
  isLoading?: boolean
  identityChecked: boolean
  vehicleChecked: boolean
  onIdentityCheckedChange: (checked: boolean) => void
  onVehicleCheckedChange: (checked: boolean) => void
  onConfirm: () => void
  onClose: () => void
}

const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return phone || 'Not available'
  return `••••••${digits.slice(-4)}`
}

const maskKisanId = (kisanId?: string) => {
  if (!kisanId) return 'Not available'
  const clean = kisanId.trim()
  if (clean.length <= 4) return clean
  return `••••${clean.slice(-4)}`
}

export const GateVerificationModal: React.FC<GateVerificationModalProps> = ({
  details,
  isLoading = false,
  identityChecked,
  vehicleChecked,
  onIdentityCheckedChange,
  onVehicleCheckedChange,
  onConfirm,
  onClose,
}) => {
  if (!details) return null

  const { booking, queueEntry, identityStatus, kisanId } = details
  const canAdmit =
    booking.status === 'confirmed' &&
    queueEntry.currentStage === 'called_to_gate' &&
    identityChecked &&
    vehicleChecked

  return (
    <Modal
      isOpen={!!details}
      onClose={onClose}
      title="Farmer & Vehicle Verification"
      subtitle="Verify the booking details before gate admission"
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                    Gate Verification
                  </p>
                  <p className="mt-1 font-mono text-xl font-black text-slate-900">
                    {booking.tokenNumber || booking.bookingNumber}
                  </p>
                </div>
                <Badge variant={booking.status === 'confirmed' ? 'success' : 'danger'}>
                  {booking.status.toUpperCase()}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-indigo-900/70">
                QR scan has loaded the authoritative booking record. Confirm the farmer and vehicle before admitting the vehicle.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <UserRound className="h-3.5 w-3.5" />
              Farmer Identity
            </div>
            <p className="mt-2 text-sm font-black text-slate-900">
              {booking.farmerName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Mobile: {maskPhone(booking.farmerPhone)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Kisan ID: {maskKisanId(kisanId)}
            </p>
            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${identityStatus === 'verified_profile' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {identityStatus === 'verified_profile' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {identityStatus === 'verified_profile' ? 'Profile matched' : 'Kisan ID not available'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Truck className="h-3.5 w-3.5" />
              Vehicle Verification
            </div>
            <p className="mt-2 font-mono text-sm font-black text-slate-900">
              {booking.vehicleNumber || 'No vehicle number'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {booking.vehicleType}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Vehicles booked: {booking.numberOfVehicles || 1}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Wheat className="h-3.5 w-3.5" />
              Commodity
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">
              {booking.commodityName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Estimated quantity: {booking.estimatedQuantityQuintals} Qtl
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <TicketCheck className="h-3.5 w-3.5" />
              Booking
            </div>
            <p className="mt-2 font-mono text-sm font-black text-slate-900">
              {booking.bookingNumber}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Slot: {booking.slotDate} • {booking.slotTimeStart}–{booking.slotTimeEnd}
            </p>
          </div>
        </div>

        <div className={`rounded-xl border p-3 text-xs ${queueEntry.currentStage === 'called_to_gate' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          <p className="font-black uppercase tracking-wider text-[10px]">
            Queue status
          </p>
          <p className="mt-1 font-semibold">
            {queueEntry.currentStage === 'called_to_gate'
              ? 'This token has been called to the gate and is eligible for verification.'
              : `Current stage: ${queueEntry.currentStage.replace(/_/g, ' ')}`}
          </p>
        </div>

        {queueEntry.currentStage === 'called_to_gate' && booking.status === 'confirmed' && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={identityChecked}
                onChange={(e) => onIdentityCheckedChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block text-xs font-black text-slate-900">
                  Farmer identity verified
                </span>
                <span className="block text-[11px] leading-5 text-slate-500">
                  I have matched the farmer against the displayed booking/profile details.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={vehicleChecked}
                onChange={(e) => onVehicleCheckedChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block text-xs font-black text-slate-900">
                  Vehicle number verified
                </span>
                <span className="block text-[11px] leading-5 text-slate-500">
                  I have matched the arriving vehicle registration with the booking.
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
          <Button
            variant="success"
            isLoading={isLoading}
            disabled={!canAdmit}
            onClick={onConfirm}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            Confirm & Admit at Gate
          </Button>
        </div>
      </div>
    </Modal>
  )
}

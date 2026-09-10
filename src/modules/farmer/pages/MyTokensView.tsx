import React, { useState } from 'react'
import type { Booking, QueueEntry } from '@/types/procurement.types'
import { TokenQRPass } from '@/components/qr/TokenQRPass'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badge'
import { QrCode, CalendarPlus } from 'lucide-react'

interface MyTokensViewProps {
  bookings: Booking[]
  queueEntries: QueueEntry[]
  onBookNewSlot: () => void
}

export const MyTokensView: React.FC<MyTokensViewProps> = ({
  bookings,
  queueEntries,
  onBookNewSlot,
}) => {
  // Find primary active token (called, arrived, or confirmed)
  const activeBooking = bookings.find((b) => b.status !== 'completed' && b.status !== 'cancelled')
  const [selectedBookingId, setSelectedBookingId] = useState<string>(activeBooking?.id || bookings[0]?.id || '')

  const currentDisplayBooking = bookings.find((b) => b.id === selectedBookingId) || activeBooking || bookings[0]
  const currentQueueEntry = queueEntries.find((q) => q.bookingId === currentDisplayBooking?.id)

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto my-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <QrCode className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">No Digital Tokens Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Book an appointment slot to get your digital gate entry pass with scannable QR code.
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
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      {/* Primary Selected Token Pass with QR */}
      {currentDisplayBooking && (
        <div>
          <TokenQRPass booking={currentDisplayBooking} queueEntry={currentQueueEntry} />
        </div>
      )}

      {/* Token Switcher / History List */}
      {bookings.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              All My Tokens ({bookings.length})
            </h3>
            <Button size="sm" variant="ghost" onClick={onBookNewSlot} leftIcon={<CalendarPlus className="w-3.5 h-3.5" />}>
              New Slot
            </Button>
          </div>

          <div className="space-y-2.5">
            {bookings.map((b) => {
              const qe = queueEntries.find((q) => q.bookingId === b.id)
              const isSelected = b.id === currentDisplayBooking?.id

              return (
                <Card
                  key={b.id}
                  onClick={() => setSelectedBookingId(b.id)}
                  className={`p-3.5 transition cursor-pointer border ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900">
                          {b.tokenNumber}
                        </span>
                        <StatusPill stage={qe?.currentStage} bookingStatus={b.status} />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {b.commodityName} • {b.estimatedQuantityQuintals} Qtl
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      <span className="font-medium block">{b.slotDate}</span>
                      <span className="text-[10px] text-slate-400">{b.slotTimeStart}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

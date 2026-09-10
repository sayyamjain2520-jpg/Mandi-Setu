import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Booking, QueueEntry } from '@/types/procurement.types'
import { StatusPill } from '@/components/ui/Badge'
import { Truck, Calendar, MapPin, Sparkles, AlertCircle } from 'lucide-react'

interface TokenQRPassProps {
  booking: Booking
  queueEntry?: QueueEntry
}

export const TokenQRPass: React.FC<TokenQRPassProps> = ({ booking, queueEntry }) => {
  const isCalled = booking.status === 'called' || queueEntry?.currentStage === 'called_to_gate'

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border-2 border-emerald-700/20 shadow-xl overflow-hidden relative">
      {/* Top Banner with Token Header */}
      <div
        className={`p-6 text-white text-center relative ${
          isCalled
            ? 'bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 animate-pulse'
            : 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800'
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-xs text-[11px] font-bold tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Digital Procurement Token</span>
        </div>

        <h1 className="text-5xl font-black font-mono tracking-tight text-white drop-shadow-sm">
          {booking.tokenNumber}
        </h1>

        <p className="text-xs text-emerald-100 font-medium mt-1">
          {booking.bookingNumber} • {booking.centreName}
        </p>
      </div>

      {/* Call Alert if turn is active */}
      {isCalled && (
        <div className="bg-rose-50 border-b-2 border-rose-500 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-rose-700 font-black text-sm">
            <AlertCircle className="w-5 h-5 animate-bounce" />
            <span>ATTENTION: PROCEED TO GATE 1 IMMEDIATELY!</span>
          </div>
          <p className="text-xs text-rose-600 mt-0.5">
            Your vehicle is next for Weighment and Quality Inspection.
          </p>
        </div>
      )}

      {/* Middle QR Code Section */}
      <div className="p-6 flex flex-col items-center justify-center bg-radial from-slate-50 to-white">
        <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-emerald-600/40 shadow-inner flex flex-col items-center">
          <QRCodeSVG
            value={booking.qrCodeData || booking.bookingNumber}
            size={180}
            level="H"
            includeMargin={true}
          />
          <span className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">
            Scan at Mandi Gate Scanner
          </span>
        </div>

        {/* Status indicator */}
        <div className="mt-4 flex items-center gap-2">
          <StatusPill stage={queueEntry?.currentStage} bookingStatus={booking.status} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-400 uppercase font-semibold text-[10px]">Farmer</span>
          <p className="font-bold text-slate-800 text-sm truncate">{booking.farmerName}</p>
        </div>

        <div>
          <span className="text-slate-400 uppercase font-semibold text-[10px]">Commodity</span>
          <p className="font-bold text-slate-800 text-sm truncate">{booking.commodityName}</p>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium truncate">{booking.slotDate} ({booking.slotTimeStart})</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-mono font-bold truncate">{booking.vehicleNumber}</span>
        </div>
      </div>

      {/* Queue position & wait time strip */}
      {queueEntry && queueEntry.currentStage !== 'settled' && (
        <div className="p-4 bg-emerald-50/60 border-t border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600">Queue Position:</span>
            <span className="font-bold text-emerald-800 font-mono text-sm">
              #{queueEntry.priorityOrder}
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-400 text-[10px] block uppercase">Est. Wait</span>
            <span className="font-bold text-slate-800">
              {queueEntry.estimatedWaitMinutes > 0 ? `~${queueEntry.estimatedWaitMinutes} mins` : 'Now Calling'}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-100 text-center text-[10px] text-slate-500 border-t border-slate-200/60 flex items-center justify-center gap-1">
        <MapPin className="w-3 h-3 text-emerald-700" />
        <span>Present this screen or printed token to Mandi Gate Incharge</span>
      </div>
    </div>
  )
}

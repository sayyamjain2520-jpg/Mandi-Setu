import React, { useState } from 'react'
import type { Booking } from '@/types/procurement.types'
import { StatusPill } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Search } from 'lucide-react'

interface AllBookingsLedgerTabProps {
  bookings: Booking[]
}

export const AllBookingsLedgerTab: React.FC<AllBookingsLedgerTabProps> = ({ bookings }) => {
  const [query, setQuery] = useState('')

  const filtered = bookings.filter((b) => {
    const q = query.toLowerCase()
    return (
      b.bookingNumber.toLowerCase().includes(q) ||
      b.tokenNumber.toLowerCase().includes(q) ||
      b.farmerName.toLowerCase().includes(q) ||
      b.centreName.toLowerCase().includes(q) ||
      b.commodityName.toLowerCase().includes(q) ||
      b.vehicleNumber.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Statewide Procurement Ledger</h3>
          <p className="text-xs text-slate-500">Live booking roster across all procurement yards</p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search booking #, token, farmer, vehicle..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Token & Booking #</th>
                <th className="py-3 px-4">Farmer Details</th>
                <th className="py-3 px-4">Mandi Yard</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Slot Window</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-black text-sm text-slate-900 block">
                        {b.tokenNumber}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{b.bookingNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{b.farmerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{b.farmerPhone}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{b.centreName}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-900 block">{b.commodityName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {b.estimatedQuantityQuintals} Qtl
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{b.slotDate}</span>
                      <span className="text-[10px] text-slate-400 block">{b.slotTimeStart}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 text-[11px]">
                      {b.vehicleNumber}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill bookingStatus={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

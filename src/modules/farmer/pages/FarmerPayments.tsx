import React from 'react'
import type { ProcurementRecord } from '@/types/procurement.types'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/Badge'
import { ShieldCheck } from 'lucide-react'

interface FarmerPaymentsProps {
  records: ProcurementRecord[]
}

export const FarmerPayments: React.FC<FarmerPaymentsProps> = ({ records }) => {
  const totalAmount = records.reduce((acc, r) => acc + r.totalPayableAmount, 0)
  const totalQuintals = records.reduce((acc, r) => acc + r.finalAcceptedQuintals, 0)
  const creditedAmount = records
    .filter((r) => r.paymentStatus === 'credited')
    .reduce((acc, r) => acc + r.totalPayableAmount, 0)

  return (
    <div className="space-y-5 pb-24 max-w-xl mx-auto">
      {/* Earnings Overview Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
            Direct Benefit Transfer (DBT)
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            PFMS Verified
          </span>
        </div>

        <h2 className="text-3xl font-black font-mono tracking-tight text-white">
          ₹{totalAmount.toLocaleString('en-IN')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Total Govt MSP procurement value generated
        </p>

        <div className="mt-5 pt-4 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Bank Credited</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              ₹{creditedAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Total Grain Delivered</span>
            <span className="font-bold text-white text-sm">
              {totalQuintals.toFixed(2)} Quintals
            </span>
          </div>
        </div>
      </div>

      {/* Procurement Slips List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Procurement & Weighment Receipts ({records.length})
          </h3>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No procurement receipts issued yet. Receipts appear automatically after weighbridge verification.
          </div>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="p-4 border-slate-200">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {record.commodityName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                      {record.qualityGrade}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Slip: {record.bookingNumber} • {new Date(record.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <StatusPill paymentStatus={record.paymentStatus} />
              </div>

              {/* Weight Breakdown */}
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Gross Weight</span>
                  <span className="font-mono font-bold text-slate-700">
                    {record.grossWeightKg.toLocaleString()} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Tare (Vehicle)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {record.tareWeightKg.toLocaleString()} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Net Procured</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {record.finalAcceptedQuintals} Qtl
                  </span>
                </div>
              </div>

              {/* Moisture and Rate */}
              <div className="flex items-center justify-between pt-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Moisture: {record.moisturePercentage}%</span>
                  <span className="font-mono font-bold text-slate-700">
                    Rate: ₹{record.ratePerQuintal}/Qtl
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Amount</span>
                  <span className="text-base font-black text-emerald-800 font-mono">
                    ₹{record.totalPayableAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Bank UTR Ref */}
              {record.paymentUtr && (
                <div className="mt-3 p-2 bg-slate-50 rounded-lg text-[10px] font-mono text-slate-600 flex items-center justify-between">
                  <span>UTR: {record.paymentUtr}</span>
                  <span className="text-emerald-700 font-bold">Direct Benefit Transfer</span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import type { ProcurementCentre } from '@/types/mandi.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { MapPin, Phone, Clock, Search, CalendarPlus } from 'lucide-react'

interface CentreDiscoveryProps {
  centres: ProcurementCentre[]
  onSelectCentre: (centreId: string) => void
}

export const CentreDiscovery: React.FC<CentreDiscoveryProps> = ({ centres, onSelectCentre }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCentres = centres.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Procurement Centres (Mandis)</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Find authorized APMC procurement yards, operational hours & live waiting queues.
        </p>

        <div className="mt-3">
          <Input
            placeholder="Search by mandi name, district, state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredCentres.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No procurement centres found matching your search.
          </div>
        ) : (
          filteredCentres.map((centre) => (
            <Card key={centre.id} className="p-4 border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {centre.code}
                    </span>
                    <Badge variant={centre.operationalStatus === 'active' ? 'success' : 'danger'}>
                      {centre.operationalStatus === 'active' ? 'Operational' : 'Closed'}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{centre.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{centre.address}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    {centre.operatingHours.open} - {centre.operatingHours.close}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{centre.contactPhone}</span>
                </div>

                <div className="col-span-2 sm:col-span-1 text-right sm:text-left">
                  <span className="text-[11px] text-slate-400 block">Daily Intake Cap</span>
                  <span className="font-bold text-slate-800">
                    {centre.dailyCapacityQuintals.toLocaleString('en-IN')} Quintals
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="text-xs">
                  <span className="text-slate-500">Live Avg Wait: </span>
                  <span className="font-bold text-emerald-800">
                    ~{centre.avgWaitTimeMinutes || 20} mins
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onSelectCentre(centre.id)}
                  leftIcon={<CalendarPlus className="w-4 h-4" />}
                >
                  Book Slot
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

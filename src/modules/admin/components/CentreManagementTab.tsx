import React, { useState } from 'react'
import type { ProcurementCentre } from '@/types/mandi.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Plus, MapPin, Phone, Power, CheckCircle2 } from 'lucide-react'

interface CentreManagementTabProps {
  centres: ProcurementCentre[]
  onAddCentre: (centre: Omit<ProcurementCentre, 'id'>) => Promise<void>
  onToggleStatus: (id: string, currentStatus: ProcurementCentre['operationalStatus']) => Promise<void>
}

export const CentreManagementTab: React.FC<CentreManagementTabProps> = ({
  centres,
  onAddCentre,
  onToggleStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('Rajasthan')
  const [address, setAddress] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [dailyCapacity, setDailyCapacity] = useState(10000)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !code || !district) return

    setIsLoading(true)
    try {
      await onAddCentre({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        district: district.trim(),
        state: state.trim(),
        address: address.trim() || `${name}, ${district}, ${state}`,
        latitude: 25.0,
        longitude: 75.0,
        contactPhone: contactPhone.trim() || '+91 1800 180 1551',
        operationalStatus: 'active',
        dailyCapacityQuintals: dailyCapacity,
        operatingHours: { open: '08:00', close: '18:00' },
      })
      setIsModalOpen(false)
      setCode('')
      setName('')
      setDistrict('')
      setAddress('')
      setContactPhone('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Procurement Centres & APMC Yards</h3>
          <p className="text-xs text-slate-500">Configure daily intake limits, operating hours & status</p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Procurement Centre
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {centres.map((centre) => (
          <Card key={centre.id} className="p-4 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {centre.code}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1.5">{centre.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{centre.address}</span>
                  </p>
                </div>
                <Badge variant={centre.operationalStatus === 'active' ? 'success' : 'danger'}>
                  {centre.operationalStatus === 'active' ? 'Active' : 'Closed'}
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Daily Capacity</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {centre.dailyCapacityQuintals.toLocaleString()} Qtl
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Contact Helpline</span>
                  <span className="text-slate-700 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {centre.contactPhone}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Operating: {centre.operatingHours.open} - {centre.operatingHours.close}
              </span>
              <Button
                size="sm"
                variant={centre.operationalStatus === 'active' ? 'outline' : 'success'}
                onClick={() => onToggleStatus(centre.id, centre.operationalStatus)}
                leftIcon={<Power className="w-3.5 h-3.5" />}
              >
                {centre.operationalStatus === 'active' ? 'Set Inactive' : 'Activate Mandi'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Mandi Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Procurement Centre"
        subtitle="Add a new APMC Mandi or sub-yard into the state procurement grid"
      >
        <form onSubmit={handleCreate} className="space-y-3.5">
          <Input
            label="Mandi Code (e.g. RJ-KOTA-02)"
            placeholder="RJ-KOTA-02"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Input
            label="Centre Name"
            placeholder="e.g. Baran Krishi Upaj Mandi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="District"
              placeholder="e.g. Kota / Baran"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
            />
            <Input
              label="State"
              placeholder="Rajasthan"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>
          <Input
            label="Detailed Address"
            placeholder="Mandi Road, Yard 2..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Daily Capacity (Quintals)"
              type="number"
              value={dailyCapacity}
              onChange={(e) => setDailyCapacity(Number(e.target.value))}
            />
            <Input
              label="Contact Phone"
              placeholder="+91 744 250123"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Centre
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import React, { useState } from 'react'
import type { Commodity } from '@/types/procurement.types'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Plus, Edit2, CheckCircle2 } from 'lucide-react'

interface CommodityManagerTabProps {
  commodities: Commodity[]
  onUpdateMsp: (id: string, newMsp: number) => Promise<void>
  onAddCommodity: (commodity: Omit<Commodity, 'id'>) => Promise<void>
}

export const CommodityManagerTab: React.FC<CommodityManagerTabProps> = ({
  commodities,
  onUpdateMsp,
  onAddCommodity,
}) => {
  const [editingComm, setEditingComm] = useState<Commodity | null>(null)
  const [updatedMsp, setUpdatedMsp] = useState<number>(0)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Add commodity form states
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<Commodity['category']>('Cereals')
  const [variety, setVariety] = useState('')
  const [mspPrice, setMspPrice] = useState(2500)
  const [maxMoisture, setMaxMoisture] = useState(12.0)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenEdit = (comm: Commodity) => {
    setEditingComm(comm)
    setUpdatedMsp(comm.mspPricePerQuintal)
  }

  const handleSaveMsp = async () => {
    if (editingComm && updatedMsp > 0) {
      await onUpdateMsp(editingComm.id, updatedMsp)
      setEditingComm(null)
    }
  }

  const handleCreateCommodity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !code) return

    setIsLoading(true)
    try {
      await onAddCommodity({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        variety: variety.trim() || 'Hybrid FAQ',
        mspPricePerQuintal: mspPrice,
        maxMoisturePercentage: maxMoisture,
        unit: 'Quintal',
        isActive: true,
      })
      setIsAddModalOpen(false)
      setName('')
      setCode('')
      setVariety('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Official MSP & Crop Commodities</h3>
          <p className="text-xs text-slate-500">
            Set and adjust Minimum Support Prices (MSP) and moisture quality parameters.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Crop Commodity
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Commodity & Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Variety</th>
                <th className="py-3 px-4">Max Moisture</th>
                <th className="py-3 px-4 text-right">MSP Rate (/Qtl)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {commodities.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 text-sm block">{comm.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{comm.code}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{comm.category}</td>
                  <td className="py-3 px-4 text-slate-600">{comm.variety}</td>
                  <td className="py-3 px-4 text-slate-600">{comm.maxMoisturePercentage}%</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-800">
                    ₹{comm.mspPricePerQuintal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(comm)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Update MSP
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit MSP Modal */}
      {editingComm && (
        <Modal
          isOpen={!!editingComm}
          onClose={() => setEditingComm(null)}
          title={`Update MSP — ${editingComm.name}`}
          subtitle="Adjust the guaranteed Minimum Support Price per quintal for this commodity"
        >
          <div className="space-y-4">
            <Input
              label="MSP Price per Quintal (INR ₹)"
              type="number"
              value={updatedMsp}
              onChange={(e) => setUpdatedMsp(Number(e.target.value))}
            />

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" onClick={() => setEditingComm(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveMsp} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Save MSP Price
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Commodity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Crop Commodity"
        subtitle="Introduce a new procured crop into the APMC procurement roster"
      >
        <form onSubmit={handleCreateCommodity} className="space-y-3.5">
          <Input
            label="Commodity Name"
            placeholder="e.g. Cotton (Medium Staple)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Code (e.g. COTTON-MED)"
            placeholder="COTTON-MED"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Commodity['category'])}
              options={[
                { label: 'Cereals', value: 'Cereals' },
                { label: 'Pulses', value: 'Pulses' },
                { label: 'Oilseeds', value: 'Oilseeds' },
                { label: 'Cash Crops', value: 'Cash Crops' },
                { label: 'Millets', value: 'Millets' },
              ]}
            />
            <Input
              label="Variety"
              placeholder="e.g. Shankar-6"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="MSP Price (₹/Qtl)"
              type="number"
              value={mspPrice}
              onChange={(e) => setMspPrice(Number(e.target.value))}
            />
            <Input
              label="Max Moisture Limit (%)"
              type="number"
              step="0.5"
              value={maxMoisture}
              onChange={(e) => setMaxMoisture(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Add Commodity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

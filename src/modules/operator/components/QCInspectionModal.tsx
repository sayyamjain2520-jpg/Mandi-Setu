import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { QueueEntry } from '@/types/procurement.types'
import {
  AlertCircle,
  Beaker,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FlaskConical,
  Scale,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

export type QCResult = {
  sampleId: string
  sampleWeightKg: number
  moisture: number
  foreignMatter: number
  damagedGrains: number
  otherImpurities: number
  totalImpurities: number
  grade: 'Grade A' | 'Grade B' | 'Fair Average Quality (FAQ)'
  result: 'passed' | 'passed_with_remarks' | 'failed'
  remarks: string
  inspectedAt: string
}

export type QCCommodityLimits = {
  maxMoisture: number
  maxForeignMatter: number
  maxDamaged: number
  maxOtherImpurities: number
  maxTotalImpurities: number
}

interface QCInspectionModalProps {
  isOpen: boolean
  entry: QueueEntry
  existingResult?: QCResult
  commodityMaxMoisture?: number
  onClose: () => void
  onSubmit: (data: Omit<QCResult, 'inspectedAt'>) => Promise<void> | void
}

// These are application QC limits, not a claim of a universal statutory FSSAI/APMC standard.
// The commodity moisture limit is taken from the commodity catalogue when available.
const DEFAULT_LIMITS: Omit<QCCommodityLimits, 'maxMoisture'> = {
  maxForeignMatter: 2,
  maxDamaged: 5,
  maxOtherImpurities: 1,
  maxTotalImpurities: 5,
}


const numberOrZero = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

const normaliseMoistureLimit = (value?: number) =>
  Number.isFinite(value) && Number(value) > 0 ? Number(value) : 12

export const QCInspectionModal: React.FC<QCInspectionModalProps> = ({
  isOpen,
  entry,
  existingResult,
  commodityMaxMoisture,
  onClose,
  onSubmit,
}) => {
  const [sampleId, setSampleId] = useState('')
  const [sampleWeight, setSampleWeight] = useState('1.00')
  const [moisture, setMoisture] = useState('')
  const [foreignMatter, setForeignMatter] = useState('')
  const [damagedGrains, setDamagedGrains] = useState('')
  const [otherImpurities, setOtherImpurities] = useState('')
  const [grade, setGrade] = useState<QCResult['grade']>('Grade A')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const limits = useMemo<QCCommodityLimits>(() => ({
    maxMoisture: normaliseMoistureLimit(commodityMaxMoisture),
    ...DEFAULT_LIMITS,
  }), [commodityMaxMoisture])

  useEffect(() => {
    if (!isOpen) return
    setSampleId(
      existingResult?.sampleId ||
        `QC-${new Date().getFullYear()}-${entry.tokenNumber.replace(/[^A-Za-z0-9]/g, '')}`
    )
    setSampleWeight(existingResult?.sampleWeightKg !== undefined ? String(existingResult.sampleWeightKg) : '1.00')
    setMoisture(existingResult?.moisture !== undefined ? String(existingResult.moisture) : '')
    setForeignMatter(existingResult?.foreignMatter !== undefined ? String(existingResult.foreignMatter) : '')
    setDamagedGrains(existingResult?.damagedGrains !== undefined ? String(existingResult.damagedGrains) : '')
    setOtherImpurities(existingResult?.otherImpurities !== undefined ? String(existingResult.otherImpurities) : '')
    setGrade(existingResult?.grade || 'Grade A')
    setRemarks(existingResult?.remarks || '')
    setError('')
  }, [isOpen, entry.id, entry.tokenNumber, existingResult])

  const moistureValue = numberOrZero(moisture)
  const foreignValue = numberOrZero(foreignMatter)
  const damagedValue = numberOrZero(damagedGrains)
  const otherValue = numberOrZero(otherImpurities)

  const totalImpurities = useMemo(
    () => foreignValue + damagedValue + otherValue,
    [foreignValue, damagedValue, otherValue]
  )

  const sampleMasses = useMemo(() => ({
    foreign: (Number(sampleWeight) || 0) * foreignValue / 100,
    damaged: (Number(sampleWeight) || 0) * damagedValue / 100,
    other: (Number(sampleWeight) || 0) * otherValue / 100,
  }), [sampleWeight, foreignValue, damagedValue, otherValue])

  const checks = useMemo(() => ({
    moisture: moistureValue <= limits.maxMoisture,
    foreignMatter: foreignValue <= limits.maxForeignMatter,
    damaged: damagedValue <= limits.maxDamaged,
    other: otherValue <= limits.maxOtherImpurities,
    total: totalImpurities <= limits.maxTotalImpurities,
  }), [moistureValue, foreignValue, damagedValue, otherValue, totalImpurities, limits])

  const hasOutOfLimitParameter = Object.values(checks).some((value) => !value)

  // Inspection result is automatic: total impurities at or below 5% pass;
  // anything above 5% fails. The operator cannot manually override it.
  const result: QCResult['result'] = totalImpurities > limits.maxTotalImpurities ? 'failed' : 'passed'

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const weight = Number(sampleWeight)
    const allValues = [moistureValue, foreignValue, damagedValue, otherValue]

    if (!sampleId.trim()) return setError('Sample ID is required.')
    if (!Number.isFinite(weight) || weight <= 0) return setError('Sample weight must be greater than 0 kg.')
    if (allValues.some((value) => value > 100)) return setError('Quality percentages must be between 0 and 100.')
    if (totalImpurities > 100) return setError('Total impurities cannot exceed 100%.')
    if (result === 'failed' && !remarks.trim()) {
      return setError('Add a reason in remarks when the automatic QC result is Failed.')
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        sampleId: sampleId.trim(),
        sampleWeightKg: Number(weight.toFixed(3)),
        moisture: moistureValue,
        foreignMatter: foreignValue,
        damagedGrains: damagedValue,
        otherImpurities: otherValue,
        totalImpurities: Number(totalImpurities.toFixed(2)),
        grade,
        result,
        remarks: remarks.trim(),
      })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Failed to submit QC inspection.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={`Quality Control Inspection — ${entry.tokenNumber}`}
      subtitle={`${entry.farmerName || 'Farmer'} • ${entry.commodityName} • ${entry.vehicleNumber}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoBox icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Token">
            <p className="font-mono text-lg font-black text-slate-900">{entry.tokenNumber}</p>
          </InfoBox>
          <InfoBox icon={<Beaker className="h-3.5 w-3.5" />} label="Sample ID">
            <input value={sampleId} onChange={(e) => setSampleId(e.target.value)} className="mt-1 w-full bg-transparent font-mono text-sm font-bold outline-none" placeholder="QC-2026-T003" />
          </InfoBox>
          <InfoBox icon={<Scale className="h-3.5 w-3.5" />} label="Sample Weight">
            <div className="mt-1 flex items-center gap-1">
              <input type="number" min="0.01" step="0.01" value={sampleWeight} onChange={(e) => setSampleWeight(e.target.value)} className="w-full bg-transparent font-mono text-sm font-bold outline-none" />
              <span className="text-xs font-semibold text-slate-400">kg</span>
            </div>
          </InfoBox>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm"><UserRound className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black text-slate-900">{entry.farmerName || 'Farmer'}</p>
                <span className="rounded-lg bg-white px-2 py-1 font-mono text-[10px] font-bold text-indigo-700 border border-indigo-200">{entry.bookingNumber}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-900">
                <span><strong>Commodity:</strong> {entry.commodityName}</span>
                <span><strong>Vehicle:</strong> {entry.vehicleNumber}</span>
                <span><strong>Vehicles:</strong> {entry.numberOfVehicles}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-black text-slate-900">Quality Parameters</h4>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricInput label="Moisture" suffix="%" value={moisture} onChange={setMoisture} required limit={`≤ ${limits.maxMoisture}%`} ok={checks.moisture} />
            <MetricInput label="Foreign Matter" suffix="%" value={foreignMatter} onChange={setForeignMatter} limit={`≤ ${limits.maxForeignMatter}%`} ok={checks.foreignMatter} />
            <MetricInput label="Damaged / Discoloured" suffix="%" value={damagedGrains} onChange={setDamagedGrains} limit={`≤ ${limits.maxDamaged}%`} ok={checks.damaged} />
            <MetricInput label="Other Impurities" suffix="%" value={otherImpurities} onChange={setOtherImpurities} limit={`≤ ${limits.maxOtherImpurities}%`} ok={checks.other} />
          </div>

          <div className={`mt-3 rounded-xl border px-3 py-2.5 text-xs ${checks.total ? 'border-slate-200 bg-white' : 'border-rose-200 bg-rose-50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total recorded impurities</span>
              <span className={`font-mono font-black ${checks.total ? 'text-slate-900' : 'text-rose-700'}`}>{totalImpurities.toFixed(2)}% / {limits.maxTotalImpurities}% max</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
              <span>Foreign: {sampleMasses.foreign.toFixed(3)} kg</span>
              <span>Damaged: {sampleMasses.damaged.toFixed(3)} kg</span>
              <span>Other: {sampleMasses.other.toFixed(3)} kg</span>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-slate-400">
            QC limits shown here are the application's configured screening limits. Moisture uses the commodity catalogue limit when available.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold text-slate-700">Quality Grade</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['Grade A', 'Grade B', 'Fair Average Quality (FAQ)'] as const).map((value) => (
              <button key={value} type="button" onClick={() => setGrade(value)} className={`rounded-xl border p-3 text-left transition ${grade === value ? 'border-emerald-300 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/10' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                <span className="block text-xs font-black">{value}</span>
                <span className="mt-0.5 block text-[10px] opacity-70">{value === 'Grade A' ? 'Premium / high quality' : value === 'Grade B' ? 'Standard acceptable quality' : 'Procurement FAQ classification'}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-black text-slate-900">Inspection Result</h4>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">AUTO</span>
          </div>
          <div className={`rounded-xl border p-4 ${result === 'failed' ? 'border-rose-300 bg-rose-50' : 'border-emerald-300 bg-emerald-50'}`}>
            <div className="flex items-center gap-3">
              {result === 'failed' ? (
                <AlertCircle className="h-6 w-6 text-rose-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              )}
              <div>
                <p className={`text-sm font-black ${result === 'failed' ? 'text-rose-900' : 'text-emerald-900'}`}>
                  {result === 'failed' ? 'Failed' : 'Passed'}
                </p>
                <p className={`mt-0.5 text-[11px] ${result === 'failed' ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {result === 'failed'
                    ? `Total impurities ${totalImpurities.toFixed(2)}% exceeds the ${limits.maxTotalImpurities}% maximum.`
                    : `Total impurities ${totalImpurities.toFixed(2)}% is within the ${limits.maxTotalImpurities}% maximum.`}
                </p>
              </div>
            </div>
            <div className="mt-3 border-t border-current/10 pt-2 text-[10px] font-semibold text-slate-500">
              Result is calculated automatically from the recorded quality measurements. It cannot be selected manually.
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold text-slate-700">QC Remarks {result === 'failed' ? '(required)' : '(optional)'}</label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="e.g. Moisture within accepted range; sample clear of abnormal contamination." className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10" />
        </div>

        {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800"><AlertCircle className="h-4 w-4 shrink-0 text-rose-600" /><span>{error}</span></div>}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
          <div className="flex items-center gap-2 font-bold text-slate-800"><Clock3 className="h-3.5 w-3.5" />QC audit</div>
          <p className="mt-1">Operator, sample measurements, result and submission time are stored in the QC inspection record.</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="success" isLoading={isSubmitting} leftIcon={result === 'failed' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />} className="font-bold">
            {result === 'failed' ? 'Record QC Failure' : 'Complete QC & Send to Weighbridge'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const InfoBox: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{icon}{label}</div>{children}</div>
)

const MetricInput: React.FC<{
  label: string
  suffix: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  limit: string
  ok: boolean
}> = ({ label, suffix, value, onChange, required, limit, ok }) => (
  <label className={`rounded-xl border p-3 ${value === '' ? 'border-slate-200 bg-white' : ok ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-300 bg-rose-50'}`}>
    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}{required ? ' *' : ''}</span>
    <div className="mt-1 flex items-center gap-1">
      <input type="number" min="0" max="100" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 w-full bg-transparent font-mono text-sm font-black text-slate-900 outline-none" placeholder="0.00" />
      <span className="text-xs font-semibold text-slate-400">{suffix}</span>
    </div>
    <span className={`mt-1 block text-[9px] font-bold ${value === '' || ok ? 'text-slate-400' : 'text-rose-600'}`}>{limit}{value !== '' && !ok ? ' • OUT OF LIMIT' : ''}</span>
  </label>
)

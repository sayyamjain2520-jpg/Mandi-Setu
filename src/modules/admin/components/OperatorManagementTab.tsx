import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/config/supabase'
import type { ProcurementCentre } from '@/types/mandi.types'
import { Card } from '@/components/ui/Card'
import {
  Building2,
  CheckCircle2,
  Plus,
  RefreshCw,
  UserCog,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'

interface OperatorProfile {
  id: string
  full_name: string | null
  phone_number: string | null
  state: string | null
  district: string | null
  mandi_id: string | null
}

interface OperatorManagementTabProps {
  centres: ProcurementCentre[]
}

interface OperatorForm {
  fullName: string
  email: string
  phoneNumber: string
  state: string
  district: string
  mandiId: string
  password: string
}

const emptyForm: OperatorForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  state: '',
  district: '',
  mandiId: '',
  password: '',
}

export const OperatorManagementTab: React.FC<OperatorManagementTabProps> = ({
  centres,
}) => {
  const [operators, setOperators] = useState<OperatorProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form, setForm] = useState<OperatorForm>(emptyForm)

  const selectedCentre = useMemo(
    () => centres.find((centre) => centre.id === form.mandiId),
    [centres, form.mandiId]
  )

  const loadOperators = useCallback(async () => {
    if (!supabase) return

    setIsLoading(true)
    setErrorMessage(null)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, state, district, mandi_id')
      .eq('role', 'operator')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Failed to load operators:', error)
      setErrorMessage(error.message)
      setOperators([])
    } else {
      setOperators((data || []) as OperatorProfile[])
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadOperators()
  }, [loadOperators])

  const handleAssignMandi = async (
    operatorId: string,
    mandiId: string | null
  ) => {
    if (!supabase) return

    setSavingId(operatorId)
    setMessage(null)
    setErrorMessage(null)

    const { error } = await supabase.rpc('admin_assign_operator_mandi', {
      p_operator_id: operatorId,
      p_mandi_id: mandiId || null,
    })

    if (error) {
      console.error('Failed to assign operator:', error)
      setErrorMessage(error.message)
    } else {
      setOperators((current) =>
        current.map((operator) =>
          operator.id === operatorId
            ? { ...operator, mandi_id: mandiId || null }
            : operator
        )
      )
      setMessage(
        mandiId
          ? 'Operator mandi assignment updated successfully.'
          : 'Operator mandi assignment cleared.'
      )
    }

    setSavingId(null)
  }

  const openCreateModal = () => {
    setMessage(null)
    setErrorMessage(null)
    setForm(emptyForm)
    setIsCreateOpen(true)
  }

  const closeCreateModal = () => {
    if (createLoading) return
    setIsCreateOpen(false)
    setForm(emptyForm)
  }

  const handleCreateOperator = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      setErrorMessage('Supabase is not configured.')
      return
    }

    const payload: OperatorForm = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phoneNumber: form.phoneNumber.trim(),
      state: (selectedCentre?.state || form.state).trim(),
      district: (selectedCentre?.district || form.district).trim(),
      mandiId: form.mandiId,
      password: form.password,
    }

    if (
      !payload.fullName ||
      !payload.email ||
      !payload.phoneNumber ||
      !payload.state ||
      !payload.district ||
      !payload.mandiId ||
      !payload.password
    ) {
      setErrorMessage('Please fill all operator fields and select a mandi.')
      return
    }

    if (payload.password.length < 8) {
      setErrorMessage('Operator password must be at least 8 characters.')
      return
    }

    setCreateLoading(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const { data, error } = await supabase.functions.invoke(
        'admin-create-operator',
        {
          body: payload,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create operator.')
      }

      const createdName = data?.operator?.fullName || payload.fullName
      const createdMandi =
        data?.operator?.mandiName || selectedCentre?.name || 'selected mandi'

      setMessage(
        `Operator ${createdName} created successfully and assigned to ${createdMandi}.`
      )
      setForm(emptyForm)
      setIsCreateOpen(false)
      await loadOperators()
    } catch (error) {
      console.error('Failed to create operator:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create operator.'
      )
    } finally {
      setCreateLoading(false)
    }
  }

  const handleMandiChange = (mandiId: string) => {
    const centre = centres.find((item) => item.id === mandiId)

    setForm((current) => ({
      ...current,
      mandiId,
      state: centre?.state || current.state,
      district: centre?.district || current.district,
    }))
  }

  const getMandiName = (mandiId: string | null) => {
    if (!mandiId) return 'Not assigned'
    return (
      centres.find((centre) => centre.id === mandiId)?.name ||
      'Unknown mandi'
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Operator Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create real operator accounts and assign each operator to exactly one procurement centre.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            Add Operator
          </button>

          <button
            type="button"
            onClick={() => void loadOperators()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Operators
          </button>
        </div>
      </div>

      <Card className="border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex items-start gap-3">
          <UserCog className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
          <div>
            <p className="text-sm font-semibold text-indigo-950">
              Mandi assignment is the source of truth
            </p>
            <p className="mt-1 text-xs leading-5 text-indigo-800">
              Every operator should have one <code>profiles.mandi_id</code>.
              The operator dashboard uses that assignment to restrict its data to the assigned mandi.
            </p>
          </div>
        </div>
      </Card>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Operator update failed</p>
            <p className="mt-0.5 text-xs">{errorMessage}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="mt-3 text-sm text-slate-500">Loading operators...</p>
        </Card>
      ) : operators.length === 0 ? (
        <Card className="p-8 text-center">
          <UserRound className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 font-semibold text-slate-800">
            No operator profiles found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Use Add Operator to create a real Supabase Auth account and assign it to a procurement centre.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {operators.map((operator) => (
            <Card key={operator.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <UserRound className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {operator.full_name || 'Unnamed Operator'}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {operator.phone_number || 'Phone not provided'}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                      ID: {operator.id}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    operator.mandi_id
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {operator.mandi_id ? 'ASSIGNED' : 'UNASSIGNED'}
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  Assigned Mandi
                </div>

                <p className="mt-2 text-sm font-bold text-slate-900">
                  {getMandiName(operator.mandi_id)}
                </p>

                {operator.mandi_id && (
                  <p className="mt-1 text-xs text-slate-500">
                    {centres.find((centre) => centre.id === operator.mandi_id)?.code ||
                      'Mandi code unavailable'}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label
                  htmlFor={`operator-mandi-${operator.id}`}
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Assign / Reassign Mandi
                </label>

                <select
                  id={`operator-mandi-${operator.id}`}
                  value={operator.mandi_id || ''}
                  disabled={savingId === operator.id}
                  onChange={(event) =>
                    void handleAssignMandi(
                      operator.id,
                      event.target.value || null
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Unassigned</option>
                  {centres.map((centre) => (
                    <option key={centre.id} value={centre.id}>
                      {centre.code} — {centre.name}
                    </option>
                  ))}
                </select>

                {savingId === operator.id && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Saving assignment...
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Real account workflow
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              The Add Operator action calls the deployed <code>admin-create-operator</code> Edge Function. The service-role key stays server-side; the browser never receives it.
            </p>
          </div>
        </div>
      </Card>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Create Operator
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Creates the real Supabase Auth account and assigns exactly one mandi.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={createLoading}
                aria-label="Close"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOperator} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Kota Mandi Operator"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Login Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="kota.operator@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phoneNumber: event.target.value,
                      }))
                    }
                    placeholder="+91 9876543210"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Assign Mandi
                </label>
                <select
                  value={form.mandiId}
                  onChange={(event) => handleMandiChange(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select procurement centre</option>
                  {centres.map((centre) => (
                    <option key={centre.id} value={centre.id}>
                      {centre.code} — {centre.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    State
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    readOnly
                    placeholder="Select mandi first"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    District
                  </label>
                  <input
                    type="text"
                    value={form.district}
                    readOnly
                    placeholder="Select mandi first"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                The password is sent only to the secure Edge Function for account creation. The Supabase service-role key remains server-side.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={createLoading}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createLoading && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                  {createLoading ? 'Creating...' : 'Create Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

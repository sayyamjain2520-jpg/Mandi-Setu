import React, { useState } from 'react'
import type { ProcurementCentre } from '@/types/mandi.types'
import { supabase } from '@/config/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  Plus,
  MapPin,
  Phone,
  Power,
  CheckCircle2,
  Pencil,
  Clock,
  Database,
  UserRound,
  UserPlus,
  UserCog,
  RefreshCw,
  X,
} from 'lucide-react'

interface CentreManagementTabProps {
  centres: ProcurementCentre[]
  onAddCentre: (centre: Omit<ProcurementCentre, 'id'>) => Promise<void>
  onUpdateCentre: (
    id: string,
    centre: Partial<Omit<ProcurementCentre, 'id'>>
  ) => Promise<void>
  onToggleStatus: (
    id: string,
    currentStatus: ProcurementCentre['operationalStatus']
  ) => Promise<void>
}

interface OperatorProfile {
  id: string
  full_name: string | null
  phone_number: string | null
  state: string | null
  district: string | null
  mandi_id: string | null
}

interface OperatorForm {
  fullName: string
  email: string
  phoneNumber: string
  state: string
  district: string
  password: string
}

export const CentreManagementTab: React.FC<CentreManagementTabProps> = ({
  centres,
  onAddCentre,
  onUpdateCentre,
  onToggleStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCentre, setEditingCentre] =
    useState<ProcurementCentre | null>(null)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('Rajasthan')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [dailyCapacity, setDailyCapacity] = useState('10000')
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('18:00')

  const [isLoading, setIsLoading] = useState(false)

  // ------------------------------------------------------------
  // Mandi → Operator relationship
  // Each procurement centre owns its operator account.
  // ------------------------------------------------------------
  const [operators, setOperators] = useState<OperatorProfile[]>([])
  const [operatorsLoading, setOperatorsLoading] = useState(false)
  const [operatorActionLoading, setOperatorActionLoading] =
    useState(false)
  const [operatorMessage, setOperatorMessage] = useState<string | null>(null)
  const [operatorError, setOperatorError] = useState<string | null>(null)

  const [operatorModal, setOperatorModal] = useState<{
    mode: 'create' | 'edit'
    centre: ProcurementCentre | null
    operator: OperatorProfile | null
  } | null>(null)

  const [operatorForm, setOperatorForm] = useState<OperatorForm>({
    fullName: '',
    email: '',
    phoneNumber: '',
    state: '',
    district: '',
    password: '',
  })

  const [expandedOperatorCentreId, setExpandedOperatorCentreId] =
    useState<string | null>(null)

  const loadOperators = async () => {
    if (!supabase) return

    setOperatorsLoading(true)
    setOperatorError(null)

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, full_name, phone_number, state, district, mandi_id'
      )
      .eq('role', 'operator')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Failed to load mandi operators:', error)
      setOperatorError(error.message)
      setOperators([])
    } else {
      setOperators((data || []) as OperatorProfile[])
    }

    setOperatorsLoading(false)
  }

  React.useEffect(() => {
    void loadOperators()
  }, [centres])

  const getOperatorForCentre = (centreId: string) =>
    operators.find(
      (operator) => operator.mandi_id === centreId
    ) || null

  const openCreateOperator = (centre: ProcurementCentre) => {
    const existingOperator = getOperatorForCentre(centre.id)

    if (existingOperator) {
      setOperatorMessage(
        `${centre.name} already has an operator. Use Edit Operator instead.`
      )
      setOperatorError(null)
      return
    }

    setOperatorMessage(null)
    setOperatorError(null)

    setOperatorForm({
      fullName: '',
      email: '',
      phoneNumber: centre.contactPhone || '',
      state: centre.state,
      district: centre.district,
      password: '',
    })

    setOperatorModal({
      mode: 'create',
      centre,
      operator: null,
    })
  }

  const openEditOperator = (
    centre: ProcurementCentre,
    operator: OperatorProfile
  ) => {
    setOperatorMessage(null)
    setOperatorError(null)

    setOperatorForm({
      fullName: operator.full_name || '',
      email: '',
      phoneNumber: operator.phone_number || '',
      state: operator.state || centre.state,
      district: operator.district || centre.district,
      password: '',
    })

    setOperatorModal({
      mode: 'edit',
      centre,
      operator,
    })
  }

  const closeOperatorModal = () => {
    if (operatorActionLoading) return

    setOperatorModal(null)
    setOperatorForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      state: '',
      district: '',
      password: '',
    })
  }

  const handleOperatorSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!supabase || !operatorModal?.centre) return

    const fullName = operatorForm.fullName.trim()
    const email = operatorForm.email.trim().toLowerCase()
    const phoneNumber = operatorForm.phoneNumber.trim()
    const state = operatorForm.state.trim()
    const district = operatorForm.district.trim()
    const password = operatorForm.password

    if (!fullName || !phoneNumber || !state || !district) {
      setOperatorError(
        'Full name, phone number, state and district are required.'
      )
      return
    }

    if (operatorModal.mode === 'create') {
      if (!email || !password) {
        setOperatorError(
          'Login email and password are required when creating an operator.'
        )
        return
      }

      if (password.length < 8) {
        setOperatorError(
          'Operator password must be at least 8 characters.'
        )
        return
      }
    } else if (email && !email.includes('@')) {
      setOperatorError('Please enter a valid new login email.')
      return
    } else if (password && password.length < 8) {
      setOperatorError(
        'New operator password must be at least 8 characters.'
      )
      return
    }

    setOperatorActionLoading(true)
    setOperatorError(null)
    setOperatorMessage(null)

    try {
      if (operatorModal.mode === 'create') {
        const { data, error } = await supabase.functions.invoke(
          'admin-create-operator',
          {
            body: {
              fullName,
              email,
              phoneNumber,
              state,
              district,
              mandiId: operatorModal.centre.id,
              password,
            },
          }
        )

        if (error) throw new Error(error.message)
        if (!data?.success) {
          throw new Error(
            data?.error || 'Failed to create operator account.'
          )
        }

        setOperatorMessage(
          `${fullName} is now the operator for ${operatorModal.centre.name}.`
        )
      } else {
        if (!operatorModal.operator) {
          throw new Error('Operator record not found.')
        }

        const { data, error } = await supabase.functions.invoke(
          'admin-update-operator',
          {
            body: {
              operatorId: operatorModal.operator.id,
              fullName,
              email: email || undefined,
              phoneNumber,
              state,
              district,
              mandiId: operatorModal.centre.id,
              password: password || undefined,
            },
          }
        )

        if (error) throw new Error(error.message)
        if (!data?.success) {
          throw new Error(
            data?.error || 'Failed to update operator account.'
          )
        }

        setOperatorMessage(
          `${fullName} has been updated for ${operatorModal.centre.name}.`
        )
      }

      closeOperatorModal()
      await loadOperators()
    } catch (error) {
      console.error('Operator action failed:', error)
      setOperatorError(
        error instanceof Error
          ? error.message
          : 'Operator action failed.'
      )
    } finally {
      setOperatorActionLoading(false)
    }
  }

  const resetForm = () => {
    setCode('')
    setName('')
    setDistrict('')
    setState('Rajasthan')
    setAddress('')
    setLatitude('')
    setLongitude('')
    setContactPhone('')
    setDailyCapacity('10000')
    setOpenTime('08:00')
    setCloseTime('18:00')
    setEditingCentre(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (centre: ProcurementCentre) => {
    setEditingCentre(centre)

    setCode(centre.code)
    setName(centre.name)
    setDistrict(centre.district)
    setState(centre.state)
    setAddress(centre.address)
    setLatitude(String(centre.latitude))
    setLongitude(String(centre.longitude))
    setContactPhone(centre.contactPhone)
    setDailyCapacity(String(centre.dailyCapacityQuintals))
    setOpenTime(centre.operatingHours?.open || '08:00')
    setCloseTime(centre.operatingHours?.close || '18:00')

    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !code.trim() || !district.trim()) {
      return
    }

    const parsedLatitude = Number(latitude)
    const parsedLongitude = Number(longitude)
    const parsedCapacity = Number(dailyCapacity)

    if (
      Number.isNaN(parsedLatitude) ||
      Number.isNaN(parsedLongitude) ||
      Number.isNaN(parsedCapacity)
    ) {
      return
    }

    setIsLoading(true)

    try {
      const centreData = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        district: district.trim(),
        state: state.trim(),
        address:
          address.trim() || `${name.trim()}, ${district.trim()}, ${state.trim()}`,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        contactPhone: contactPhone.trim(),
        dailyCapacityQuintals: parsedCapacity,
        operatingHours: {
          open: openTime,
          close: closeTime,
        },
      }

      if (editingCentre) {
        await onUpdateCentre(editingCentre.id, centreData)
      } else {
        await onAddCentre({
          ...centreData,
          operationalStatus: 'active',
        })
      }

      setIsModalOpen(false)
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const closeModal = () => {
    if (isLoading) return

    setIsModalOpen(false)
    resetForm()
  }

  const getStatusLabel = (
    status: ProcurementCentre['operationalStatus']
  ) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'closed':
        return 'Closed'
      default:
        return status
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Mandi Centres
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage procurement centres, locations, capacity and operating hours.
          </p>
        </div>

        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Procurement Centre
        </Button>
      </div>

      {operatorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {operatorMessage}
        </div>
      )}

      {operatorError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p className="font-semibold">Operator action failed</p>
          <p className="mt-0.5 text-xs">{operatorError}</p>
        </div>
      )}

      {/* Centre Cards */}
      {centres.length === 0 ? (
        <Card className="p-8 text-center">
          <Database className="mx-auto mb-3 h-10 w-10 text-slate-400" />

          <h3 className="font-semibold text-slate-800">
            No procurement centres found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add your first mandi centre to start managing procurement.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {centres.map((centre) => (
            <Card key={centre.id} className="overflow-hidden">
              <div className="p-5">
                {/* Top Section */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold tracking-wide text-slate-700">
                        {centre.code}
                      </span>

                      <Badge>
                        {getStatusLabel(centre.operationalStatus)}
                      </Badge>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">
                      {centre.name}
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => openEditModal(centre)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>

                {/* Details */}
                <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                    <div>
                      <p>{centre.address}</p>

                      <p className="mt-1 text-xs text-slate-400">
                        {centre.district}, {centre.state}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Coordinates: {centre.latitude}, {centre.longitude}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{centre.contactPhone || 'Not provided'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4 shrink-0" />

                    <span>
                      {centre.operatingHours?.open || '--:--'} –{' '}
                      {centre.operatingHours?.close || '--:--'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Daily Capacity
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {centre.dailyCapacityQuintals.toLocaleString()} qtl
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Active Tokens
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {centre.activeTokensCount ?? 0}
                    </p>
                  </div>
                </div>

                {/* Mandi Operator */}
                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
                        <UserRound className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          Mandi Operator
                        </p>

                        {(() => {
                          const operator = getOperatorForCentre(centre.id)

                          return operator ? (
                            <>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {operator.full_name || 'Unnamed Operator'}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-600">
                                {operator.phone_number || 'Phone not provided'}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              No operator assigned
                            </p>
                          )
                        })()}
                      </div>
                    </div>

                    {operatorsLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                    ) : getOperatorForCentre(centre.id) ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">
                        ASSIGNED
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                        UNASSIGNED
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(() => {
                      const operator = getOperatorForCentre(centre.id)

                      return operator ? (
                        <button
                          type="button"
                          onClick={() => openEditOperator(centre, operator)}
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-50"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          Edit Operator
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openCreateOperator(centre)}
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-800"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Add Operator
                        </button>
                      )})()}

                    <button
                      type="button"
                      onClick={() => {
                        setExpandedOperatorCentreId((current) =>
                          current === centre.id ? null : centre.id
                        )
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {expandedOperatorCentreId === centre.id
                        ? 'Hide Details'
                        : 'View Details'}
                    </button>
                  </div>

                  {expandedOperatorCentreId === centre.id && (
                    <div className="mt-3 rounded-lg border border-white bg-white p-3 text-xs text-slate-600">
                      {(() => {
                        const operator = getOperatorForCentre(centre.id)

                        return operator ? (
                          <div className="space-y-1">
                            <p>
                              <span className="font-semibold text-slate-800">
                                Operator ID:
                              </span>{' '}
                              <span className="font-mono text-[10px]">
                                {operator.id}
                              </span>
                            </p>
                            <p>
                              <span className="font-semibold text-slate-800">
                                District:
                              </span>{' '}
                              {operator.district || centre.district}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-800">
                                State:
                              </span>{' '}
                              {operator.state || centre.state}
                            </p>
                            <p className="pt-1 text-[11px] text-slate-400">
                              Login credentials are managed securely through the
                              operator account service.
                            </p>
                          </div>
                        ) : (
                          <p>
                            This mandi currently has no operator account.
                            Create one here so the operator is permanently
                            linked to this procurement centre.
                          </p>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      onToggleStatus(
                        centre.id,
                        centre.operationalStatus
                      )
                    }
                  >
                    <Power className="mr-2 h-4 w-4" />

                    {centre.operationalStatus === 'active'
                      ? 'Deactivate'
                      : 'Activate'}
                  </Button>

                  {centre.operationalStatus === 'active' && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Centre accepting bookings
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Operator Modal */}
      {operatorModal?.centre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  {operatorModal.mode === 'create'
                    ? 'Add Mandi Operator'
                    : 'Edit Mandi Operator'}
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {operatorModal.centre.name}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {operatorModal.centre.code} · {operatorModal.centre.district},{' '}
                  {operatorModal.centre.state}
                </p>
              </div>

              <button
                type="button"
                onClick={closeOperatorModal}
                disabled={operatorActionLoading}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close operator modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleOperatorSubmit}
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Operator Name"
                  value={operatorForm.fullName}
                  onChange={(event) =>
                    setOperatorForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Kota Mandi Operator"
                  required
                />

                <Input
                  label={
                    operatorModal.mode === 'create'
                      ? 'Login Email'
                      : 'New Login Email (optional)'
                  }
                  type="email"
                  value={operatorForm.email}
                  onChange={(event) =>
                    setOperatorForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="operator@mandi.gov.in"
                  required={operatorModal.mode === 'create'}
                />

                <Input
                  label="Phone Number"
                  value={operatorForm.phoneNumber}
                  onChange={(event) =>
                    setOperatorForm((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                  placeholder="+91 9876543210"
                  required
                />

                <Input
                  label="District"
                  value={operatorForm.district}
                  onChange={(event) =>
                    setOperatorForm((current) => ({
                      ...current,
                      district: event.target.value,
                    }))
                  }
                  placeholder={operatorModal.centre.district}
                  required
                />

                <Input
                  label="State"
                  value={operatorForm.state}
                  onChange={(event) =>
                    setOperatorForm((current) => ({
                      ...current,
                      state: event.target.value,
                    }))
                  }
                  placeholder={operatorModal.centre.state}
                  required
                />

                <Input
                  label={
                    operatorModal.mode === 'create'
                      ? 'Password'
                      : 'New Password (optional)'
                  }
                  type="password"
                  value={operatorForm.password}
                  onChange={(event) =>
                    setOperatorForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Minimum 8 characters"
                  required={operatorModal.mode === 'create'}
                />
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3 text-xs leading-5 text-indigo-900">
                <span className="font-semibold">Assigned mandi:</span>{' '}
                {operatorModal.centre.name}. The operator account is tied to
                this procurement centre and is expected to work only within
                this mandi.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeOperatorModal}
                  disabled={operatorActionLoading}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={operatorActionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {operatorActionLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {operatorModal.mode === 'create'
                        ? 'Create Operator'
                        : 'Save Operator'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCentre ? 'Edit Procurement Centre' : 'Add Procurement Centre'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Mandi Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="RJ-KOTA-01"
                required
              />

              <Input
                label="Mandi Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kota Bhamashah APMC Mega Yard"
                required
              />

              <Input
                label="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Kota"
                required
              />

              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Rajasthan"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Location
            </h3>

            <div className="space-y-4">
              <Input
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete mandi address"
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="25.12215"
                  required
                />

                <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="75.87488"
                  required
                />
              </div>

              <p className="text-xs text-slate-500">
                Enter the actual latitude and longitude of the procurement
                centre. These coordinates are used for route and arrival
                calculations.
              </p>
            </div>
          </div>

          {/* Capacity & Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Capacity & Contact
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Daily Capacity (Quintals)"
                type="number"
                min="0"
                value={dailyCapacity}
                onChange={(e) => setDailyCapacity(e.target.value)}
                required
              />

              <Input
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 1800 180 1551"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Operating Hours
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Opening Time"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
              />

              <Input
                label="Closing Time"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : editingCentre
                  ? 'Update Centre'
                  : 'Save Centre'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import type { AdminAnalytics, Booking, Commodity } from '@/types/procurement.types'
import type { ProcurementCentre } from '@/types/mandi.types'
import { Card } from '@/components/ui/Card'
import { CentreManagementTab } from '@/modules/admin/components/CentreManagementTab'
import { CommodityManagerTab } from '@/modules/admin/components/CommodityManagerTab'
import { AllBookingsLedgerTab } from '@/modules/admin/components/AllBookingsLedgerTab'
import {
  BarChart3,
  Building2,
  Wheat,
  ListOrdered,
  Users,
  Clock,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

type AdminTab = 'analytics' | 'centres' | 'commodities' | 'bookings'

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics')
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [centres, setCentres] = useState<ProcurementCentre[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [an, c, comm, b] = await Promise.all([
        api.getAdminAnalytics(),
        api.getCentres(),
        api.getCommodities(),
        api.getBookings(),
      ])
      setAnalytics(an)
      setCentres(c)
      setCommodities(comm)
      setBookings(b)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const unsubscribe = api.subscribe(() => {
      loadData()
    })
    return () => unsubscribe()
  }, [loadData])

  const handleAddCentre = async (centreData: Omit<ProcurementCentre, 'id'>) => {
    await api.addCentre(centreData)
    loadData()
  }

  const handleToggleCentreStatus = async (
    id: string,
    currentStatus: ProcurementCentre['operationalStatus']
  ) => {
    const next = currentStatus === 'active' ? 'closed' : 'active'
    await api.updateCentre(id, { operationalStatus: next })
    loadData()
  }

  const handleUpdateMsp = async (id: string, newMsp: number) => {
    await api.updateCommodity(id, { mspPricePerQuintal: newMsp })
    loadData()
  }

  const handleAddCommodity = async (commodityData: Omit<Commodity, 'id'>) => {
    await api.addCommodity(commodityData)
    loadData()
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-20">
      {/* Directorate Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>CENTRAL APMC PROCUREMENT DIRECTORATE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Mandi Setu — Operations & Analytics Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time state monitoring, capacity utilization, queue latencies & DBT payout reconciliation
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'analytics' as AdminTab, label: 'Live Analytics & KPIs', icon: BarChart3 },
          { id: 'centres' as AdminTab, label: 'Mandi Centres', icon: Building2 },
          { id: 'commodities' as AdminTab, label: 'Commodities & MSP', icon: Wheat },
          { id: 'bookings' as AdminTab, label: 'Statewide Ledger', icon: ListOrdered },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Executive KPI Cards (Calculated directly from live data) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total Bookings</span>
                <ListOrdered className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-2xl font-black font-mono text-slate-900">
                {analytics.totalBookings}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Confirmed farmer tokens</p>
            </Card>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider">Active Queue</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-black font-mono text-amber-600">
                {analytics.activeQueueCount}
              </span>
              <p className="text-[11px] text-amber-700 mt-1">
                Avg wait: ~{analytics.averageWaitTimeMinutes} mins
              </p>
            </Card>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider">Farmers Served</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-black font-mono text-emerald-700">
                {analytics.farmersServedTotal}
              </span>
              <p className="text-[11px] text-emerald-700 mt-1">Procurement slips completed</p>
            </Card>

            <Card className="p-4 border-slate-200">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider">Capacity Intake</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-2xl font-black font-mono text-blue-700">
                {analytics.capacityUtilisationPercentage}%
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Of state daily quota</p>
            </Card>
          </div>

          {/* Row 2: Commodity Procurement & DBT Settlement breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commodity-wise procurement table */}
            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Commodity-Wise Procurement Volume & Value
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Calculated dynamically from approved weighbridge slips
              </p>

              {analytics.commodityProcurement.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No procurement records processed yet today.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {analytics.commodityProcurement.map((comm) => (
                    <div key={comm.name} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{comm.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {comm.quintals.toLocaleString()} Quintals
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-emerald-800">
                          ₹{comm.valueInr.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* DBT Payment Status Breakdown */}
            <Card className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900">DBT Bank Payout Reconciliations</h3>
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Direct Benefit Transfer settlement status across banks
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Total Payable Amount
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                    ₹{analytics.paymentStatusBreakdown.totalAmountInr.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Credited
                    </span>
                    <span className="text-base font-black font-mono text-emerald-800 mt-1 block">
                      {analytics.paymentStatusBreakdown.credited}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      Processing
                    </span>
                    <span className="text-base font-black font-mono text-amber-800 mt-1 block">
                      {analytics.paymentStatusBreakdown.processing}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">
                      Pending
                    </span>
                    <span className="text-base font-black font-mono text-slate-700 mt-1 block">
                      {analytics.paymentStatusBreakdown.pending}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center mt-4">
                Payments reconciled in real-time through Public Financial Management System (PFMS)
              </p>
            </Card>
          </div>

          {/* Row 3: Centre Performance Yard Table */}
          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Procurement Centre Real-Time Performance
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time bookings, tonnage, and queue bottlenecks by Mandi yard
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Centre Name</th>
                    <th className="py-2.5 px-3">Today's Bookings</th>
                    <th className="py-2.5 px-3">Active Queue</th>
                    <th className="py-2.5 px-3">Procured (Qtl)</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {analytics.centrePerformance.map((cp) => (
                    <tr key={cp.centreId} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">{cp.centreName}</td>
                      <td className="py-3 px-3 font-mono">{cp.todayBookings}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono font-bold ${
                            cp.currentQueue > 10 ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {cp.currentQueue} vehicles
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                        {cp.todayProcuredQuintals} Qtl
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cp.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cp.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: CENTRES */}
      {activeTab === 'centres' && (
        <CentreManagementTab
          centres={centres}
          onAddCentre={handleAddCentre}
          onToggleStatus={handleToggleCentreStatus}
        />
      )}

      {/* TAB CONTENT: COMMODITIES */}
      {activeTab === 'commodities' && (
        <CommodityManagerTab
          commodities={commodities}
          onUpdateMsp={handleUpdateMsp}
          onAddCommodity={handleAddCommodity}
        />
      )}

      {/* TAB CONTENT: BOOKINGS */}
      {activeTab === 'bookings' && (
        <AllBookingsLedgerTab bookings={bookings} />
      )}
    </div>
  )
}

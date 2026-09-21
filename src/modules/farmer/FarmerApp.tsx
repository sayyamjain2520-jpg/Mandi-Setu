import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { Booking, QueueEntry, Commodity, TimeSlot, ProcurementRecord } from '@/types/procurement.types'
import type { ProcurementCentre } from '@/types/mandi.types'
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav'
import type { FarmerTab } from '@/components/layout/FarmerBottomNav'
import { FarmerHome } from '@/modules/farmer/pages/FarmerHome'
import { CentreDiscovery } from '@/modules/farmer/pages/CentreDiscovery'
import { SlotBookingWizard } from '@/modules/farmer/pages/SlotBookingWizard'
import { MyTokensView } from '@/modules/farmer/pages/MyTokensView'
import { FarmerPayments } from '@/modules/farmer/pages/FarmerPayments'

export const FarmerApp: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<FarmerTab>('home')
  const [centres, setCentres] = useState<ProcurementCentre[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [procurementRecords, setProcurementRecords] = useState<ProcurementRecord[]>([])
  const [preselectedCentreId, setPreselectedCentreId] = useState<string | undefined>()

  const loadData = useCallback(async () => {
    const [c, comm, s, b, q, p] = await Promise.all([
      api.getCentres(),
      api.getCommodities(),
      api.getSlots(),
      api.getBookings(user?.id),
      api.getQueue(),
      api.getProcurementRecords(user?.id),
    ])
    setCentres(c)
    setCommodities(comm)
    setSlots(s)
    setBookings(b)
    setQueueEntries(q)
    setProcurementRecords(p)
  }, [user?.id])

  useEffect(() => {
    loadData()
    const unsubscribe = api.subscribe(() => {
      loadData()
    })
    return () => unsubscribe()
  }, [loadData])

  const activeBooking = bookings.find((b) => b.status !== 'completed' && b.status !== 'cancelled')
  const activeQueue = queueEntries.find((q) => q.bookingId === activeBooking?.id)

  const handleSelectCentreFromList = (centreId: string) => {
    setPreselectedCentreId(centreId)
    setActiveTab('book')
  }

  const handleBookingSuccess = (_newBooking: Booking) => {
    loadData()
    setActiveTab('tokens')
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'home' && (
          <FarmerHome
            onNavigate={setActiveTab}
            activeBooking={activeBooking}
            activeQueue={activeQueue}
            commodities={commodities}
          />
        )}

        {activeTab === 'mandis' && (
          <CentreDiscovery
            centres={centres}
            onSelectCentre={handleSelectCentreFromList}
          />
        )}

        {activeTab === 'book' && (
          <SlotBookingWizard
            centres={centres}
            commodities={commodities}
            slots={slots}
            preselectedCentreId={preselectedCentreId}
            onBookingSuccess={handleBookingSuccess}
            onCancel={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'tokens' && (
          <MyTokensView
            bookings={bookings}
            queueEntries={queueEntries}
            onBookNewSlot={() => setActiveTab('book')}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'payments' && (
          <FarmerPayments records={procurementRecords} />
        )}
      </main>

      {/* Mobile-first bottom navigation bar */}
      <FarmerBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasActiveToken={!!activeBooking}
      />
    </div>
  )
}

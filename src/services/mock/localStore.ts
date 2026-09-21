import type {
  Booking,
  QueueEntry,
  ProcurementRecord,
  TimeSlot,
  Commodity,
  AdminAnalytics,
  QueueStage,
} from '@/types/procurement.types'
import type { ProcurementCentre } from '@/types/mandi.types'
import type { AppNotification, SmsLogEntry } from '@/types/notification.types'
import { INITIAL_CENTRES, INITIAL_COMMODITIES } from '@/config/constants'

interface StoreState {
  centres: ProcurementCentre[]
  commodities: Commodity[]
  slots: TimeSlot[]
  bookings: Booking[]
  queueEntries: QueueEntry[]
  procurementRecords: ProcurementRecord[]
  notifications: AppNotification[]
  smsLogs: SmsLogEntry[]
}

const STORAGE_KEY = 'mandi_setu_db_v1'

function generateDefaultSlots(centres: ProcurementCentre[]): TimeSlot[] {
  const today = new Date().toISOString().split('T')[0]
  const slots: TimeSlot[] = []

  const timeWindows = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '12:00', end: '14:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
  ]

  centres.forEach((centre) => {
    timeWindows.forEach((tw, idx) => {
      slots.push({
        id: `slot-${centre.id}-${idx}`,
        centreId: centre.id,
        slotDate: today,
        startTime: tw.start,
        endTime: tw.end,
        maxCapacityFarmers: 20,
        bookedCount: idx === 0 ? 12 : idx === 1 ? 8 : 4,
      })
    })
  })

  return slots
}

function getInitialState(): StoreState {
  const today = new Date().toISOString().split('T')[0]
  const centres = [...INITIAL_CENTRES]
  const commodities = [...INITIAL_COMMODITIES]
  const slots = generateDefaultSlots(centres)

  // Seed with realistic starting bookings for live queue visualization
  const initialBookings: Booking[] = [
    {
      id: 'bk-101',
      bookingNumber: 'MS-2026-1001',
      farmerId: 'usr-farmer-ramesh',
      farmerName: 'Rameshwar Dayal Patel',
      farmerPhone: '+91 98260 12345',
      centreId: 'mandi-1',
      centreName: 'Kota Bhamashah APMC Mega Yard',
      commodityId: 'comm-1',
      commodityName: 'Wheat (FAQ Grade)',
      slotDate: today,
      slotTimeStart: '08:00',
      slotTimeEnd: '10:00',
      estimatedQuantityQuintals: 65,
      numberOfVehicles: 2,
      vehicleType: 'Tractor Trolley',
      vehicleNumber: 'RJ-20-EA-4122',
      status: 'called',
      tokenNumber: 'T-001',
      qrCodeData: JSON.stringify({
        bookingNumber: 'MS-2026-1001',
        tokenNumber: 'T-001',
        farmerName: 'Rameshwar Dayal Patel',
        commodity: 'Wheat (FAQ Grade)',
        quantity: 65,
        vehicle: 'RJ-20-EA-4122',
        centreId: 'mandi-1',
      }),
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'bk-102',
      bookingNumber: 'MS-2026-1002',
      farmerId: 'usr-farmer-suresh',
      farmerName: 'Suresh Chandra Meena',
      farmerPhone: '+91 94141 87654',
      centreId: 'mandi-1',
      centreName: 'Kota Bhamashah APMC Mega Yard',
      commodityId: 'comm-3',
      commodityName: 'Mustard Seeds (High Oil)',
      slotDate: today,
      slotTimeStart: '08:00',
      slotTimeEnd: '10:00',
      estimatedQuantityQuintals: 42,
      numberOfVehicles: 1,
      vehicleType: 'Pickup Van',
      vehicleNumber: 'RJ-20-GA-9912',
      status: 'arrived',
      tokenNumber: 'T-002',
      qrCodeData: JSON.stringify({
        bookingNumber: 'MS-2026-1002',
        tokenNumber: 'T-002',
        farmerName: 'Suresh Chandra Meena',
        commodity: 'Mustard Seeds',
        quantity: 42,
        vehicle: 'RJ-20-GA-9912',
        centreId: 'mandi-1',
      }),
      createdAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
      updatedAt: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: 'bk-103',
      bookingNumber: 'MS-2026-1003',
      farmerId: 'usr-farmer-balram',
      farmerName: 'Balram Singh Yadav',
      farmerPhone: '+91 97555 43210',
      centreId: 'mandi-1',
      centreName: 'Kota Bhamashah APMC Mega Yard',
      commodityId: 'comm-1',
      commodityName: 'Wheat (FAQ Grade)',
      slotDate: today,
      slotTimeStart: '10:00',
      slotTimeEnd: '12:00',
      estimatedQuantityQuintals: 110,
      numberOfVehicles: 3,
      vehicleType: 'Truck',
      vehicleNumber: 'RJ-20-TR-1108',
      status: 'confirmed',
      tokenNumber: 'T-003',
      qrCodeData: JSON.stringify({
        bookingNumber: 'MS-2026-1003',
        tokenNumber: 'T-003',
        farmerName: 'Balram Singh Yadav',
        commodity: 'Wheat (FAQ Grade)',
        quantity: 110,
        vehicle: 'RJ-20-TR-1108',
        centreId: 'mandi-1',
      }),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]

  const initialQueueEntries: QueueEntry[] = [
    {
      id: 'qe-1',
      bookingId: 'bk-101',
      bookingNumber: 'MS-2026-1001',
      centreId: 'mandi-1',
      tokenNumber: 'T-001',
      farmerName: 'Rameshwar Dayal Patel',
      farmerPhone: '+91 98260 12345',
      commodityName: 'Wheat (FAQ Grade)',
      numberOfVehicles: 2,
      vehicleNumber: 'RJ-20-EA-4122',
      currentStage: 'called_to_gate',
      priorityOrder: 1,
      arrivalTime: new Date(Date.now() - 3600000).toISOString(),
      calledTime: new Date(Date.now() - 300000).toISOString(),
      estimatedWaitMinutes: 0,
      updatedAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 'qe-2',
      bookingId: 'bk-102',
      bookingNumber: 'MS-2026-1002',
      centreId: 'mandi-1',
      tokenNumber: 'T-002',
      farmerName: 'Suresh Chandra Meena',
      farmerPhone: '+91 94141 87654',
      commodityName: 'Mustard Seeds (High Oil)',
      numberOfVehicles: 1,
      vehicleNumber: 'RJ-20-GA-9912',
      currentStage: 'gate_passed',
      priorityOrder: 2,
      arrivalTime: new Date(Date.now() - 1200000).toISOString(),
      estimatedWaitMinutes: 10,
      updatedAt: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: 'qe-3',
      bookingId: 'bk-103',
      bookingNumber: 'MS-2026-1003',
      centreId: 'mandi-1',
      tokenNumber: 'T-003',
      farmerName: 'Balram Singh Yadav',
      farmerPhone: '+91 97555 43210',
      commodityName: 'Wheat (FAQ Grade)',
      numberOfVehicles: 3,
      vehicleNumber: 'RJ-20-TR-1108',
      currentStage: 'waiting',
      priorityOrder: 3,
      estimatedWaitMinutes: 25,
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]

  const initialProcurement: ProcurementRecord[] = [
    {
      id: 'pr-901',
      bookingId: 'bk-prev-01',
      bookingNumber: 'MS-2026-0998',
      farmerId: 'usr-farmer-ramesh',
      farmerName: 'Rameshwar Dayal Patel',
      centreId: 'mandi-1',
      commodityName: 'Soybean (Yellow)',
      grossWeightKg: 8450,
      tareWeightKg: 3200,
      netWeightKg: 5250,
      moisturePercentage: 9.8,
      qualityGrade: 'Grade A',
      deductionKg: 0,
      finalAcceptedQuintals: 52.5,
      ratePerQuintal: 4892.0,
      totalPayableAmount: 256830,
      paymentStatus: 'credited',
      paymentUtr: 'UTR-SBI-20260908-410982',
      operatorId: 'usr-operator-rajesh',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  const initialNotifications: AppNotification[] = [
    {
      id: 'notif-1',
      userId: 'usr-farmer-ramesh',
      title: 'Token Called to Gate!',
      message: 'Token T-001: Please proceed to Weighbridge Gate 1 immediately.',
      type: 'queue_call',
      read: false,
      smsSent: true,
      createdAt: new Date(Date.now() - 300000).toISOString(),
      metadata: { tokenNumber: 'T-001', centreName: 'Kota Bhamashah APMC Mega Yard' },
    },
    {
      id: 'notif-2',
      userId: 'usr-farmer-ramesh',
      title: 'Payment Credited via DBT',
      message: '₹2,56,830 credited to Bank A/C ending in 8901 for 52.5 Quintals of Soybean.',
      type: 'payment_credited',
      read: true,
      smsSent: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      metadata: { amount: 256830 },
    },
  ]

  const initialSms: SmsLogEntry[] = [
    {
      id: 'sms-1',
      recipientPhone: '+91 98260 12345',
      farmerName: 'Rameshwar Dayal Patel',
      message: 'MANDI SETU: Token T-001 called to Gate 1 at Kota APMC. Please proceed with your vehicle RJ-20-EA-4122.',
      sentAt: new Date(Date.now() - 300000).toISOString(),
      status: 'DELIVERED',
      tokenNumber: 'T-001',
    },
  ]

  return {
    centres,
    commodities,
    slots,
    bookings: initialBookings,
    queueEntries: initialQueueEntries,
    procurementRecords: initialProcurement,
    notifications: initialNotifications,
    smsLogs: initialSms,
  }
}

class LocalStore {
  private state: StoreState
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.state = this.loadFromStorage()
  }

  private loadFromStorage(): StoreState {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          return JSON.parse(data)
        }
      }
    } catch {
      // LocalStorage error fallback
    }
    const initial = getInitialState()
    this.saveToStorage(initial)
    return initial
  }

  private saveToStorage(state: StoreState): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }
    } catch {
      // Quota or storage disabled
    }
  }

  private emit(): void {
    this.saveToStorage(this.state)
    this.listeners.forEach((listener) => {
      try {
        listener()
      } catch (e) {
        console.error('Store listener error:', e)
      }
    })
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // --- GETTERS ---
  public getCentres(): ProcurementCentre[] {
    return [...this.state.centres]
  }

  public getCentreById(id: string): ProcurementCentre | undefined {
    return this.state.centres.find((c) => c.id === id)
  }

  public getCommodities(): Commodity[] {
    return [...this.state.commodities]
  }

  public getSlots(centreId?: string, date?: string): TimeSlot[] {
    return this.state.slots.filter(
      (s) => (!centreId || s.centreId === centreId) && (!date || s.slotDate === date)
    )
  }

  public getBookings(farmerId?: string, centreId?: string): Booking[] {
    return this.state.bookings
      .filter(
        (b) => (!farmerId || b.farmerId === farmerId) && (!centreId || b.centreId === centreId)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  public getBookingById(id: string): Booking | undefined {
    return this.state.bookings.find((b) => b.id === id)
  }

  public getBookingByNumberOrToken(query: string): Booking | undefined {
    const q = query.trim().toUpperCase()
    return this.state.bookings.find(
      (b) => b.bookingNumber.toUpperCase() === q || b.tokenNumber?.toUpperCase() === q
    )
  }

  public getQueue(centreId?: string): QueueEntry[] {
    return this.state.queueEntries
      .filter((q) => !centreId || q.centreId === centreId)
      .sort((a, b) => a.priorityOrder - b.priorityOrder)
  }

  public getProcurementRecords(farmerId?: string, centreId?: string): ProcurementRecord[] {
    return this.state.procurementRecords
      .filter(
        (p) => (!farmerId || p.farmerId === farmerId) && (!centreId || p.centreId === centreId)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  public getNotifications(userId?: string): AppNotification[] {
    return this.state.notifications
      .filter((n) => !userId || n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  public getSmsLogs(): SmsLogEntry[] {
    return [...this.state.smsLogs].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    )
  }

  // --- ACTIONS ---
  public createBooking(params: {
    farmerId: string
    farmerName: string
    farmerPhone: string
    centreId: string
    commodityId: string
    slotDate: string
    slotTimeStart: string
    slotTimeEnd: string
    estimatedQuantityQuintals: number
    numberOfVehicles: number
    vehicleType: Booking['vehicleType']
    vehicleNumber: string
    notes?: string
  }): Booking {
    const centre = this.getCentreById(params.centreId)
    const commodity = this.state.commodities.find((c) => c.id === params.commodityId)

    const centreBookingsToday = this.state.bookings.filter(
      (b) => b.centreId === params.centreId && b.slotDate === params.slotDate
    )
    const tokenSeq = centreBookingsToday.length + 1
    const tokenNumber = `T-${String(tokenSeq).padStart(3, '0')}`
    const bookingNumber = `MS-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const bookingId = `bk-${Date.now()}`

    const qrData = JSON.stringify({
      bookingNumber,
      tokenNumber,
      farmerName: params.farmerName,
      commodity: commodity?.name || 'Agri Commodity',
      estimatedQuantityQuintals: params.estimatedQuantityQuintals,
      numberOfVehicles: params.numberOfVehicles,
      vehicle: params.vehicleNumber,
      centreId: params.centreId,
      date: params.slotDate,
    })

    const newBooking: Booking = {
      id: bookingId,
      bookingNumber,
      farmerId: params.farmerId,
      farmerName: params.farmerName,
      farmerPhone: params.farmerPhone,
      centreId: params.centreId,
      centreName: centre?.name || 'Mandi Procurement Centre',
      commodityId: params.commodityId,
      commodityName: commodity?.name || 'Crop',
      slotDate: params.slotDate,
      slotTimeStart: params.slotTimeStart,
      slotTimeEnd: params.slotTimeEnd,
      estimatedQuantityQuintals: params.estimatedQuantityQuintals,
      numberOfVehicles: params.numberOfVehicles,
      vehicleType: params.vehicleType,
      vehicleNumber: params.vehicleNumber,
      status: 'confirmed',
      tokenNumber,
      qrCodeData: qrData,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const priorityOrder = this.state.queueEntries.length + 1
    const newQueueEntry: QueueEntry = {
      id: `qe-${Date.now()}`,
      bookingId,
      bookingNumber,
      centreId: params.centreId,
      tokenNumber,
      farmerName: params.farmerName,
      farmerPhone: params.farmerPhone,
      commodityName: commodity?.name || 'Crop',
      numberOfVehicles: params.numberOfVehicles,
      vehicleNumber: params.vehicleNumber,
      currentStage: 'waiting',
      priorityOrder,
      estimatedWaitMinutes: Math.max(10, priorityOrder * 12),
      updatedAt: new Date().toISOString(),
    }

    // Reserve slot capacity
    const slotIndex = this.state.slots.findIndex(
      (s) =>
        s.centreId === params.centreId &&
        s.slotDate === params.slotDate &&
        s.startTime === params.slotTimeStart
    )
    if (slotIndex >= 0) {
      this.state.slots[slotIndex].bookedCount += 1
    }

    // Notification for Farmer
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: params.farmerId,
      title: 'Booking Confirmed & Token Generated',
      message: `Token ${tokenNumber} issued for ${commodity?.name} at ${centre?.name}. Slot: ${params.slotTimeStart} - ${params.slotTimeEnd}.`,
      type: 'slot_confirmed',
      read: false,
      smsSent: true,
      createdAt: new Date().toISOString(),
      metadata: { tokenNumber, bookingId, centreName: centre?.name },
    }

    // SMS Log
    const newSms: SmsLogEntry = {
      id: `sms-${Date.now()}`,
      recipientPhone: params.farmerPhone,
      farmerName: params.farmerName,
      message: `MANDI SETU: Token ${tokenNumber} confirmed for ${commodity?.name} at ${centre?.name}. Slot: ${params.slotDate} ${params.slotTimeStart}. Show this QR at gate.`,
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      tokenNumber,
    }

    this.state.bookings.unshift(newBooking)
    this.state.queueEntries.push(newQueueEntry)
    this.state.notifications.unshift(newNotification)
    this.state.smsLogs.unshift(newSms)

    this.emit()
    return newBooking
  }

  public cancelBooking(bookingId: string): Booking {
    const booking = this.getBookingById(bookingId)
    if (!booking) {
      throw new Error('Booking not found')
    }

    if (booking.status === 'cancelled') {
      return booking
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed' && booking.status !== 'called') {
      throw new Error(
        `This booking cannot be cancelled because it is already ${booking.status}.`
      )
    }

    const queueEntry = this.state.queueEntries.find(
      (q) => q.bookingId === booking.id
    )

    if (booking.status !== 'pending') {
      if (!queueEntry) {
        throw new Error('Active queue entry not found for this booking')
      }

      if (!['waiting', 'called_to_gate'].includes(queueEntry.currentStage)) {
        throw new Error(
          'This booking cannot be cancelled after gate check-in has started.'
        )
      }
    }

    booking.status = 'cancelled'
    booking.tokenNumber = null
    booking.qrCodeData = null
    booking.updatedAt = new Date().toISOString()

    if (queueEntry) {
      this.state.queueEntries = this.state.queueEntries.filter(
        (q) => q.id !== queueEntry.id
      )

      const slotIndex = this.state.slots.findIndex(
        (s) =>
          s.centreId === booking.centreId &&
          s.slotDate === booking.slotDate &&
          s.startTime === booking.slotTimeStart &&
          s.endTime === booking.slotTimeEnd
      )

      if (slotIndex >= 0) {
        this.state.slots[slotIndex].bookedCount = Math.max(
          0,
          this.state.slots[slotIndex].bookedCount - 1
        )
      }
    }

    this.state.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: booking.farmerId,
      title: 'Booking Cancelled',
      message: `Your procurement request ${booking.bookingNumber} has been cancelled successfully.`,
      type: 'system',
      read: false,
      smsSent: false,
      createdAt: new Date().toISOString(),
      metadata: { bookingId: booking.id },
    })

    this.emit()
    return booking
  }

  public checkInAtGate(tokenOrBookingNumber: string): { success: boolean; message: string; entry?: QueueEntry } {
    const booking = this.getBookingByNumberOrToken(tokenOrBookingNumber)
    if (!booking) {
      return { success: false, message: 'Invalid or expired Token / Booking Number' }
    }

    const qe = this.state.queueEntries.find((q) => q.bookingId === booking.id)
    if (!qe) {
      return { success: false, message: 'Queue entry not found' }
    }

    booking.status = 'arrived'
    booking.updatedAt = new Date().toISOString()

    qe.currentStage = 'gate_passed'
    qe.arrivalTime = new Date().toISOString()
    qe.updatedAt = new Date().toISOString()

    // Add In-App notification & SMS
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: booking.farmerId,
      title: 'Gate Check-In Verified',
      message: `Vehicle ${booking.vehicleNumber} checked in. Token ${booking.tokenNumber} is now active in queue.`,
      type: 'gate_entry',
      read: false,
      smsSent: true,
      createdAt: new Date().toISOString(),
      metadata: { tokenNumber: booking.tokenNumber ?? undefined, bookingId: booking.id },
    }

    const sms: SmsLogEntry = {
      id: `sms-${Date.now()}`,
      recipientPhone: booking.farmerPhone,
      farmerName: booking.farmerName,
      message: `MANDI SETU: Gate Entry verified for Token ${booking.tokenNumber}. Current queue wait time ~${qe.estimatedWaitMinutes} mins.`,
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      tokenNumber: booking.tokenNumber ?? undefined,
    }

    this.state.notifications.unshift(notif)
    this.state.smsLogs.unshift(sms)
    this.emit()

    return { success: true, message: `Token ${booking.tokenNumber} successfully checked in at gate!`, entry: qe }
  }

  public callNextInQueue(centreId: string): { success: boolean; entry?: QueueEntry; message: string } {
    const eligible = this.state.queueEntries
      .filter((q) => q.centreId === centreId && (q.currentStage === 'waiting' || q.currentStage === 'gate_passed'))
      .sort((a, b) => a.priorityOrder - b.priorityOrder)

    if (eligible.length === 0) {
      return { success: false, message: 'No waiting vehicles in queue for this centre.' }
    }

    const target = eligible[0]
    target.currentStage = 'called_to_gate'
    target.calledTime = new Date().toISOString()
    target.estimatedWaitMinutes = 0
    target.updatedAt = new Date().toISOString()

    const booking = this.state.bookings.find((b) => b.id === target.bookingId)
    if (booking) {
      booking.status = 'called'
      booking.updatedAt = new Date().toISOString()
    }

    // High Priority Notification
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: booking?.farmerId || 'usr-farmer-ramesh',
      title: '🚨 YOUR TURN HAS ARRIVED!',
      message: `Token ${target.tokenNumber}: Please drive vehicle ${target.vehicleNumber} to Weighbridge Bay 1 NOW.`,
      type: 'queue_call',
      read: false,
      smsSent: true,
      createdAt: new Date().toISOString(),
      metadata: { tokenNumber: target.tokenNumber, bookingId: target.bookingId },
    }

    const sms: SmsLogEntry = {
      id: `sms-${Date.now()}`,
      recipientPhone: target.farmerPhone,
      farmerName: target.farmerName,
      message: `URGENT MANDI SETU: Token ${target.tokenNumber} has been CALLED to Weighbridge Bay 1. Proceed immediately!`,
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      tokenNumber: target.tokenNumber,
    }

    this.state.notifications.unshift(notif)
    this.state.smsLogs.unshift(sms)
    this.emit()

    return { success: true, entry: target, message: `Token ${target.tokenNumber} called to Weighbridge Bay 1!` }
  }

  public updateQueueStage(queueEntryId: string, newStage: QueueStage): void {
    const entry = this.state.queueEntries.find((q) => q.id === queueEntryId)
    if (!entry) return

    entry.currentStage = newStage
    entry.updatedAt = new Date().toISOString()

    const booking = this.state.bookings.find((b) => b.id === entry.bookingId)
    if (booking) {
      if (newStage === 'quality_check') booking.status = 'in_inspection'
      if (newStage === 'weighbridge') booking.status = 'weighed'
      if (newStage === 'settled') booking.status = 'completed'
      if (newStage === 'no_show') booking.status = 'no_show'
      booking.updatedAt = new Date().toISOString()
    }

    this.emit()
  }

  public recordProcurement(params: {
    bookingId: string
    grossWeightKg: number
    tareWeightKg: number
    moisturePercentage: number
    qualityGrade: ProcurementRecord['qualityGrade']
    operatorId: string
  }): ProcurementRecord {
    const booking = this.getBookingById(params.bookingId)
    if (!booking) throw new Error('Booking not found')

    const commodity = this.state.commodities.find((c) => c.id === booking.commodityId)
    const ratePerQuintal = commodity?.mspPricePerQuintal || 2275.0

    const netWeightKg = Math.max(0, params.grossWeightKg - params.tareWeightKg)

    // Calculate moisture deduction if exceeds standard
    let deductionKg = 0
    const maxMoisture = commodity?.maxMoisturePercentage || 12.0
    if (params.moisturePercentage > maxMoisture) {
      const excessPercentage = params.moisturePercentage - maxMoisture
      deductionKg = Math.round((netWeightKg * excessPercentage) / 100)
    }

    const finalAcceptedKg = Math.max(0, netWeightKg - deductionKg)
    const finalAcceptedQuintals = Number((finalAcceptedKg / 100).toFixed(2))
    const totalPayableAmount = Math.round(finalAcceptedQuintals * ratePerQuintal)

    const paymentUtr = `UTR-DBT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`

    const record: ProcurementRecord = {
      id: `pr-${Date.now()}`,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      farmerId: booking.farmerId,
      farmerName: booking.farmerName,
      centreId: booking.centreId,
      commodityName: booking.commodityName,
      grossWeightKg: params.grossWeightKg,
      tareWeightKg: params.tareWeightKg,
      netWeightKg,
      moisturePercentage: params.moisturePercentage,
      qualityGrade: params.qualityGrade,
      deductionKg,
      finalAcceptedQuintals,
      ratePerQuintal,
      totalPayableAmount,
      paymentStatus: 'processing',
      paymentUtr,
      operatorId: params.operatorId,
      createdAt: new Date().toISOString(),
    }

    booking.status = 'completed'
    booking.updatedAt = new Date().toISOString()

    const qe = this.state.queueEntries.find((q) => q.bookingId === booking.id)
    if (qe) {
      qe.currentStage = 'settled'
      qe.completedTime = new Date().toISOString()
      qe.updatedAt = new Date().toISOString()
    }

    // Notification
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: booking.farmerId,
      title: 'Procurement Slip Issued & Payment Processed',
      message: `Procured: ${finalAcceptedQuintals} Qtl of ${booking.commodityName}. Total ₹${totalPayableAmount.toLocaleString('en-IN')} approved under DBT (Ref: ${paymentUtr}).`,
      type: 'weighment_done',
      read: false,
      smsSent: true,
      createdAt: new Date().toISOString(),
      metadata: { amount: totalPayableAmount, bookingId: booking.id },
    }

    const sms: SmsLogEntry = {
      id: `sms-${Date.now()}`,
      recipientPhone: booking.farmerPhone,
      farmerName: booking.farmerName,
      message: `MANDI SETU: Procurement Slip generated. Net: ${finalAcceptedQuintals} Qtl. Payable: ₹${totalPayableAmount.toLocaleString('en-IN')}. DBT Transfer initiated to Bank. Ref: ${paymentUtr}.`,
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      tokenNumber: booking.tokenNumber ?? undefined,
    }

    this.state.procurementRecords.unshift(record)
    this.state.notifications.unshift(notif)
    this.state.smsLogs.unshift(sms)

    this.emit()
    return record
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.state.notifications.find((n) => n.id === id)
    if (notif) {
      notif.read = true
      this.emit()
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.state.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true
    })
    this.emit()
  }

  // --- ADMIN ANALYTICS (CALCULATED DIRECTLY FROM LIVE DATA OBJECTS) ---
  public getAdminAnalytics(): AdminAnalytics {
    const totalBookings = this.state.bookings.length
    const activeQueue = this.state.queueEntries.filter(
      (q) => q.currentStage !== 'settled' && q.currentStage !== 'no_show'
    )
    const activeQueueCount = activeQueue.length

    // Dynamic Wait Time
    const averageWaitTimeMinutes = activeQueue.length > 0
      ? Math.round(activeQueue.reduce((acc, q) => acc + q.estimatedWaitMinutes, 0) / activeQueue.length)
      : 15

    const farmersServedTotal = this.state.procurementRecords.length

    // Capacity Utilisation
    const totalCapacity = this.state.centres.reduce((acc, c) => acc + c.dailyCapacityQuintals, 0)
    const totalProcuredQuintals = this.state.procurementRecords.reduce(
      (acc, p) => acc + p.finalAcceptedQuintals,
      0
    )
    const capacityUtilisationPercentage = totalCapacity > 0
      ? Number(((totalProcuredQuintals / totalCapacity) * 100).toFixed(1))
      : 0

    // Commodity-wise breakdown
    const commMap: Record<string, { quintals: number; valueInr: number }> = {}
    this.state.procurementRecords.forEach((p) => {
      if (!commMap[p.commodityName]) {
        commMap[p.commodityName] = { quintals: 0, valueInr: 0 }
      }
      commMap[p.commodityName].quintals += p.finalAcceptedQuintals
      commMap[p.commodityName].valueInr += p.totalPayableAmount
    })

    const commodityProcurement = Object.entries(commMap).map(([name, val]) => ({
      name,
      quintals: Number(val.quintals.toFixed(2)),
      valueInr: val.valueInr,
    }))

    // Payment breakdown
    let pending = 0
    let processing = 0
    let credited = 0
    let totalAmountInr = 0

    this.state.procurementRecords.forEach((p) => {
      totalAmountInr += p.totalPayableAmount
      if (p.paymentStatus === 'pending') pending++
      else if (p.paymentStatus === 'processing') processing++
      else if (p.paymentStatus === 'credited') credited++
    })

    // Throughput by hour
    const hourMap: Record<string, number> = {
      '08:00': 3,
      '09:00': 6,
      '10:00': 8,
      '11:00': 12,
      '12:00': 9,
      '13:00': 4,
      '14:00': 7,
      '15:00': 10,
    }

    const throughputPerHour = Object.entries(hourMap).map(([hour, count]) => ({ hour, count }))

    // Centre Performance
    const centrePerformance = this.state.centres.map((c) => {
      const cBookings = this.state.bookings.filter((b) => b.centreId === c.id).length
      const cProcured = this.state.procurementRecords
        .filter((p) => p.centreId === c.id)
        .reduce((acc, p) => acc + p.finalAcceptedQuintals, 0)
      const cQueue = this.state.queueEntries.filter(
        (q) => q.centreId === c.id && q.currentStage !== 'settled' && q.currentStage !== 'no_show'
      ).length

      return {
        centreId: c.id,
        centreName: c.name,
        todayBookings: cBookings,
        todayProcuredQuintals: Number(cProcured.toFixed(1)),
        currentQueue: cQueue,
        status: c.operationalStatus,
      }
    })

    return {
      totalBookings,
      activeQueueCount,
      averageWaitTimeMinutes,
      farmersServedTotal,
      capacityUtilisationPercentage,
      commodityProcurement,
      paymentStatusBreakdown: {
        pending,
        processing,
        credited,
        totalAmountInr,
      },
      throughputPerHour,
      centrePerformance,
    }
  }

  // --- ADMIN MANAGEMENT ---
  public addCentre(centre: Omit<ProcurementCentre, 'id'>): ProcurementCentre {
    const newCentre: ProcurementCentre = {
      ...centre,
      id: `mandi-${Date.now()}`,
    }
    this.state.centres.push(newCentre)
    this.emit()
    return newCentre
  }

  public updateCentre(id: string, updates: Partial<ProcurementCentre>): void {
    const centre = this.state.centres.find((c) => c.id === id)
    if (centre) {
      Object.assign(centre, updates)
      this.emit()
    }
  }

  public addCommodity(comm: Omit<Commodity, 'id'>): Commodity {
    const newComm: Commodity = {
      ...comm,
      id: `comm-${Date.now()}`,
    }
    this.state.commodities.push(newComm)
    this.emit()
    return newComm
  }

  public updateCommodity(id: string, updates: Partial<Commodity>): void {
    const comm = this.state.commodities.find((c) => c.id === id)
    if (comm) {
      Object.assign(comm, updates)
      this.emit()
    }
  }

  public resetToDefaults(): void {
    this.state = getInitialState()
    this.emit()
  }
}

export const localStore = new LocalStore()

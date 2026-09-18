import { isSupabaseConfigured, supabase } from '@/config/supabase'
import { localStore } from '@/services/mock/localStore'
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

export interface IDataService {
  isCloudMode(): boolean
  getCentres(): Promise<ProcurementCentre[]>
  getCentreById(id: string): Promise<ProcurementCentre | undefined>
  getCommodities(): Promise<Commodity[]>
  getSlots(centreId?: string, date?: string): Promise<TimeSlot[]>
  getBookings(farmerId?: string, centreId?: string): Promise<Booking[]>
  getBookingById(id: string): Promise<Booking | undefined>
  getBookingByNumberOrToken(query: string): Promise<Booking | undefined>
  createBooking(params: {
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
  }): Promise<Booking>
    acceptBooking(bookingId: string): Promise<Booking>
  rejectBooking(bookingId: string): Promise<void>
  getQueue(centreId?: string): Promise<QueueEntry[]>
  calculateSmartWaitTime(params: {
    centreId: string
    farmersAhead: number
    numberOfVehicles?: number
  }): Promise<{
    estimatedWaitMinutes: number
    congestionLevel: 'low' | 'medium' | 'high'
    averageProcessingMinutes: number
    activeProcessingCapacity: number
  }>
  checkInAtGate(tokenOrBookingNumber: string): Promise<{ success: boolean; message: string; entry?: QueueEntry }>
  callNextInQueue(centreId: string): Promise<{ success: boolean; entry?: QueueEntry; message: string }>
  updateQueueStage(queueId: string, stage: QueueStage): Promise<void>
  completeUnloading(bookingId: string): Promise<void>
  recordProcurement(params: {
    bookingId: string
    grossWeightKg: number
    tareWeightKg: number
    moisturePercentage: number
    qualityGrade: ProcurementRecord['qualityGrade']
    operatorId: string
  }): Promise<ProcurementRecord>
  getProcurementRecords(farmerId?: string, centreId?: string): Promise<ProcurementRecord[]>
  getNotifications(userId?: string): Promise<AppNotification[]>
  markNotificationAsRead(id: string): Promise<void>
  markAllNotificationsAsRead(userId: string): Promise<void>
  getSmsLogs(): Promise<SmsLogEntry[]>
  getAdminAnalytics(): Promise<AdminAnalytics>
  addCentre(centre: Omit<ProcurementCentre, 'id'>): Promise<ProcurementCentre>
  updateCentre(id: string, updates: Partial<ProcurementCentre>): Promise<void>
  addCommodity(comm: Omit<Commodity, 'id'>): Promise<Commodity>
  updateCommodity(id: string, updates: Partial<Commodity>): Promise<void>
  subscribe(callback: () => void): () => void
}

class DataService implements IDataService {
  public isCloudMode(): boolean {
    return isSupabaseConfigured()
  }
  
  public subscribe(callback: () => void): () => void {
  const client = supabase

  if (!this.isCloudMode() || !client) {
    return () => {}
  }
  const channelName = `mandi_changes_${Date.now()}`

  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_entries',
      },
      () => callback()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
      },
      () => callback()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'procurement_records',
      },
      () => callback()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
      },
      () => callback()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'time_slots',
      },
      () => callback()
    )

  channel.subscribe((status) => {
    console.log('Mandi Realtime:', status)
  })

  return () => {
    client.removeChannel(channel)
  }
}
  public async getCentres(): Promise<ProcurementCentre[]> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const { data, error } = await client
        .from('procurement_centres')
        .select('*')
        .order('name', { ascending: true })
      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          state: d.state,
          district: d.district,
          address: d.address,
          latitude: Number(d.latitude) || 0,
          longitude: Number(d.longitude) || 0,
          contactPhone: d.contact_phone || '',
          operationalStatus: d.operational_status,
          dailyCapacityQuintals: Number(d.daily_capacity_quintals) || 5000,
          operatingHours: d.operating_hours || { open: d.open_time || '08:00', close: d.close_time || '18:00' },
          avgWaitTimeMinutes: 20,
        }))
      }
    }
    if (this.isCloudMode() && supabase) return []
    return localStore.getCentres()
  }

  public async getCentreById(id: string): Promise<ProcurementCentre | undefined> {
    const centres = await this.getCentres()
    return centres.find((c) => c.id === id)
  }

  public async getCommodities(): Promise<Commodity[]> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const { data, error } = await client
        .from('commodities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      if (!error && data && data.length > 0) {
        return data.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          category: c.category,
          variety: c.variety || '',
          mspPricePerQuintal: Number(c.msp_price_per_quintal),
          maxMoisturePercentage: Number(c.max_moisture_percentage) || 12,
          unit: c.unit || 'Quintal',
          isActive: c.is_active,
        }))
      }
    }
    if (this.isCloudMode() && supabase) return []
    return localStore.getCommodities()
  }

  public async getSlots(centreId?: string, date?: string): Promise<TimeSlot[]> {
    const client = supabase
    if (this.isCloudMode() && client) {
      let query = client.from('time_slots').select('*')
      if (centreId) query = query.eq('centre_id', centreId)
      if (date) query = query.eq('slot_date', date)
      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data.map((s) => ({
          id: s.id,
          centreId: s.centre_id,
          slotDate: s.slot_date,
          startTime: s.start_time,
          endTime: s.end_time,
          maxCapacityFarmers: s.max_capacity_farmers,
          bookedCount: s.booked_count,
        }))
      }
    }
    if (this.isCloudMode() && supabase) return []
    return localStore.getSlots(centreId, date)
  }

  public async getBookings(farmerId?: string, centreId?: string): Promise<Booking[]> {
    const client = supabase

    if (this.isCloudMode() && client) {
      let query = client
        .from('bookings')
        .select(`
          *,
          profiles:profiles!bookings_farmer_id_fkey(full_name, phone_number),
          procurement_centres:procurement_centres!bookings_centre_id_fkey(name),
          commodities:commodities!bookings_commodity_id_fkey(name)
        `)

      if (farmerId) query = query.eq('farmer_id', farmerId)
      if (centreId) query = query.eq('centre_id', centreId)

      const { data, error } = await query.order('created_at', { ascending: false })

      console.log('BOOKINGS QUERY RESULT:', {
  centreId,
  data,
  error,
  count: data?.length,
})

      if (error) {
  console.error('BOOKINGS SUPABASE ERROR:', error)
  throw new Error(`Failed to load bookings: ${error.message}`)
}

      if (!data || data.length === 0) return []

      return data.map((b) => ({
        id: b.id,
        bookingNumber: b.booking_number,
        farmerId: b.farmer_id,
        farmerName: b.profiles?.full_name || 'Farmer',
        farmerPhone: b.profiles?.phone_number || '',
        centreId: b.centre_id,
        centreName: b.procurement_centres?.name || 'Mandi Yard',
        commodityId: b.commodity_id,
        commodityName: b.commodities?.name || 'Crop',
        slotDate: b.slot_date,
        slotTimeStart: b.slot_time_start,
        slotTimeEnd: b.slot_time_end,
        estimatedQuantityQuintals: Number(b.estimated_quantity_quintals) || 0,
        numberOfVehicles: Number(b.number_of_vehicles),
        vehicleType: b.vehicle_type,
        vehicleNumber: b.vehicle_number,
        status: b.status,
        tokenNumber: b.token_number,
        qrCodeData: b.qr_code_data,
        notes: b.notes,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      }))
    }

    return localStore.getBookings(farmerId, centreId)
  }

      public async getBookingById(id: string): Promise<Booking | undefined> {
    const client = supabase

    if (this.isCloudMode() && client) {

      const { data: sessionData } = await client.auth.getSession()

      console.log(
        'OPERATOR SESSION:',
        sessionData.session?.user?.id,
        sessionData.session?.user?.email
      )

      const { data, error } = await client
        .from('bookings')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('Failed to load booking by ID:', error)
        throw new Error(`Failed to load booking: ${error.message}`)
      }

      if (!data) {
        console.error('Booking not found for ID:', id)
        return undefined
      }

      return {
        id: data.id,
        bookingNumber: data.booking_number,
        farmerId: data.farmer_id,
        farmerName: 'Farmer',
        farmerPhone: '',
        centreId: data.centre_id,
        centreName: 'Procurement Centre',
        commodityId: data.commodity_id,
        commodityName: 'Crop',
        slotDate: data.slot_date,
        slotTimeStart: data.slot_time_start,
        slotTimeEnd: data.slot_time_end,
        estimatedQuantityQuintals: Number(data.estimated_quantity_quintals) || 0,
        numberOfVehicles: Number(data.number_of_vehicles),
        vehicleType: data.vehicle_type,
        vehicleNumber: data.vehicle_number,
        status: data.status,
        tokenNumber: data.token_number,
        qrCodeData: data.qr_code_data,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    }

    return localStore.getBookingById(id)
  }

  public async getBookingByNumberOrToken(query: string): Promise<Booking | undefined> {
    if (this.isCloudMode() && supabase) {
      const q = query.trim().toUpperCase()
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .or(`booking_number.eq.${q},token_number.eq.${q}`)
        .maybeSingle()
      if (data) {
        return {
          id: data.id,
          bookingNumber: data.booking_number,
          farmerId: data.farmer_id,
          farmerName: 'Farmer',
          farmerPhone: '',
          centreId: data.centre_id,
          centreName: 'Procurement Centre',
          commodityId: data.commodity_id,
          commodityName: 'Crop',
          slotDate: data.slot_date,
          slotTimeStart: data.slot_time_start,
          slotTimeEnd: data.slot_time_end,
          estimatedQuantityQuintals: Number(data.estimated_quantity_quintals) || 0,
          numberOfVehicles: Number(data.number_of_vehicles),
          vehicleType: data.vehicle_type,
          vehicleNumber: data.vehicle_number,
          status: data.status,
          tokenNumber: data.token_number,
          qrCodeData: data.qr_code_data,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
      }
    }
    if (this.isCloudMode() && supabase) return undefined
    return localStore.getBookingByNumberOrToken(query)
  }

    public async createBooking(params: {
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
}): Promise<Booking> {
    const client = supabase

    if (this.isCloudMode() && client) {

      // 1. Verify that the selected time slot exists
      const { data: slotData, error: slotFetchError } = await client
        .from('time_slots')
        .select('id')
        .eq('centre_id', params.centreId)
        .eq('slot_date', params.slotDate)
        .eq('start_time', params.slotTimeStart)
        .eq('end_time', params.slotTimeEnd)
        .maybeSingle()

      if (slotFetchError || !slotData) {
        console.error(
          'Failed to find selected time slot:',
          slotFetchError
        )

        throw new Error(
          'Selected time slot not found. Please select another slot.'
        )
      }

      // 2. Generate booking number
      // Token will be generated only after operator accepts.
      const bookingNumber =
        `MS-2026-${Math.floor(1000 + Math.random() * 9000)}`

      // 3. Create booking request as PENDING
      // No token, no QR, no queue and no slot capacity update.
      const { data: bookingData, error: bErr } = await client
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          farmer_id: params.farmerId,
          centre_id: params.centreId,
          commodity_id: params.commodityId,
          slot_date: params.slotDate,
          slot_time_start: params.slotTimeStart,
          slot_time_end: params.slotTimeEnd,

          // Farmer-entered estimated quantity
          estimated_quantity_quintals: params.estimatedQuantityQuintals,

          // Actual vehicle count
          number_of_vehicles: params.numberOfVehicles,

          vehicle_type: params.vehicleType,
          vehicle_number: params.vehicleNumber,

          // IMPORTANT: Operator must accept first
          status: 'pending',

          // Generated only after operator acceptance
          token_number: null,
          qr_code_data: null,

          notes: params.notes,
        })
        .select()
        .single()

      if (bErr || !bookingData) {
        console.error(
          'Failed to create booking request:',
          bErr
        )

        throw new Error(
          bErr?.message ||
          'Failed to create booking request in Supabase'
        )
      }

      // 4. Return pending booking
      return {
        id: bookingData.id,
        bookingNumber: bookingData.booking_number,
        farmerId: params.farmerId,
        farmerName: params.farmerName,
        farmerPhone: params.farmerPhone,
        centreId: params.centreId,
        centreName: 'Procurement Centre',
        commodityId: params.commodityId,
        commodityName: 'Crop',
        slotDate: params.slotDate,
        slotTimeStart: params.slotTimeStart,
        slotTimeEnd: params.slotTimeEnd,
        estimatedQuantityQuintals:
          Number(bookingData.estimated_quantity_quintals) || 0,
        numberOfVehicles: Number(bookingData.number_of_vehicles),
        vehicleType: bookingData.vehicle_type,
        vehicleNumber: bookingData.vehicle_number,
        status: 'pending',
        tokenNumber: null,
        qrCodeData: null,
        notes: bookingData.notes,
        createdAt: bookingData.created_at,
        updatedAt: bookingData.updated_at,
      }
    }

    // Local mode compatibility
    return localStore.createBooking({
      ...params,
    })
  }
    public async acceptBooking(bookingId: string): Promise<Booking> {
    const client = supabase

    if (this.isCloudMode() && client) {

      // 1. Get the pending booking
      const { data: booking, error: bookingFetchError } = await client
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle()

      if (bookingFetchError || !booking) {
        throw new Error(
          bookingFetchError?.message || 'Booking request not found'
        )
      }

      // 2. Only PENDING bookings can be accepted
      if (booking.status !== 'pending') {
        throw new Error(
          `This booking cannot be accepted because its status is "${booking.status}".`
        )
      }

      // 3. Find the selected time slot
      const { data: slotData, error: slotError } = await client
        .from('time_slots')
        .select('id, booked_count, max_capacity_farmers')
        .eq('centre_id', booking.centre_id)
        .eq('slot_date', booking.slot_date)
        .eq('start_time', booking.slot_time_start)
        .eq('end_time', booking.slot_time_end)
        .maybeSingle()

      if (slotError || !slotData) {
        throw new Error(
          slotError?.message || 'Selected time slot not found'
        )
      }

      // 4. Check slot capacity before accepting
      if (
        Number(slotData.booked_count) >=
        Number(slotData.max_capacity_farmers)
      ) {
        throw new Error(
          'Selected time slot is full. Cannot accept this booking.'
        )
      }

      // 5. Generate token only NOW — after operator acceptance
      const { count: confirmedCount, error: countError } = await client
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('centre_id', booking.centre_id)
        .eq('slot_date', booking.slot_date)
        .not('status', 'in', '(pending,rejected,cancelled)')

      if (countError) {
        console.error(
          'Failed to calculate token sequence:',
          countError
        )
      }

      const tokenSeq = (confirmedCount || 0) + 1
      const tokenNumber = `T-${String(tokenSeq).padStart(3, '0')}`

      // 6. Generate QR only NOW
      // Keep the QR payload intentionally short and scanner-friendly.
      // The operator scanner only needs the booking number; it then fetches
      // the authoritative booking record from Supabase.
      const qrData = booking.booking_number

      // 7. Accept the booking
      const { data: updatedBooking, error: bookingUpdateError } =
        await client
          .from('bookings')
          .update({
            status: 'confirmed',
            token_number: tokenNumber,
            qr_code_data: qrData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id)
          .eq('status', 'pending')
          .select()
          .single()

      if (bookingUpdateError || !updatedBooking) {
        throw new Error(
          bookingUpdateError?.message ||
          'Failed to accept booking request'
        )
      }

      // 8. Reserve one slot capacity
      const { error: slotUpdateError } = await client.rpc(
        'change_slot_booked_count',
        {
          p_slot_id: slotData.id,
          p_delta: 1,
        }
      )

      if (slotUpdateError) {
        // Roll booking back to pending if capacity update fails
        await client
          .from('bookings')
          .update({
            status: 'pending',
            token_number: null,
            qr_code_data: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id)

        throw new Error(
          `Failed to reserve slot capacity: ${slotUpdateError.message}`
        )
      }

      // 9. Calculate queue position
      const { count: queueCount, error: queueCountError } =
        await client
          .from('queue_entries')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('centre_id', booking.centre_id)
          .in('current_stage', [
            'waiting',
            'gate_passed',
            'called_to_gate',
          ])

      if (queueCountError) {
        console.error(
          'Failed to calculate queue position:',
          queueCountError
        )
      }

      const priorityOrder = (queueCount || 0) + 1

      // Smart Arrival Engine replaces the old hard-coded
      // priorityOrder * 12 calculation.
      const smartWait = await this.calculateSmartWaitTime({
        centreId: booking.centre_id,
        farmersAhead: queueCount || 0,
        numberOfVehicles: Number(booking.number_of_vehicles) || 1,
      })

      const estimatedWaitMinutes =
        smartWait.estimatedWaitMinutes

      // 10. Create queue entry
      const { error: queueInsertError } = await client
        .from('queue_entries')
        .insert({
          booking_id: booking.id,
          centre_id: booking.centre_id,
          token_number: tokenNumber,
          current_stage: 'waiting',
          priority_order: priorityOrder,
          estimated_wait_minutes: estimatedWaitMinutes,
        })

      if (queueInsertError) {

        // Rollback booking
        await client
          .from('bookings')
          .update({
            status: 'pending',
            token_number: null,
            qr_code_data: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id)

        // Rollback slot capacity
        await client.rpc(
          'change_slot_booked_count',
          {
            p_slot_id: slotData.id,
            p_delta: -1,
          }
        )

        throw new Error(
          `Failed to create queue entry: ${queueInsertError.message}`
        )
      }

      // 11. Notify farmer
      const { error: notificationError } = await client
        .from('notifications')
        .insert({
          user_id: booking.farmer_id,
          title: 'Booking Request Accepted',
          message:
            `Your procurement request ${booking.booking_number} has been accepted. Token ${tokenNumber} is now active.`,
          type: 'slot_confirmed',
          read: false,
          sms_sent: true,
        })

      if (notificationError) {
        console.error(
          'Acceptance notification failed:',
          notificationError
        )
      }

      // 12. Return accepted booking
      return {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.booking_number,
        farmerId: updatedBooking.farmer_id,
        farmerName: 'Farmer',
        farmerPhone: '',
        centreId: updatedBooking.centre_id,
        centreName: 'Procurement Centre',
        commodityId: updatedBooking.commodity_id,
        commodityName: 'Crop',
        slotDate: updatedBooking.slot_date,
        slotTimeStart: updatedBooking.slot_time_start,
        slotTimeEnd: updatedBooking.slot_time_end,
        estimatedQuantityQuintals: Number(updatedBooking.estimated_quantity_quintals) || 0,
        numberOfVehicles: Number(
          updatedBooking.number_of_vehicles
        ),
        vehicleType: updatedBooking.vehicle_type,
        vehicleNumber: updatedBooking.vehicle_number,
        status: 'confirmed',
        tokenNumber: updatedBooking.token_number,
        qrCodeData: updatedBooking.qr_code_data,
        notes: updatedBooking.notes,
        createdAt: updatedBooking.created_at,
        updatedAt: updatedBooking.updated_at,
      }
    }

    // Local mode
    const booking = await localStore.getBookingById(bookingId)

    if (!booking) {
      throw new Error('Booking request not found')
    }

    if (booking.status !== 'pending') {
      throw new Error(
        `This booking cannot be accepted because its status is "${booking.status}".`
      )
    }

    return booking
  }

  public async rejectBooking(bookingId: string): Promise<void> {
    const client = supabase

    if (this.isCloudMode() && client) {
      const { data: booking, error: fetchError } = await client
        .from('bookings')
        .select('id, farmer_id, status, booking_number')
        .eq('id', bookingId)
        .maybeSingle()

      if (fetchError || !booking) {
        throw new Error(
          fetchError?.message || 'Booking request not found'
        )
      }

      if (booking.status !== 'pending') {
        throw new Error(
          `This booking cannot be rejected because its status is "${booking.status}".`
        )
      }

      const { data: updatedBooking, error: updateError } = await client
        .from('bookings')
        .update({
          status: 'rejected',
          token_number: null,
          qr_code_data: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('status', 'pending')
        .select('id, status')
        .maybeSingle()

      if (updateError) {
        throw new Error(
          `Failed to reject booking: ${updateError.message}`
        )
      }

      if (!updatedBooking) {
        throw new Error(
          'Booking was already processed by another operator.'
        )
      }

      const { error: notificationError } = await client
        .from('notifications')
        .insert({
          user_id: booking.farmer_id,
          title: 'Booking Request Rejected',
          message:
            `Your procurement request ${booking.booking_number} has been rejected by the operator.`,
          type: 'booking_request',
          read: false,
          sms_sent: false,
        })

      if (notificationError) {
        console.error(
          'Rejection notification failed:',
          notificationError
        )
      }

      return
    }

    // Local mode compatibility
    return
  }

  /**
   * Smart Arrival Engine
   *
   * Uses live queue data + completed queue history to estimate waiting time.
   * No fake/random wait values are used.
   *
   * Formula:
   *   estimated wait =
   *   farmers ahead × average processing time × vehicle factor
   *   ÷ active processing capacity
   *
   * Historical processing time is calculated from:
   *   arrival_time → completed_time
   *
   * When there is not enough history, the engine uses a conservative
   * 8-minute baseline until real centre data becomes available.
   */
  public async calculateSmartWaitTime(params: {
    centreId: string
    farmersAhead: number
    numberOfVehicles?: number
  }): Promise<{
    estimatedWaitMinutes: number
    congestionLevel: 'low' | 'medium' | 'high'
    averageProcessingMinutes: number
    activeProcessingCapacity: number
  }> {
    const client = supabase

    const safeFarmersAhead = Math.max(
      0,
      Number(params.farmersAhead) || 0
    )

    const safeVehicles = Math.max(
      1,
      Math.min(Number(params.numberOfVehicles) || 1, 3)
    )

    // Conservative fallback while a centre builds real processing history.
    let averageProcessingMinutes = 8
    let activeProcessingCapacity = 1

    if (this.isCloudMode() && client) {
      // Read recent completed queue entries so the estimate learns from
      // actual centre operations.
      const { data: completedEntries, error: historyError } = await client
        .from('queue_entries')
        .select('arrival_time, completed_time')
        .eq('centre_id', params.centreId)
        .not('arrival_time', 'is', null)
        .not('completed_time', 'is', null)
        .order('completed_time', { ascending: false })
        .limit(50)

      if (historyError) {
        console.warn(
          'Smart Arrival: unable to load processing history:',
          historyError.message
        )
      }

      if (completedEntries && completedEntries.length > 0) {
        const durations = completedEntries
          .map((entry) => {
            const arrival = new Date(entry.arrival_time).getTime()
            const completed = new Date(entry.completed_time).getTime()

            if (
              !Number.isFinite(arrival) ||
              !Number.isFinite(completed) ||
              completed <= arrival
            ) {
              return null
            }

            const minutes = (completed - arrival) / 60000

            // Ignore obviously bad/stale measurements.
            return minutes > 0 && minutes <= 180
              ? minutes
              : null
          })
          .filter(
            (minutes): minutes is number =>
              minutes !== null
          )

        if (durations.length > 0) {
          averageProcessingMinutes = Math.max(
            1,
            Math.round(
              durations.reduce(
                (sum, minutes) => sum + minutes,
                0
              ) / durations.length
            )
          )
        }
      }

      // Estimate currently active processing capacity from the live queue.
      // At least one processing lane is assumed so the system remains
      // conservative instead of promising an unrealistically short wait.
      const { count: activeProcessors, error: processorError } =
        await client
          .from('queue_entries')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('centre_id', params.centreId)
          .eq('current_stage', 'called_to_gate')

      if (processorError) {
        console.warn(
          'Smart Arrival: unable to read active processors:',
          processorError.message
        )
      } else {
        activeProcessingCapacity = Math.max(
          1,
          Math.min(activeProcessors || 1, 3)
        )
      }
    }

    // A multi-vehicle booking normally takes more handling time than a
    // single-vehicle arrival, but the factor is intentionally capped.
    const vehicleFactor =
      safeVehicles === 1
        ? 1
        : safeVehicles === 2
          ? 1.35
          : 1.7

    const estimatedWaitMinutes = Math.max(
      0,
      Math.ceil(
        (safeFarmersAhead *
          averageProcessingMinutes *
          vehicleFactor) /
          activeProcessingCapacity
      )
    )

    let congestionLevel: 'low' | 'medium' | 'high' = 'low'

    if (estimatedWaitMinutes >= 60 || safeFarmersAhead >= 15) {
      congestionLevel = 'high'
    } else if (
      estimatedWaitMinutes >= 30 ||
      safeFarmersAhead >= 8
    ) {
      congestionLevel = 'medium'
    }

    return {
      estimatedWaitMinutes,
      congestionLevel,
      averageProcessingMinutes,
      activeProcessingCapacity,
    }
  }

  public async getQueue(centreId?: string): Promise<QueueEntry[]> {
  const client = supabase

  if (this.isCloudMode() && client) {
    let query = client
      .from('queue_entries')
      .select(
        '*, bookings:bookings!queue_entries_booking_id_fkey(*, profiles:profiles!bookings_farmer_id_fkey(full_name, phone_number), commodities:commodities!bookings_commodity_id_fkey(name))'
      )

    if (centreId) {
      query = query.eq('centre_id', centreId)
    }

    const { data, error } = await query.order('priority_order', {
      ascending: true,
    })

    // IMPORTANT:
    // In Supabase/cloud mode, NEVER fall back to local demo data.
    if (error) {
      console.error('Failed to load queue from Supabase:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((q) => ({
      id: q.id,
      bookingId: q.booking_id,
      bookingNumber: q.bookings?.booking_number || '',
      centreId: q.centre_id,
      tokenNumber: q.token_number,
      farmerName: q.bookings?.profiles?.full_name || 'Farmer',
      farmerPhone: q.bookings?.profiles?.phone_number || '',
      commodityName: q.bookings?.commodities?.name || 'Grain',
      numberOfVehicles: Number(q.bookings?.number_of_vehicles) || 1,
      vehicleNumber: q.bookings?.vehicle_number || '',
      currentStage: q.current_stage,
      priorityOrder: q.priority_order,
      arrivalTime: q.arrival_time,
      calledTime: q.called_time,
      completedTime: q.completed_time,
      estimatedWaitMinutes: q.estimated_wait_minutes,
      updatedAt: q.updated_at,
    }))
  }

  // Only use demo/local data when Supabase is NOT configured.
  return localStore.getQueue(centreId)
}
  public async checkInAtGate(tokenOrBookingNumber: string): Promise<{ success: boolean; message: string; entry?: QueueEntry }> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const q = tokenOrBookingNumber.trim().toUpperCase()
      const { data: booking } = await client
        .from('bookings')
        .select('*, profiles:profiles!bookings_farmer_id_fkey(full_name, phone_number)')
        .or(`booking_number.eq.${q},token_number.eq.${q}`)
        .maybeSingle()

      if (!booking) {
        return { success: false, message: 'Invalid or expired Token / Booking Number' }
      }

      await client
        .from('bookings')
        .update({ status: 'arrived', updated_at: new Date().toISOString() })
        .eq('id', booking.id)

      const { data: qe } = await client
        .from('queue_entries')
        .update({
          current_stage: 'gate_passed',
          arrival_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', booking.id)
        .select()
        .single()

      // Notification
      await client.from('notifications').insert({
        user_id: booking.farmer_id,
        title: 'Gate Check-In Verified',
        message: `Vehicle ${booking.vehicle_number} checked in. Token ${booking.token_number} is active in queue.`,
        type: 'gate_entry',
        read: false,
        sms_sent: true,
      })

      return {
        success: true,
        message: `Token ${booking.token_number} successfully checked in at gate!`,
        entry: qe
          ? {
              id: qe.id,
              bookingId: booking.id,
              bookingNumber: booking.booking_number,
              centreId: booking.centre_id,
              tokenNumber: booking.token_number,
              farmerName: booking.profiles?.full_name || 'Farmer',
              farmerPhone: booking.profiles?.phone_number || '',
              commodityName: 'Agri Crop',
              numberOfVehicles: Number(booking.number_of_vehicles),
              vehicleNumber: booking.vehicle_number,
              currentStage: 'gate_passed',
              priorityOrder: qe.priority_order,
              arrivalTime: qe.arrival_time,
              estimatedWaitMinutes: qe.estimated_wait_minutes,
              updatedAt: qe.updated_at,
            }
          : undefined,
      }
    }

    return localStore.checkInAtGate(tokenOrBookingNumber)
  }

  /**
   * Enforce FIFO processing for a mandi queue.
   *
   * A later token can move into an active processing stage only when there
   * is no earlier active token. A token explicitly marked `no_show` is an
   * allowed exception and is therefore ignored as a blocker.
   */
  private async assertFifoOrder(
    centreId: string,
    targetQueueId: string
  ): Promise<void> {
    const client = supabase

    if (!this.isCloudMode() || !client) {
      return
    }

    const { data: target, error: targetError } = await client
      .from('queue_entries')
      .select('id, centre_id, priority_order, current_stage, token_number')
      .eq('id', targetQueueId)
      .single()

    if (targetError || !target) {
      throw new Error(targetError?.message || 'Queue entry not found')
    }

    if (target.centre_id !== centreId) {
      throw new Error('Queue entry does not belong to this mandi')
    }

    // Settled and No Show entries do not need FIFO protection.
    if (
      target.current_stage === 'settled' ||
      target.current_stage === 'no_show'
    ) {
      return
    }

    const { data: blockers, error: blockerError } = await client
      .from('queue_entries')
      .select('id, token_number, priority_order, current_stage')
      .eq('centre_id', centreId)
      .lt('priority_order', target.priority_order)
      .not('current_stage', 'in', '(settled,no_show)')
      .order('priority_order', { ascending: true })
      .limit(1)

    if (blockerError) {
      throw new Error(
        `Unable to verify FIFO queue order: ${blockerError.message}`
      )
    }

    if (blockers && blockers.length > 0) {
      const blocker = blockers[0]
      throw new Error(
        `FIFO queue rule: Token ${blocker.token_number} must be completed or marked No Show before Token ${target.token_number} can proceed.`
      )
    }
  }

  public async callNextInQueue(centreId: string): Promise<{ success: boolean; entry?: QueueEntry; message: string }> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const { data: eligible } = await client
        .from('queue_entries')
        .select('*, bookings(*, profiles:profiles!bookings_farmer_id_fkey(full_name, phone_number))')
        .eq('centre_id', centreId)
        .eq('current_stage', 'waiting')
        .order('priority_order', { ascending: true })
        .limit(1)

      if (!eligible || eligible.length === 0) {
        return { success: false, message: 'No waiting vehicles in queue for this centre.' }
      }

      const target = eligible[0]
     const { error: queueUpdateError } = await client
  .from('queue_entries')
  .update({
    current_stage: 'called_to_gate',
    called_time: new Date().toISOString(),
    estimated_wait_minutes: 0,
    updated_at: new Date().toISOString(),
  })
  .eq('id', target.id)

if (queueUpdateError) {
  console.error(
    'Failed to call farmer to gate:',
    queueUpdateError
  )

  throw new Error(
    `Failed to call farmer to gate: ${queueUpdateError.message}`
  )
}

      const { error: bookingUpdateError } = await client
  .from('bookings')
  .update({
    status: 'called',
    updated_at: new Date().toISOString(),
  })
  .eq('id', target.booking_id)

if (bookingUpdateError) {
  console.error(
    'Failed to update booking status:',
    bookingUpdateError
  )

  throw new Error(
    `Failed to update booking status: ${bookingUpdateError.message}`
  )
}

      // Urgent Notification
      await client.from('notifications').insert({
        user_id: target.bookings?.farmer_id,
        title: '🚨 YOUR TURN HAS ARRIVED!',
        message: `Token ${target.token_number}: Drive vehicle ${target.bookings?.vehicle_number} to Weighbridge Bay 1 NOW.`,
        type: 'queue_call',
        read: false,
        sms_sent: true,
      })

      return {
        success: true,
        message: `Token ${target.token_number} called to Weighbridge Bay 1!`,
        entry: {
          id: target.id,
          bookingId: target.booking_id,
          bookingNumber: target.bookings?.booking_number,
          centreId: target.centre_id,
          tokenNumber: target.token_number,
          farmerName: target.bookings?.profiles?.full_name || 'Farmer',
          farmerPhone: target.bookings?.profiles?.phone_number || '',
          commodityName: 'Grain',
          numberOfVehicles: Number(target.bookings?.number_of_vehicles),
          vehicleNumber: target.bookings?.vehicle_number,
          currentStage: 'called_to_gate',
          priorityOrder: target.priority_order,
          calledTime: new Date().toISOString(),
          estimatedWaitMinutes: 0,
          updatedAt: new Date().toISOString(),
        },
      }
    }

    return localStore.callNextInQueue(centreId)
  }

  public async updateQueueStage(queueId: string, stage: QueueStage): Promise<void> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const { data: currentEntry, error: currentEntryError } = await client
        .from('queue_entries')
        .select('id, centre_id, current_stage')
        .eq('id', queueId)
        .single()

      if (currentEntryError || !currentEntry) {
        throw new Error(
          currentEntryError?.message || 'Queue entry not found'
        )
      }

      // No Show is an explicit FIFO exception. Waiting is also allowed
      // because it does not advance the farmer through the workflow.
      if (
        stage !== 'waiting' &&
        stage !== 'no_show' &&
        stage !== currentEntry.current_stage
      ) {
        await this.assertFifoOrder(
          currentEntry.centre_id,
          queueId
        )
      }

      const { error } = await client
        .from('queue_entries')
        .update({ current_stage: stage, updated_at: new Date().toISOString() })
        .eq('id', queueId)

      if (error) throw new Error(error.message)
      return
    }
    localStore.updateQueueStage(queueId, stage)
  }

  public async recordProcurement(params: {
    bookingId: string
    grossWeightKg: number
    tareWeightKg: number
    moisturePercentage: number
    qualityGrade: ProcurementRecord['qualityGrade']
    operatorId: string
  }): Promise<ProcurementRecord> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const { data: booking } = await client
        .from('bookings')
        .select('*, commodities(*), profiles:profiles!bookings_farmer_id_fkey(full_name)')
        .eq('id', params.bookingId)
        .single()

      if (!booking) throw new Error('Booking not found')

      const { data: queueEntry, error: queueEntryError } = await client
        .from('queue_entries')
        .select('id, centre_id')
        .eq('booking_id', params.bookingId)
        .single()

      if (queueEntryError || !queueEntry) {
        throw new Error(
          queueEntryError?.message || 'Queue entry not found'
        )
      }

      await this.assertFifoOrder(
        queueEntry.centre_id,
        queueEntry.id
      )

      const ratePerQuintal = Number(booking.commodities?.msp_price_per_quintal) || 2275.0
      const netWeightKg = Math.max(0, params.grossWeightKg - params.tareWeightKg)
      const maxMoisture = Number(booking.commodities?.max_moisture_percentage) || 12.0
      let deductionKg = 0
      if (params.moisturePercentage > maxMoisture) {
        deductionKg = Math.round((netWeightKg * (params.moisturePercentage - maxMoisture)) / 100)
      }

      const finalAcceptedKg = Math.max(0, netWeightKg - deductionKg)
      const finalAcceptedQuintals = Number((finalAcceptedKg / 100).toFixed(2))
      const totalPayableAmount = Math.round(finalAcceptedQuintals * ratePerQuintal)
      const paymentUtr = `UTR-DBT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`

      const { data: rec, error } = await client
        .from('procurement_records')
        .insert({
          booking_id: booking.id,
          gross_weight_kg: params.grossWeightKg,
          tare_weight_kg: params.tareWeightKg,
          net_weight_kg: netWeightKg,
          moisture_percentage: params.moisturePercentage,
          quality_grade: params.qualityGrade,
          deduction_kg: deductionKg,
          final_accepted_quintals: finalAcceptedQuintals,
          rate_per_quintal: ratePerQuintal,
          total_payable_amount: totalPayableAmount,
          payment_status: 'processing',
          payment_utr: paymentUtr,
          operator_id: params.operatorId,
        })
        .select()
        .single()

      if (error || !rec) throw new Error(error?.message || 'Failed to record weighment in Supabase')

      await client
  .from('bookings')
  .update({ status: 'weighed' })
  .eq('id', booking.id)

await client
  .from('queue_entries')
  .update({
    current_stage: 'unloading',
    updated_at: new Date().toISOString(),
  })
  .eq('booking_id', booking.id)

      await client.from('notifications').insert({
        user_id: booking.farmer_id,
        title: 'Procurement Slip Issued & Payment Processed',
        message: `Procured: ${finalAcceptedQuintals} Qtl. Total ₹${totalPayableAmount.toLocaleString('en-IN')} approved via DBT (Ref: ${paymentUtr}).`,
        type: 'weighment_done',
        read: false,
        sms_sent: true,
      })

      return {
        id: rec.id,
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        farmerId: booking.farmer_id,
        farmerName: booking.profiles?.full_name || 'Farmer',
        centreId: booking.centre_id,
        commodityName: booking.commodities?.name || 'Crop',
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
        createdAt: rec.created_at,
      }
    }

    return localStore.recordProcurement(params)
  }
  public async completeUnloading(bookingId: string): Promise<void> {
    const client = supabase

    if (this.isCloudMode() && client) {
      const { data: booking, error: bookingError } = await client
        .from('bookings')
        .select('id, farmer_id, booking_number')
        .eq('id', bookingId)
        .single()

      if (bookingError || !booking) {
        throw new Error(bookingError?.message || 'Booking not found')
      }

      const { data: queueEntry, error: queueEntryError } = await client
        .from('queue_entries')
        .select('id, centre_id')
        .eq('booking_id', bookingId)
        .single()

      if (queueEntryError || !queueEntry) {
        throw new Error(
          queueEntryError?.message || 'Queue entry not found'
        )
      }

      await this.assertFifoOrder(
        queueEntry.centre_id,
        queueEntry.id
      )

      const { error: recordError } = await client
        .from('procurement_records')
        .update({
          payment_status: 'credited',
        })
        .eq('booking_id', bookingId)

      if (recordError) {
        throw new Error(recordError.message)
      }

      const { error: bookingUpdateError } = await client
        .from('bookings')
        .update({
          status: 'completed',
        })
        .eq('id', bookingId)

      if (bookingUpdateError) {
        throw new Error(bookingUpdateError.message)
      }

      const { error: queueError } = await client
        .from('queue_entries')
        .update({
          current_stage: 'settled',
          completed_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId)

      if (queueError) {
        throw new Error(queueError.message)
      }

      await client.from('notifications').insert({
        user_id: booking.farmer_id,
        title: 'Procurement Completed',
        message: `Your unloading is complete. Booking ${booking.booking_number} has been settled successfully.`,
        type: 'weighment_done',
        read: false,
        sms_sent: true,
      })

      return
    }

    const queueEntries = localStore.getQueue()
    const entry = queueEntries.find((q) => q.bookingId === bookingId)

    if (entry) {
      localStore.updateQueueStage(entry.id, 'settled')
    }
  }
  public async getProcurementRecords(farmerId?: string, centreId?: string): Promise<ProcurementRecord[]> {
    const client = supabase
    if (this.isCloudMode() && client) {
      let query = client
        .from('procurement_records')
        .select('*, bookings:bookings!procurement_records_booking_id_fkey(*, profiles:profiles!bookings_farmer_id_fkey(full_name), commodities:commodities!bookings_commodity_id_fkey(name))')
      if (farmerId) query = query.eq('bookings.farmer_id', farmerId)
      if (centreId) query = query.eq('bookings.centre_id', centreId)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        return data.map((r) => ({
          id: r.id,
          bookingId: r.booking_id,
          bookingNumber: r.bookings?.booking_number || '',
          farmerId: r.bookings?.farmer_id || '',
          farmerName: r.bookings?.profiles?.full_name || 'Farmer',
          centreId: r.bookings?.centre_id || '',
          commodityName: r.bookings?.commodities?.name || 'Crop',
          grossWeightKg: Number(r.gross_weight_kg),
          tareWeightKg: Number(r.tare_weight_kg),
          netWeightKg: Number(r.net_weight_kg),
          moisturePercentage: Number(r.moisture_percentage),
          qualityGrade: r.quality_grade,
          deductionKg: Number(r.deduction_kg),
          finalAcceptedQuintals: Number(r.final_accepted_quintals),
          ratePerQuintal: Number(r.rate_per_quintal),
          totalPayableAmount: Number(r.total_payable_amount),
          paymentStatus: r.payment_status,
          paymentUtr: r.payment_utr,
          operatorId: r.operator_id || '',
          createdAt: r.created_at,
        }))
      }
    }
    if (this.isCloudMode() && supabase) return []
    return localStore.getProcurementRecords(farmerId, centreId)
  }

  public async getNotifications(userId?: string): Promise<AppNotification[]> {
    const client = supabase
    if (this.isCloudMode() && client) {
      let query = client.from('notifications').select('*')
      if (userId) query = query.eq('user_id', userId)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        return data.map((n) => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          smsSent: n.sms_sent,
          createdAt: n.created_at,
        }))
      }
    }
    if (this.isCloudMode() && supabase) return []
    return localStore.getNotifications(userId)
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    const client = supabase
    if (this.isCloudMode() && client) {
      await client.from('notifications').update({ read: true }).eq('id', id)
      return
    }
    localStore.markNotificationAsRead(id)
  }

  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    const client = supabase
    if (this.isCloudMode() && client) {
      await client.from('notifications').update({ read: true }).eq('user_id', userId)
      return
    }
    localStore.markAllNotificationsAsRead(userId)
  }

  public async getSmsLogs(): Promise<SmsLogEntry[]> {
    // SMS provider logs are not stored in the current Supabase schema.
    // Never show demo SMS logs while running in cloud mode.
    if (this.isCloudMode()) return []
    return localStore.getSmsLogs()
  }

  public async getAdminAnalytics(): Promise<AdminAnalytics> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const [bookings, queue, records, centres] = await Promise.all([
        this.getBookings(),
        this.getQueue(),
        this.getProcurementRecords(),
        this.getCentres(),
      ])

      const totalBookings = bookings.length
      const activeQueue = queue.filter((q) => q.currentStage !== 'settled' && q.currentStage !== 'no_show')
      const activeQueueCount = activeQueue.length
      const averageWaitTimeMinutes = activeQueue.length > 0
        ? Math.round(activeQueue.reduce((acc, q) => acc + q.estimatedWaitMinutes, 0) / activeQueue.length)
        : 15
      const farmersServedTotal = records.length
      const totalCapacity = centres.reduce((acc, c) => acc + c.dailyCapacityQuintals, 0)
      const totalProcuredQuintals = records.reduce((acc, p) => acc + p.finalAcceptedQuintals, 0)
      const capacityUtilisationPercentage = totalCapacity > 0
        ? Number(((totalProcuredQuintals / totalCapacity) * 100).toFixed(1))
        : 0

      const commMap: Record<string, { quintals: number; valueInr: number }> = {}
      records.forEach((p) => {
        if (!commMap[p.commodityName]) commMap[p.commodityName] = { quintals: 0, valueInr: 0 }
        commMap[p.commodityName].quintals += p.finalAcceptedQuintals
        commMap[p.commodityName].valueInr += p.totalPayableAmount
      })

      const commodityProcurement = Object.entries(commMap).map(([name, val]) => ({
        name,
        quintals: Number(val.quintals.toFixed(2)),
        valueInr: val.valueInr,
      }))

      let pending = 0
      let processing = 0
      let credited = 0
      let totalAmountInr = 0
      records.forEach((p) => {
        totalAmountInr += p.totalPayableAmount
        if (p.paymentStatus === 'pending') pending++
        else if (p.paymentStatus === 'processing') processing++
        else if (p.paymentStatus === 'credited') credited++
      })

      const hourMap: Record<string, number> = {}
      records.forEach((record) => {
        if (!record.createdAt) return
        const hour = new Date(record.createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        const normalizedHour = `${hour.slice(0, 2)}:00`
        hourMap[normalizedHour] = (hourMap[normalizedHour] || 0) + 1
      })

      const throughputPerHour = Object.entries(hourMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, count]) => ({ hour, count }))

      const centrePerformance = centres.map((c) => {
        const cBookings = bookings.filter((b) => b.centreId === c.id).length
        const cProcured = records.filter((p) => p.centreId === c.id).reduce((acc, p) => acc + p.finalAcceptedQuintals, 0)
        const cQueue = queue.filter((q) => q.centreId === c.id && q.currentStage !== 'settled' && q.currentStage !== 'no_show').length
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
        paymentStatusBreakdown: { pending, processing, credited, totalAmountInr },
        throughputPerHour,
        centrePerformance,
      }
    }

    return localStore.getAdminAnalytics()
  }

  public async addCentre(centre: Omit<ProcurementCentre, 'id'>): Promise<ProcurementCentre> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const { data, error } = await client
        .from('procurement_centres')
        .insert({
          code: centre.code,
          name: centre.name,
          state: centre.state,
          district: centre.district,
          address: centre.address,
          latitude: centre.latitude,
          longitude: centre.longitude,
          contact_phone: centre.contactPhone,
          operational_status: centre.operationalStatus,
          daily_capacity_quintals: centre.dailyCapacityQuintals,
          open_time: centre.operatingHours.open,
          close_time: centre.operatingHours.close,
        })
        .select()
        .single()

      if (error || !data) throw new Error(error?.message || 'Failed to add centre')
      return {
        id: data.id,
        code: data.code,
        name: data.name,
        state: data.state,
        district: data.district,
        address: data.address,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        contactPhone: data.contact_phone,
        operationalStatus: data.operational_status,
        dailyCapacityQuintals: Number(data.daily_capacity_quintals),
        operatingHours: { open: data.open_time, close: data.close_time },
      }
    }
    return localStore.addCentre(centre)
  }

  public async updateCentre(id: string, updates: Partial<ProcurementCentre>): Promise<void> {
    const client = supabase
    if (this.isCloudMode() && client) {
      await client
        .from('procurement_centres')
        .update({
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.operationalStatus ? { operational_status: updates.operationalStatus } : {}),
          ...(updates.dailyCapacityQuintals ? { daily_capacity_quintals: updates.dailyCapacityQuintals } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      return
    }
    localStore.updateCentre(id, updates)
  }

  public async addCommodity(comm: Omit<Commodity, 'id'>): Promise<Commodity> {
    const client = supabase
    if (this.isCloudMode() && client) {
      const { data, error } = await client
        .from('commodities')
        .insert({
          code: comm.code,
          name: comm.name,
          category: comm.category,
          variety: comm.variety,
          msp_price_per_quintal: comm.mspPricePerQuintal,
          max_moisture_percentage: comm.maxMoisturePercentage,
          unit: comm.unit,
          is_active: comm.isActive,
        })
        .select()
        .single()

      if (error || !data) throw new Error(error?.message || 'Failed to add commodity')
      return {
        id: data.id,
        code: data.code,
        name: data.name,
        category: data.category,
        variety: data.variety,
        mspPricePerQuintal: Number(data.msp_price_per_quintal),
        maxMoisturePercentage: Number(data.max_moisture_percentage),
        unit: data.unit,
        isActive: data.is_active,
      }
    }
    return localStore.addCommodity(comm)
  }

  public async updateCommodity(id: string, updates: Partial<Commodity>): Promise<void> {
    const client = supabase
    if (this.isCloudMode() && client) {
      await client
        .from('commodities')
        .update({
          ...(updates.mspPricePerQuintal ? { msp_price_per_quintal: updates.mspPricePerQuintal } : {}),
          ...(updates.maxMoisturePercentage ? { max_moisture_percentage: updates.maxMoisturePercentage } : {}),
        })
        .eq('id', id)
      return
    }
    localStore.updateCommodity(id, updates)
  }
}

export const api = new DataService()

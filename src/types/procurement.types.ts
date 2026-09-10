export interface Commodity {
  id: string
  code: string
  name: string
  category: 'Cereals' | 'Pulses' | 'Oilseeds' | 'Cash Crops' | 'Millets'
  variety: string
  mspPricePerQuintal: number
  maxMoisturePercentage: number
  unit: string
  isActive: boolean
}

export interface TimeSlot {
  id: string
  centreId: string
  slotDate: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  maxCapacityFarmers: number
  bookedCount: number
}

export type BookingStatus =
  | 'confirmed'
  | 'arrived'
  | 'called'
  | 'in_inspection'
  | 'weighed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Booking {
  id: string
  bookingNumber: string // e.g. MS-2026-8910
  farmerId: string
  farmerName: string
  farmerPhone: string
  centreId: string
  centreName: string
  commodityId: string
  commodityName: string
  slotDate: string
  slotTimeStart: string
  slotTimeEnd: string
  estimatedQuantityQuintals: number
  vehicleType: 'Tractor Trolley' | 'Mini Truck' | 'Truck' | 'Bullock Cart' | 'Pickup Van'
  vehicleNumber: string
  status: BookingStatus
  tokenNumber: string // e.g. T-014
  qrCodeData: string // Encoded payload for gate verification
  notes?: string
  createdAt: string
  updatedAt: string
}

export type QueueStage =
  | 'waiting'
  | 'called_to_gate'
  | 'gate_passed'
  | 'quality_check'
  | 'weighbridge'
  | 'unloading'
  | 'settled'
  | 'no_show'

export interface QueueEntry {
  id: string
  bookingId: string
  bookingNumber: string
  centreId: string
  tokenNumber: string
  farmerName: string
  farmerPhone: string
  commodityName: string
  estimatedQuantityQuintals: number
  vehicleNumber: string
  currentStage: QueueStage
  priorityOrder: number
  arrivalTime?: string
  calledTime?: string
  completedTime?: string
  estimatedWaitMinutes: number
  updatedAt: string
}

export interface ProcurementRecord {
  id: string
  bookingId: string
  bookingNumber: string
  farmerId: string
  farmerName: string
  centreId: string
  commodityName: string
  grossWeightKg: number
  tareWeightKg: number
  netWeightKg: number
  moisturePercentage: number
  qualityGrade: 'Grade A' | 'Grade B' | 'Fair Average Quality (FAQ)'
  deductionKg: number
  finalAcceptedQuintals: number
  ratePerQuintal: number
  totalPayableAmount: number
  paymentStatus: 'pending' | 'processing' | 'credited' | 'rejected'
  paymentUtr?: string
  operatorId: string
  createdAt: string
}

export interface AdminAnalytics {
  totalBookings: number
  activeQueueCount: number
  averageWaitTimeMinutes: number
  farmersServedTotal: number
  capacityUtilisationPercentage: number
  commodityProcurement: {
    name: string
    quintals: number
    valueInr: number
  }[]
  paymentStatusBreakdown: {
    pending: number
    processing: number
    credited: number
    totalAmountInr: number
  }
  throughputPerHour: {
    hour: string
    count: number
  }[]
  centrePerformance: {
    centreId: string
    centreName: string
    todayBookings: number
    todayProcuredQuintals: number
    currentQueue: number
    status: 'active' | 'inactive' | 'closed'
  }[]
}

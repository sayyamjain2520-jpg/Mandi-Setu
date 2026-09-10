export type NotificationType =
  | 'queue_call'
  | 'slot_confirmed'
  | 'gate_entry'
  | 'weighment_done'
  | 'payment_credited'
  | 'system'

export interface AppNotification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  smsSent: boolean
  createdAt: string
  metadata?: {
    tokenNumber?: string
    bookingId?: string
    centreName?: string
    amount?: number
    stage?: string
  }
}

export interface SmsLogEntry {
  id: string
  recipientPhone: string
  farmerName: string
  message: string
  sentAt: string
  status: 'DELIVERED' | 'DISPATCHED'
  tokenNumber?: string
}

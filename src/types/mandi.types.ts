export interface ProcurementCentre {
  id: string
  code: string
  name: string
  state: string
  district: string
  address: string
  latitude: number
  longitude: number
  contactPhone: string
  operationalStatus: 'active' | 'inactive' | 'closed'
  dailyCapacityQuintals: number
  operatingHours: {
    open: string
    close: string
  }
  distanceKm?: number
  activeTokensCount?: number
  avgWaitTimeMinutes?: number
}

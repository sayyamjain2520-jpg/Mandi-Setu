export type UserRole = 'farmer' | 'operator' | 'admin'

export interface UserProfile {
  id: string
  role: UserRole
  fullName: string
  phoneNumber: string
  state: string
  district: string
  kisanId?: string // Aadhaar / PM-KISAN / Kisan Credit Card reference
  mandiId?: string // Assigned Mandi ID if role === 'operator'
  createdAt: string
  updatedAt?: string
}

export interface AuthState {
  user: UserProfile | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isLocalMode: boolean
}

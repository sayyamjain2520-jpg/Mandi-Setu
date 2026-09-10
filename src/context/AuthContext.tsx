import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { UserProfile, UserRole } from '@/types/user.types'
import { DEMO_PERSONAS } from '@/config/constants'
import { isSupabaseConfigured, supabase } from '@/config/supabase'

interface AuthContextType {
  user: UserProfile | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  isLocalMode: boolean
  authError: string | null
  switchPersona: (role: UserRole) => void
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, profile: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'mandi_setu_auth_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isCloud = isSupabaseConfigured()
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (!isCloud) {
      try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY)
        if (saved) return JSON.parse(saved)
      } catch {
        // LocalStorage fallback
      }
      return DEMO_PERSONAS.farmer
    }
    return null
  })
  const [isLoading, setIsLoading] = useState<boolean>(isCloud)
  const [authError, setAuthError] = useState<string | null>(null)

  // Fetch user profile from Supabase profiles table
  const fetchSupabaseProfile = useCallback(async (userId: string, userMetadata?: Record<string, unknown>): Promise<UserProfile> => {
    if (!supabase) throw new Error('Supabase client not initialized')
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!error && data) {
      return {
        id: data.id,
        role: data.role as UserRole,
        fullName: data.full_name,
        phoneNumber: data.phone_number,
        state: data.state,
        district: data.district,
        kisanId: data.kisan_id,
        mandiId: data.mandi_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    }

    // Fallback to metadata while trigger settles
    return {
      id: userId,
      role: (userMetadata?.role as UserRole) || 'farmer',
      fullName: (userMetadata?.full_name as string) || 'Mandi User',
      phoneNumber: (userMetadata?.phone_number as string) || '',
      state: (userMetadata?.state as string) || 'Rajasthan',
      district: (userMetadata?.district as string) || 'Kota',
      kisanId: userMetadata?.kisan_id as string,
      mandiId: userMetadata?.mandi_id as string,
      createdAt: new Date().toISOString(),
    }
  }, [])

  // Initialize Session in Cloud Mode
  useEffect(() => {
    const client = supabase
    if (!isCloud || !client) {
      setIsLoading(false)
      return
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          const profile = await fetchSupabaseProfile(session.user.id, session.user.user_metadata)
          setUser(profile)
        } else {
          setUser(null)
        }
      } catch (e) {
        console.error('Session restore error:', e)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchSupabaseProfile(session.user.id, session.user.user_metadata)
        setUser(profile)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isCloud, fetchSupabaseProfile])

  // Save local persona in dev mode
  useEffect(() => {
    if (!isCloud) {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
  }, [user, isCloud])

  const switchPersona = (newRole: UserRole) => {
  const targetPersona = DEMO_PERSONAS[newRole]

  if (!targetPersona) {
    console.error(`No demo persona found for role: ${newRole}`)
    return
  }

  setUser(targetPersona)
}

  const login = async (
    emailOrPhone: string,
    password?: string,
    role?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setAuthError(null)

    try {
      if (isCloud && supabase) {
        if (!password) {
          return { success: false, error: 'Password is required for production login.' }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrPhone.trim(),
          password,
        })

        if (error || !data.user) {
          const errMsg = error?.message || 'Invalid credentials'
          setAuthError(errMsg)
          return { success: false, error: errMsg }
        }

        const profile = await fetchSupabaseProfile(data.user.id, data.user.user_metadata)
        setUser(profile)
        return { success: true }
      }

      // Local Dev Mode Login
      const requestedRole = role || 'farmer'
      if (requestedRole === 'operator') {
        setUser(DEMO_PERSONAS.operator)
      } else if (requestedRole === 'admin') {
        setUser(DEMO_PERSONAS.admin)
      } else {
        setUser({
          ...DEMO_PERSONAS.farmer,
          phoneNumber: emailOrPhone.startsWith('+') ? emailOrPhone : `+91 ${emailOrPhone}`,
        })
      }
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    profileData: Omit<UserProfile, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setAuthError(null)

    try {
      if (isCloud && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: profileData.fullName,
              phone_number: profileData.phoneNumber,
              role: profileData.role,
              state: profileData.state,
              district: profileData.district,
              kisan_id: profileData.kisanId,
              mandi_id: profileData.mandiId,
            },
          },
        })

        if (error || !data.user) {
          const errMsg = error?.message || 'Registration failed'
          setAuthError(errMsg)
          return { success: false, error: errMsg }
        }

        const profile = await fetchSupabaseProfile(data.user.id, data.user.user_metadata)
        setUser(profile)
        return { success: true }
      }

      // Local Dev Mode Sign Up
      const newProfile: UserProfile = {
        ...profileData,
        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      setUser(newProfile)
      return { success: true }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    if (isCloud && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (user) {
      if (isCloud && supabase) {
        await supabase
          .from('profiles')
          .update({
            full_name: updates.fullName,
            phone_number: updates.phoneNumber,
            state: updates.state,
            district: updates.district,
            kisan_id: updates.kisanId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
      setUser({ ...user, ...updates })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        isLocalMode: !isCloud,
        authError,
        switchPersona,
        login,
        signUp,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

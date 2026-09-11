import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
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

  /*
   * Kept only for local development compatibility.
   * In Supabase/cloud mode this NEVER changes the real user role.
   */
  switchPersona: (role: UserRole) => void

  login: (
    email: string,
    password?: string,
    role?: UserRole
  ) => Promise<{ success: boolean; error?: string }>

  signUp: (
    email: string,
    password: string,
    profile: Omit<UserProfile, 'id' | 'createdAt'>
  ) => Promise<{ success: boolean; error?: string }>

  logout: () => Promise<void>

  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'mandi_setu_auth_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isCloud = isSupabaseConfigured()

  const [user, setUser] = useState<UserProfile | null>(() => {
    /*
     * Local/demo mode only.
     */
    if (!isCloud) {
      try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY)

        if (saved) {
          return JSON.parse(saved) as UserProfile
        }
      } catch {
        // Ignore invalid local storage
      }

      return DEMO_PERSONAS.farmer
    }

    /*
     * Cloud mode:
     * Never create a fake/default authenticated user.
     * Supabase session decides authentication.
     */
    return null
  })

  const [isLoading, setIsLoading] = useState<boolean>(isCloud)
  const [authError, setAuthError] = useState<string | null>(null)

  /**
   * Convert Supabase profiles row into our frontend UserProfile type.
   *
   * IMPORTANT:
   * In production/cloud mode the role comes ONLY from public.profiles.
   * We do NOT trust a role supplied by the login form.
   */
  const fetchSupabaseProfile = useCallback(
    async (userId: string): Promise<UserProfile> => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          role,
          full_name,
          phone_number,
          state,
          district,
          kisan_id,
          mandi_id,
          created_at,
          updated_at
        `
        )
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Failed to fetch user profile:', error)
        throw new Error('Unable to load your user profile.')
      }

      if (!data) {
        /*
         * Never fallback to user metadata for role.
         *
         * If profile doesn't exist, we don't know whether the user
         * is farmer/operator/admin, so authentication should not
         * continue into a dashboard.
         */
        throw new Error(
          'Your account profile was not found. Please contact the administrator.'
        )
      }

      const validRoles: UserRole[] = ['farmer', 'operator', 'admin']

      if (!validRoles.includes(data.role as UserRole)) {
        throw new Error(
          'Your account has an invalid role. Please contact the administrator.'
        )
      }

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
    },
    []
  )

  /**
   * Restore existing Supabase session on page refresh.
   */
  useEffect(() => {
    const client = supabase

    if (!isCloud || !client) {
      setIsLoading(false)
      return
    }

    let mounted = true

    const initializeAuth = async () => {
      setIsLoading(true)
      setAuthError(null)

      try {
        const {
          data: { session },
          error,
        } = await client.auth.getSession()

        if (error) {
          throw error
        }

        if (!mounted) return

        if (session?.user) {
          const profile = await fetchSupabaseProfile(session.user.id)

          if (mounted) {
            setUser(profile)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Session restore error:', error)

        if (mounted) {
          setUser(null)
          setAuthError(
            error instanceof Error
              ? error.message
              : 'Unable to restore your session.'
          )
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    /**
     * Listen for:
     * SIGNED_IN
     * SIGNED_OUT
     * TOKEN_REFRESHED
     * USER_UPDATED
     */
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setAuthError(null)
        setIsLoading(false)
        return
      }

      /*
       * Don't show a fake role.
       * Always load the role from public.profiles.
       */
      try {
        setIsLoading(true)

        const profile = await fetchSupabaseProfile(session.user.id)

        if (mounted) {
          setUser(profile)
          setAuthError(null)
        }
      } catch (error) {
        console.error('Auth state profile error:', error)

        if (mounted) {
          setUser(null)
          setAuthError(
            error instanceof Error
              ? error.message
              : 'Unable to load your account profile.'
          )
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [isCloud, fetchSupabaseProfile])

  /**
   * Save local demo persona only when Supabase is NOT configured.
   */
  useEffect(() => {
    if (!isCloud) {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
  }, [user, isCloud])

  /**
   * Local/demo mode persona switching.
   *
   * IMPORTANT:
   * This has NO effect in cloud/production mode.
   */
  const switchPersona = (newRole: UserRole) => {
    if (isCloud) {
      console.warn(
        'switchPersona is disabled in Supabase/cloud mode. User role comes from profiles.role.'
      )
      return
    }

    const targetPersona = DEMO_PERSONAS[newRole]

    if (!targetPersona) {
      console.error(`No demo persona found for role: ${newRole}`)
      return
    }

    setUser(targetPersona)
  }

  /**
   * REAL SUPABASE LOGIN
   *
   * Email + password only.
   *
   * The role parameter is intentionally ignored in cloud mode.
   * Role is loaded from public.profiles after authentication.
   */
  const login = async (
    emailOrPhone: string,
    password?: string,
    role?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setAuthError(null)

    try {
      if (isCloud && supabase) {
        if (!emailOrPhone.trim()) {
          return {
            success: false,
            error: 'Please enter your email address.',
          }
        }

        if (!password) {
          return {
            success: false,
            error: 'Password is required.',
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrPhone.trim().toLowerCase(),
          password,
        })

        if (error || !data.user) {
          const errorMessage =
            error?.message || 'Invalid email or password.'

          setAuthError(errorMessage)

          return {
            success: false,
            error: errorMessage,
          }
        }

        /*
         * IMPORTANT:
         * We authenticate first.
         * Then read the real role from profiles.
         */
        try {
          const profile = await fetchSupabaseProfile(data.user.id)

          setUser(profile)

          return {
            success: true,
          }
        } catch (profileError) {
          /*
           * If profile is broken/missing, immediately sign out.
           * This prevents an authenticated user from entering
           * the application without a valid application role.
           */
          await supabase.auth.signOut()

          const errorMessage =
            profileError instanceof Error
              ? profileError.message
              : 'Unable to load your account profile.'

          setUser(null)
          setAuthError(errorMessage)

          return {
            success: false,
            error: errorMessage,
          }
        }
      }

      /*
       * LOCAL DEVELOPMENT MODE ONLY
       */
      const requestedRole = role || 'farmer'

      if (requestedRole === 'operator') {
        setUser(DEMO_PERSONAS.operator)
      } else if (requestedRole === 'admin') {
        setUser(DEMO_PERSONAS.admin)
      } else {
        setUser(DEMO_PERSONAS.farmer)
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error('Login error:', error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to sign in.'

      setAuthError(errorMessage)

      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * REAL SUPABASE REGISTRATION
   *
   * Public registration is ALWAYS FARMER.
   *
   * Even if somebody modifies the frontend and tries:
   * role: 'admin'
   *
   * we send role: 'farmer' to Supabase.
   *
   * Operator/Admin accounts should be created/promoted
   * through administrator-controlled operations.
   */
  const signUp = async (
    email: string,
    password: string,
    profileData: Omit<UserProfile, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setAuthError(null)

    try {
      if (!email.trim()) {
        return {
          success: false,
          error: 'Please enter your email address.',
        }
      }

      if (!password) {
        return {
          success: false,
          error: 'Please enter a password.',
        }
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long.',
        }
      }

      if (isCloud && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              /*
               * SECURITY:
               * Never accept operator/admin from public registration.
               */
              role: 'farmer',

              full_name: profileData.fullName,
              phone_number: profileData.phoneNumber,
              state: profileData.state,
              district: profileData.district,
              kisan_id: profileData.kisanId,

              /*
               * A farmer registration should not assign
               * an operator/admin mandi.
               */
              mandi_id: null,
            },
          },
        })

        if (error || !data.user) {
          const errorMessage =
            error?.message || 'Registration failed.'

          setAuthError(errorMessage)

          return {
            success: false,
            error: errorMessage,
          }
        }

        /*
         * If Supabase email confirmation is enabled,
         * session can be null after signUp.
         */
        if (!data.session) {
          setUser(null)

          return {
            success: false,
            error:
              'Registration successful. Please verify your email before signing in.',
          }
        }

        /*
         * Trigger should create the profile.
         * Read it from public.profiles.
         */
        try {
          const profile = await fetchSupabaseProfile(data.user.id)

          setUser(profile)

          return {
            success: true,
          }
        } catch (profileError) {
          const errorMessage =
            profileError instanceof Error
              ? profileError.message
              : 'Account created but profile could not be loaded.'

          setAuthError(errorMessage)

          return {
            success: false,
            error: errorMessage,
          }
        }
      }

      /*
       * LOCAL DEVELOPMENT MODE
       */
      const newProfile: UserProfile = {
        ...profileData,

        /*
         * Even local public registration defaults to farmer.
         */
        role: 'farmer',

        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }

      setUser(newProfile)

      return {
        success: true,
      }
    } catch (error) {
      console.error('Registration error:', error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to create your account.'

      setAuthError(errorMessage)

      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * REAL LOGOUT
   */
  const logout = async () => {
    setAuthError(null)

    try {
      if (isCloud && supabase) {
        const { error } = await supabase.auth.signOut()

        if (error) {
          throw error
        }
      }

      setUser(null)

      if (!isCloud) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Logout error:', error)

      setAuthError(
        error instanceof Error ? error.message : 'Unable to sign out.'
      )
    }
  }

  /**
   * Update logged-in user's profile.
   *
   * IMPORTANT:
   * Role is intentionally NOT updated here.
   *
   * A user cannot promote themselves from farmer
   * to operator/admin through profile editing.
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No authenticated user.')
    }

    /*
     * Never allow role changes from this function.
     */
    const safeUpdates = {
      full_name: updates.fullName,
      phone_number: updates.phoneNumber,
      state: updates.state,
      district: updates.district,
      kisan_id: updates.kisanId,
      updated_at: new Date().toISOString(),
    }

    if (isCloud && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.id)

      if (error) {
        console.error('Profile update error:', error)
        throw new Error(error.message)
      }
    }

    setUser({
      ...user,
      fullName:
        updates.fullName !== undefined
          ? updates.fullName
          : user.fullName,

      phoneNumber:
        updates.phoneNumber !== undefined
          ? updates.phoneNumber
          : user.phoneNumber,

      state:
        updates.state !== undefined
          ? updates.state
          : user.state,

      district:
        updates.district !== undefined
          ? updates.district
          : user.district,

      kisanId:
        updates.kisanId !== undefined
          ? updates.kisanId
          : user.kisanId,

      updatedAt: new Date().toISOString(),
    })
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
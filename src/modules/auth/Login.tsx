import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Wheat,
  Mail,
  Lock,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

export const Login: React.FC<{ onSuccess?: () => void }> = ({
  onSuccess,
}) => {
  const {
    login,
    signUp,
    isLocalMode,
    authError,
  } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Sign in
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Registration
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [state, setState] = useState('Rajasthan')
  const [district, setDistrict] = useState('Kota')
  const [kisanId, setKisanId] = useState('')

  // Local development mode
  const [localPhone, setLocalPhone] = useState('9826012345')

  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  /**
   * REAL SIGN IN
   *
   * There is NO role selection here.
   *
   * Supabase authenticates the email/password.
   * AuthContext then loads profiles.role and the app
   * decides which dashboard to show.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)

    try {
      if (isLocalMode) {
        const res = await login(localPhone)

        if (res.success) {
          onSuccess?.()
        } else if (res.error) {
          setFormError(res.error)
        }

        return
      }

      if (!email.trim() || !password) {
        setFormError('Please enter your email and password.')
        return
      }

      const res = await login(email, password)

      if (res.success) {
        /*
         * AuthContext has already loaded the real
         * Supabase profile and role.
         */
        onSuccess?.()
      } else if (res.error) {
        setFormError(res.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * PUBLIC REGISTRATION
   *
   * Every public registration creates a FARMER account.
   *
   * Operator/Admin cannot be selected here.
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)

    try {
      if (!fullName.trim() || !email.trim() || !password) {
        setFormError('Please fill in all required fields.')
        return
      }

      if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.')
        return
      }

      const res = await signUp(email, password, {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || '+91 98260 00000',

        /*
         * Public registration is always farmer.
         * AuthContext also enforces this server-side flow.
         */
        role: 'farmer',

        state: state.trim() || 'Rajasthan',
        district: district.trim() || 'Kota',
        kisanId: kisanId.trim() || undefined,
      })

      if (res.success) {
        onSuccess?.()
      } else if (res.error) {
        setFormError(res.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6">
      {/* Brand */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Wheat className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
          MANDI SETU <span className="text-emerald-700">AI</span>
        </h1>

        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Smart Agricultural Procurement & Real-Time Queue Management Platform
        </p>
      </div>

      {/* Connection Status */}
      {isLocalMode ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />

          <span>
            <strong>Local Dev Mode Active.</strong>{' '}
            Configure{' '}
            <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[10px]">
              VITE_SUPABASE_URL
            </code>{' '}
            in{' '}
            <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[10px]">
              .env
            </code>{' '}
            for production authentication.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />

          <span>
            <strong>Supabase Cloud Connected.</strong>{' '}
            Secure authentication and PostgreSQL database active.
          </span>
        </div>
      )}

      <Card className="p-5 border-slate-200">
        {/* Sign In / Register tabs */}
        {!isLocalMode && (
          <div className="flex border-b border-slate-100 mb-5 pb-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setFormError(null)
              }}
              className={`text-sm font-bold pb-2 transition border-b-2 -mb-2.5 ${
                mode === 'signin'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setFormError(null)
              }}
              className={`text-sm font-bold pb-2 transition border-b-2 -mb-2.5 ${
                mode === 'signup'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Register New Account
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* LOCAL MODE                                               */}
        {/* ========================================================= */}

        {isLocalMode ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Mobile Number / Farmer ID"
              placeholder="10-digit mobile number"
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-bold shadow-md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Access Portal
            </Button>
          </form>
        ) : mode === 'signin' ? (
          /* ======================================================= */
          /* REAL SUPABASE SIGN IN                                  */
          /* ======================================================= */

          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div className="mb-2">
              <h2 className="text-lg font-black text-slate-900">
                Welcome Back
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Sign in with your registered account. Your portal will open
                automatically based on your assigned role.
              </p>
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Your account role is securely loaded from the Mandi Setu
                  database. You do not need to select Farmer, Operator, or
                  Admin.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-bold shadow-md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        ) : (
          /* ======================================================= */
          /* REAL FARMER REGISTRATION                                */
          /* ======================================================= */

          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="mb-2">
              <h2 className="text-lg font-black text-slate-900">
                Create Farmer Account
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                New public accounts are registered as Farmer accounts.
                Operator and Admin access is assigned by authorized
                administrators.
              </p>
            </div>

            <Input
              label="Full Name"
              placeholder="e.g. Balram Singh Yadav"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                required
              />

              <Input
                label="Phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                autoComplete="tel"
              />
            </div>

            <Input
              label="Password (min 6 characters)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

              <Input
                label="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>

            <Input
              label="Kisan ID / KCC (Optional)"
              placeholder="e.g. KCC-RJ-2026"
              value={kisanId}
              onChange={(e) => setKisanId(e.target.value)}
            />

            {/* Fixed role indicator */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                    Account Type
                  </span>

                  <p className="text-sm font-black text-emerald-900 mt-0.5">
                    🌾 Farmer
                  </p>
                </div>

                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-bold shadow-md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Farmer Account
            </Button>
          </form>
        )}

        {/* Error */}
        {(formError || authError) && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />

            <span>{formError || authError}</span>
          </div>
        )}
      </Card>

      {/* Security footer */}
      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />

        <span>
          Secured with Supabase Authentication & PostgreSQL RLS
        </span>
      </div>
    </div>
  )
}
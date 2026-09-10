import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types/user.types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Wheat, Mail, Lock, Phone, User, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react'

export const Login: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { login, signUp, switchPersona, isLocalMode, authError } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [role, setRole] = useState<UserRole>('farmer')

  // Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [state, setState] = useState('Rajasthan')
  const [district, setDistrict] = useState('Kota')
  const [kisanId, setKisanId] = useState('')
  const [localPhone, setLocalPhone] = useState('9826012345')

  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)

    try {
      if (isLocalMode) {
        const res = await login(localPhone, undefined, role)
        if (res.success && onSuccess) onSuccess()
      } else {
        if (!email.trim() || !password) {
          setFormError('Please enter your email and password.')
          return
        }
        const res = await login(email, password)
        if (res.success && onSuccess) {
          onSuccess()
        } else if (res.error) {
          setFormError(res.error)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

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
        role,
        state,
        district,
        kisanId: kisanId.trim() || undefined,
      })

      if (res.success) {
        if (onSuccess) onSuccess()
      } else if (res.error) {
        setFormError(res.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPersona = (selectedRole: UserRole) => {
    switchPersona(selectedRole)
    if (onSuccess) onSuccess()
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6">
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

      {/* Cloud Mode / Local Mode Banner */}
      {isLocalMode ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Local Dev Mode Active.</strong> To connect to Supabase production, configure <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[10px]">VITE_SUPABASE_URL</code> in <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[10px]">.env</code>.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Supabase Cloud Connected.</strong> Real authentication and PostgreSQL tables active.
          </span>
        </div>
      )}

      <Card className="p-5 border-slate-200">
        {/* Toggle between Sign In and Sign Up (active in Cloud Mode) */}
        {!isLocalMode && (
          <div className="flex border-b border-slate-100 mb-5 pb-2 gap-4">
            <button
              onClick={() => setMode('signin')}
              className={`text-sm font-bold pb-2 transition border-b-2 -mb-2.5 ${
                mode === 'signin'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
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

        {/* Role Picker for Sign In or Registration */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Select Portal Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'farmer' as UserRole, label: '🌾 Farmer', desc: 'Kisan' },
              { id: 'operator' as UserRole, label: '⚖️ Operator', desc: 'Mandi Gate' },
              { id: 'admin' as UserRole, label: '📊 Admin', desc: 'Directorate' },
            ].map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  role === r.id
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold block">{r.label}</span>
                <span className={`text-[10px] block ${role === r.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {r.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Local Mode Simplified Form */}
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
          /* Supabase Cloud Sign In */
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <Input
              label="Email Address"
              type="email"
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-bold shadow-md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In with Supabase
            </Button>
          </form>
        ) : (
          /* Supabase Cloud Sign Up (Registration) */
          <form onSubmit={handleSignUp} className="space-y-3">
            <Input
              label="Full Name"
              placeholder="e.g. Balram Singh Yadav"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Email"
                type="email"
                placeholder="user@mandisetu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Password (min 6 characters)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
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

            {role === 'farmer' && (
              <Input
                label="Kisan ID / KCC (Optional)"
                placeholder="e.g. KCC-RJ-2026"
                value={kisanId}
                onChange={(e) => setKisanId(e.target.value)}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-bold shadow-md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account in Supabase
            </Button>
          </form>
        )}

        {(formError || authError) && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError || authError}</span>
          </div>
        )}

        {/* Quick Testing Personas (Available in Dev Mode) */}
        {isLocalMode && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 block text-center">
              Quick 1-Click Test Personas (Dev Mode)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <Button size="sm" variant="outline" onClick={() => handleQuickPersona('farmer')}>
                Farmer
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickPersona('operator')}>
                Operator
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickPersona('admin')}>
                Admin
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Secured with PostgreSQL Row Level Security (RLS)</span>
      </div>
    </div>
  )
}

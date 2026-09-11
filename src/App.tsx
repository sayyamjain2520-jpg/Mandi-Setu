import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'

import { Header } from '@/components/layout/Header'
import { ToastBanner } from '@/components/feedback/ToastBanner'
import { SmsDrawer } from '@/components/feedback/SmsDrawer'

import { FarmerApp } from '@/modules/farmer/FarmerApp'
import { OperatorDashboard } from '@/modules/operator/OperatorDashboard'
import { AdminDashboard } from '@/modules/admin/AdminDashboard'

import { Login } from '@/modules/auth/Login'

/**
 * ---------------------------------------------------------
 * Loading Screen
 * ---------------------------------------------------------
 */
const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center mx-auto animate-pulse">
          🌾
        </div>

        <p className="mt-4 text-sm font-bold text-slate-700">
          Loading Mandi Setu...
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Verifying your account
        </p>
      </div>
    </div>
  )
}

/**
 * ---------------------------------------------------------
 * Login Page
 * ---------------------------------------------------------
 */
const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return <LoadingScreen />
  }

  /**
   * If user is already logged in, never show login again.
   * Redirect according to the REAL database role.
   */
  if (isAuthenticated) {
    return <RoleRedirect />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12">
      <Login
        onSuccess={() => {
          /**
           * AuthContext updates the authenticated user.
           * RoleRedirect will then send the user to the
           * correct dashboard.
           */
          navigate('/', { replace: true })
        }}
      />
    </div>
  )
}

/**
 * ---------------------------------------------------------
 * Role Redirect
 * ---------------------------------------------------------
 *
 * This is the central role-based routing logic.
 *
 * profiles.role = farmer   -> /farmer
 * profiles.role = operator -> /operator
 * profiles.role = admin    -> /admin
 */
const RoleRedirect: React.FC = () => {
  const { role, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role === 'farmer') {
    return <Navigate to="/farmer" replace />
  }

  if (role === 'operator') {
    return <Navigate to="/operator" replace />
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  /**
   * Unknown / missing role.
   * Farmer is the safest public default.
   */
  return <Navigate to="/farmer" replace />
}

/**
 * ---------------------------------------------------------
 * Protected Application Layout
 * ---------------------------------------------------------
 */
const MainAppLayout: React.FC = () => {
  const { role, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  /**
   * User is not authenticated.
   */
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  /**
   * -------------------------------------------------------
   * REAL ROLE SECURITY
   * -------------------------------------------------------
   *
   * Do not trust the URL.
   *
   * Example:
   * Farmer tries /admin
   *       ↓
   * profiles.role = farmer
   *       ↓
   * Redirect to /farmer
   */
  if (role === 'farmer' && location.pathname !== '/farmer') {
    return <Navigate to="/farmer" replace />
  }

  if (role === 'operator' && location.pathname !== '/operator') {
    return <Navigate to="/operator" replace />
  }

  if (role === 'admin' && location.pathname !== '/admin') {
    return <Navigate to="/admin" replace />
  }

  /**
   * Unknown role
   */
  if (!role) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Global Header */}
      <Header />

      {/* Live Toast Notifications */}
      <ToastBanner />

      {/* SMS / Notification Drawer */}
      <SmsDrawer />

      {/* -------------------------------------------------- */}
      {/* REAL ROLE-BASED DASHBOARD                         */}
      {/* -------------------------------------------------- */}
      <div className="flex-1 flex flex-col">
        {role === 'farmer' && <FarmerApp />}

        {role === 'operator' && <OperatorDashboard />}

        {role === 'admin' && <AdminDashboard />}
      </div>
    </div>
  )
}

/**
 * ---------------------------------------------------------
 * Main App
 * ---------------------------------------------------------
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* -------------------------------------------- */}
            {/* Public login                                 */}
            {/* -------------------------------------------- */}
            <Route path="/login" element={<LoginPage />} />

            {/* -------------------------------------------- */}
            {/* Root                                         */}
            {/* -------------------------------------------- */}
            <Route path="/" element={<RoleRedirect />} />

            {/* -------------------------------------------- */}
            {/* Protected role routes                        */}
            {/* -------------------------------------------- */}
            <Route path="/farmer" element={<MainAppLayout />} />

            <Route path="/operator" element={<MainAppLayout />} />

            <Route path="/admin" element={<MainAppLayout />} />

            {/* -------------------------------------------- */}
            {/* Unknown route                                */}
            {/* -------------------------------------------- */}
            <Route path="*" element={<RoleRedirect />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
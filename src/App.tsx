import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { Header } from '@/components/layout/Header'
import { ToastBanner } from '@/components/feedback/ToastBanner'
import { SmsDrawer } from '@/components/feedback/SmsDrawer'
import { FarmerApp } from '@/modules/farmer/FarmerApp'
import { OperatorDashboard } from '@/modules/operator/OperatorDashboard'
import { AdminDashboard } from '@/modules/admin/AdminDashboard'
import { Login } from '@/modules/auth/Login'

const MainAppLayout: React.FC = () => {
  const { role, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12">
        <Login />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Global Header with Role Switcher & Notifications */}
      <Header />

      {/* Live Toast and Audio Chime Banner */}
      <ToastBanner />

      {/* Simulated SMS Gateway Drawer */}
      <SmsDrawer />

      {/* Dynamic Role Views */}
      <div className="flex-1 flex flex-col">
        {role === 'farmer' && <FarmerApp />}
        {role === 'operator' && <OperatorDashboard />}
        {role === 'admin' && <AdminDashboard />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<MainAppLayout />} />
            <Route path="/farmer" element={<MainAppLayout />} />
            <Route path="/operator" element={<MainAppLayout />} />
            <Route path="/admin" element={<MainAppLayout />} />
            <Route path="/login" element={<MainAppLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

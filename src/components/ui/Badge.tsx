import React from 'react'
import type { QueueStage, BookingStatus } from '@/types/procurement.types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  }

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-rose-100 text-rose-800 border border-rose-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

interface StatusPillProps {
  stage?: QueueStage
  bookingStatus?: BookingStatus
  paymentStatus?: 'pending' | 'processing' | 'credited' | 'rejected'
}

export const StatusPill: React.FC<StatusPillProps> = ({
  stage,
  bookingStatus,
  paymentStatus,
}) => {
  if (stage) {
    switch (stage) {
      case 'called_to_gate':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse shadow-sm">
            <span className="h-2 w-2 rounded-full bg-white"></span>
            CALLED TO GATE
          </span>
        )
      case 'gate_passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-200"></span>
            AT GATE / CHECKED IN
          </span>
        )
      case 'quality_check':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            INSPECTION (QC)
          </span>
        )
      case 'weighbridge':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            WEIGHBRIDGE
          </span>
        )
      case 'unloading':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
            UNLOADING BAY
          </span>
        )
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            COMPLETED / SETTLED
          </span>
        )
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            NO SHOW
          </span>
        )
      case 'waiting':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            WAITING IN QUEUE
          </span>
        )
    }
  }

  if (bookingStatus) {
    switch (bookingStatus) {
      case 'confirmed':
        return <Badge variant="info">Confirmed</Badge>
      case 'arrived':
        return <Badge variant="warning">At Gate</Badge>
      case 'called':
        return <Badge variant="danger">Called</Badge>
      case 'in_inspection':
        return <Badge variant="purple">Inspection</Badge>
      case 'weighed':
        return <Badge variant="info">Weighed</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      case 'no_show':
        return <Badge variant="default">No Show</Badge>
    }
  }

  if (paymentStatus) {
    switch (paymentStatus) {
      case 'credited':
        return <Badge variant="success">✓ DBT Credited</Badge>
      case 'processing':
        return <Badge variant="warning">⏳ Processing</Badge>
      case 'pending':
        return <Badge variant="default">Pending</Badge>
      case 'rejected':
        return <Badge variant="danger">Failed</Badge>
    }
  }

  return null
}

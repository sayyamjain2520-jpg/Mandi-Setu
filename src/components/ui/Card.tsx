import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverEffect?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-md hover:border-emerald-300 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<{
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 pb-4 mb-4 border-b border-slate-100 ${className}`}>
    <div>
      <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

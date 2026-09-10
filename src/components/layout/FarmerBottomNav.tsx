import React from 'react'
import { Home, MapPin, CalendarPlus, QrCode, ReceiptText } from 'lucide-react'

export type FarmerTab = 'home' | 'mandis' | 'book' | 'tokens' | 'payments'

interface FarmerBottomNavProps {
  activeTab: FarmerTab
  onTabChange: (tab: FarmerTab) => void
  hasActiveToken?: boolean
}

export const FarmerBottomNav: React.FC<FarmerBottomNavProps> = ({
  activeTab,
  onTabChange,
  hasActiveToken = false,
}) => {
  const tabs = [
    { id: 'home' as FarmerTab, label: 'Home', icon: Home },
    { id: 'mandis' as FarmerTab, label: 'Centres', icon: MapPin },
    { id: 'book' as FarmerTab, label: 'Book Slot', icon: CalendarPlus, primary: true },
    { id: 'tokens' as FarmerTab, label: 'My Token', icon: QrCode, badge: hasActiveToken },
    { id: 'payments' as FarmerTab, label: 'Payments', icon: ReceiptText },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200/90 py-1.5 px-2 md:hidden shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          if (tab.primary) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-800 text-white ring-4 ring-emerald-500/20 scale-105'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 ${
                    isActive ? 'text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white animate-ping"></span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

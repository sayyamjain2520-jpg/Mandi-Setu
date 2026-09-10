import React from 'react'
import { useNotifications } from '@/context/NotificationContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Bell, CheckCheck, Clock } from 'lucide-react'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, requestBrowserPermission } = useNotifications()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Centre"
      subtitle="Real-time queue alerts, gate calls & payment receipts"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Quick controls */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={requestBrowserPermission}
            leftIcon={<Bell className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Enable Browser Alerts
          </Button>

          {notifications.some((n) => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-slate-500" />}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Feed */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  notif.read
                    ? 'bg-slate-50 border-slate-200/70 text-slate-600'
                    : 'bg-emerald-50/50 border-emerald-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                    )}
                    <h4 className="text-xs font-bold leading-snug">{notif.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs mt-1 text-slate-600 leading-relaxed pl-4">
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

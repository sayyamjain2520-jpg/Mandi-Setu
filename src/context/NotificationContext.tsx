import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { AppNotification, SmsLogEntry } from '@/types/notification.types'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

interface ToastInfo {
  id: string
  title: string
  message: string
  type: AppNotification['type']
}

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  smsLogs: SmsLogEntry[]
  isSmsDrawerOpen: boolean
  activeToast: ToastInfo | null
  setIsSmsDrawerOpen: (open: boolean) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  requestBrowserPermission: () => Promise<void>
  dismissToast: () => void
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Synthesizes a gentle 2-tone notification bell sound using the Web Audio API
function playAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(0.2, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }

    playTone(587.33, 0, 0.25) // D5
    playTone(880, 0.15, 0.4)  // A5
  } catch {
    // AudioContext blocked or not supported
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [smsLogs, setSmsLogs] = useState<SmsLogEntry[]>([])
  const [isSmsDrawerOpen, setIsSmsDrawerOpen] = useState(false)
  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null)
  const knownNotificationIds = useRef<Set<string>>(new Set())

  const refreshNotifications = useCallback(async () => {
    const notifs = await api.getNotifications(user?.id)
    const sms = await api.getSmsLogs()

    // Check for newly arrived notifications to trigger alert chime & toast
    if (knownNotificationIds.current.size > 0 && notifs.length > 0) {
      const latest = notifs[0]
      if (!knownNotificationIds.current.has(latest.id) && !latest.read) {
        // Trigger alert chime
        playAlertChime()

        // Show Toast
        setActiveToast({
          id: latest.id,
          title: latest.title,
          message: latest.message,
          type: latest.type,
        })

        // Trigger Web Notification API if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`Mandi Setu: ${latest.title}`, {
              body: latest.message,
              icon: '/favicon.svg',
            })
          } catch {
            // Notification error ignore
          }
        }
      }
    }

    notifs.forEach((n) => knownNotificationIds.current.add(n.id))
    setNotifications(notifs)
    setSmsLogs(sms)
  }, [user?.id])

  useEffect(() => {
  refreshNotifications()
}, [refreshNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    await api.markNotificationAsRead(id)
    await refreshNotifications()
  }

  const markAllAsRead = async () => {
    if (user?.id) {
      await api.markAllNotificationsAsRead(user.id)
      await refreshNotifications()
    }
  }

  const requestBrowserPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // Permission request failed
      }
    }
  }

  const dismissToast = () => {
    setActiveToast(null)
  }

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [activeToast])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        smsLogs,
        isSmsDrawerOpen,
        activeToast,
        setIsSmsDrawerOpen,
        markAsRead,
        markAllAsRead,
        requestBrowserPermission,
        dismissToast,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

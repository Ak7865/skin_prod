"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Bell, Calendar, AlertTriangle, ShieldCheck, X, Eye, ArrowRight } from "lucide-react"
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/adminActions"

interface NotificationItem {
  _id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

interface AdminNotificationsListProps {
  initialNotifications: NotificationItem[]
}

export default function AdminNotificationsList({ initialNotifications }: AdminNotificationsListProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setNotifications(initialNotifications)
  }, [initialNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  function handleMarkRead(id: string) {
    startTransition(async () => {
      const res = await markNotificationAsRead(id)
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        )
        router.refresh()
      }
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const res = await markAllNotificationsAsRead()
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        )
        router.refresh()
      }
    })
  }

  function handleViewDetails(notification: NotificationItem) {
    setSelectedNotification(notification)
    if (!notification.isRead) {
      handleMarkRead(notification._id)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-800 animate-fade-in">System Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage all system alerts, order updates, and inventory warnings.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <Check className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Main List Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-slate-500" /> Notifications Inbox ({notifications.length})
          </h3>
          {unreadCount > 0 && (
            <span className="bg-rose-100 text-rose-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase">
              {unreadCount} Unread
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-400 italic">No notifications found. Inbox is clean!</div>
          ) : (
            notifications.map((n) => {
              const dateStr = new Date(n.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })

              return (
                <div
                  key={n._id}
                  className={`p-5 flex gap-4 transition-all duration-200 hover:bg-slate-50/40 relative group ${
                    n.isRead ? "bg-white" : "bg-emerald-50/15 border-l-4 border-emerald-600 pl-4"
                  }`}
                >
                  {/* Alert Status Icon */}
                  <div className="shrink-0 mt-0.5">
                    {n.type === "low_stock" ? (
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <button
                        onClick={() => handleViewDetails(n)}
                        className="text-left focus:outline-none group/title"
                      >
                        <h4 className={`font-bold text-sm line-clamp-1 transition-colors ${
                          n.isRead ? "text-slate-600 group-hover/title:text-slate-900" : "text-slate-800 group-hover/title:text-emerald-700"
                        }`}>
                          {n.title}
                        </h4>
                      </button>
                      
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" /> {dateStr}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 max-w-3xl">{n.message}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-1.5">
                      <button
                        onClick={() => handleViewDetails(n)}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer focus:outline-none"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>

                      {n.link && (
                        <a
                          href={n.link}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <ArrowRight className="w-3.5 h-3.5" /> Go to Resource
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Inline Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n._id)}
                        disabled={isPending}
                        title="Mark as Read"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all cursor-pointer focus:outline-none"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-3">
                {selectedNotification.type === "low_stock" ? (
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {selectedNotification.type.replace("_", " ")} alert
                  </span>
                  <h3 className="font-bold text-slate-800 text-base leading-tight mt-0.5">{selectedNotification.title}</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Notification Message</span>
                <p className="text-slate-600 text-sm leading-relaxed">{selectedNotification.message}</p>
              </div>

              <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold">
                  marked as read
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Window
              </button>

              {selectedNotification.link && (
                <a
                  href={selectedNotification.link}
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                >
                  Go to Resource <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

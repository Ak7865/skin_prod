"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Bell, LogOut, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react"
import { markNotificationAsRead } from "@/lib/actions/adminActions"
import { useRouter } from "next/navigation"

interface AdminTopbarProps {
  sessionUser: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  initialNotifications: {
    _id: string
    type: string
    title: string
    message: string
    isRead: boolean
    link?: string
    createdAt: string
  }[]
}

export default function AdminTopbar({ sessionUser, initialNotifications }: AdminTopbarProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 z-30 sticky top-0 shadow-sm">
      
      {/* Search status or breadcrumbs placeholder */}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Systems Online
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-6">
        
        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 relative focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">System Alerts</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400 italic">No system notifications found.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3.5 flex gap-2.5 transition-colors ${
                        n.isRead ? "bg-white" : "bg-emerald-50/30"
                      }`}
                    >
                      {/* Alert Icon */}
                      <div className="shrink-0 mt-0.5">
                        {n.type === "low_stock" ? (
                          <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                        ) : (
                          <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex justify-between items-start">
                          <p className={`font-bold ${n.isRead ? "text-slate-600" : "text-slate-800"}`}>{n.title}</p>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkRead(n._id)}
                              className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                        <p className="text-slate-500 leading-relaxed">{n.message}</p>
                        
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setIsOpen(false)}
                            className="inline-block text-[10px] font-bold text-emerald-600 hover:underline pt-1"
                          >
                            Investigate
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin profile and logout */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          {sessionUser.image ? (
            <img src={sessionUser.image} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs rounded-full">
              {sessionUser.name ? sessionUser.name[0] : "A"}
            </div>
          )}
          <div className="hidden lg:block text-left text-xs leading-normal">
            <p className="font-bold text-slate-700">{sessionUser.name}</p>
            <p className="text-slate-400">Admin</p>
          </div>

          <button
            onClick={async () => {
              await signOut({ callbackUrl: "/login?loggedOut=true" })
            }}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-xl transition-all"
            title="Sign Out Admin Session"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>

      </div>
    </header>
  )
}

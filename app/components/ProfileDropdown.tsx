"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { User, LogOut, Settings, ShoppingBag, ShieldAlert } from "lucide-react"

interface ProfileDropdownProps {
  sessionUser?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
}

export default function ProfileDropdown({ sessionUser }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!sessionUser) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm font-medium text-brand-charcoal hover:text-brand-emerald transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="text-sm font-medium bg-brand-emerald text-brand-cream px-4 py-2 rounded-full hover:bg-brand-emerald/90 hover:shadow-sm transition-all"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  const initials = sessionUser.name
    ? sessionUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-emerald/50 rounded-full p-1"
      >
        {sessionUser.image ? (
          <img
            src={sessionUser.image}
            alt={sessionUser.name || "Avatar"}
            className="w-8 h-8 rounded-full object-cover border border-brand-emerald/20"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-rose text-brand-emerald flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
        )}
        <span className="hidden md:inline text-sm font-medium text-brand-charcoal">
          {sessionUser.name?.split(" ")[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-brand-rose/20 rounded-2xl shadow-xl py-2 z-50 glass">
          <div className="px-4 py-2.5 border-b border-brand-rose/10">
            <p className="text-xs text-brand-emerald font-semibold uppercase tracking-wider">
              {sessionUser.role === "admin" ? "Administrator" : "Customer"}
            </p>
            <p className="text-sm font-bold text-brand-charcoal truncate">
              {sessionUser.name}
            </p>
            <p className="text-xs text-brand-charcoal/60 truncate">
              {sessionUser.email}
            </p>
          </div>

          <div className="py-1">
            {sessionUser.role === "admin" && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-brand-emerald hover:bg-brand-sage/40 transition-colors font-medium"
              >
                <ShieldAlert className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-cream transition-colors"
            >
              <User className="w-4 h-4 text-brand-charcoal/60" />
              My Profile
            </Link>

            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-cream transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-brand-charcoal/60" />
              My Orders
            </Link>

            <Link
              href="/profile?tab=settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-cream transition-colors"
            >
              <Settings className="w-4 h-4 text-brand-charcoal/60" />
              Settings
            </Link>
          </div>

          <div className="border-t border-brand-rose/10 pt-1">
            <button
              onClick={async () => {
                setIsOpen(false)
                await signOut({ callbackUrl: "/login?loggedOut=true" })
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

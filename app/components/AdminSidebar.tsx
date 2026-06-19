"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingBag, FolderHeart, ShieldAlert, Users, Bell, Settings, Home } from "lucide-react"

export default function AdminSidebar() {
  const pathname = usePathname()

  const links = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: ShoppingBag },
    { label: "Categories", href: "/admin/categories", icon: FolderHeart },
    { label: "Orders", href: "/admin/orders", icon: ShieldAlert },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Notifications", href: "/admin/notifications", icon: Bell }
  ]

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0">
      
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex flex-col">
          <span className="text-lg font-black tracking-widest text-slate-100 font-serif">
            ELIXIR ADMIN
          </span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 -mt-1 font-semibold">
            Control Console
          </span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href)
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer quick link to storefront */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Storefront
        </Link>
      </div>

    </aside>
  )
}

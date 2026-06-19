import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/app/components/AdminSidebar"
import AdminTopbar from "@/app/components/AdminTopbar"
import { getAdminNotifications } from "@/lib/actions/adminActions"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user?.role !== "admin") {
    redirect("/login")
  }

  const res = await getAdminNotifications()
  const initialNotifications = res.success ? res.notifications : []

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* Sidebar Panel */}
      <AdminSidebar />

      {/* Main Console */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Topbar Panel */}
        <AdminTopbar
          sessionUser={session.user}
          initialNotifications={initialNotifications}
        />

        {/* Console Workspace */}
        <main className="flex-grow p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

    </div>
  )
}

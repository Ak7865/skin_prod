export const dynamic = "force-dynamic";
import { getCustomerNotifications, markCustomerNotificationAsRead } from "@/lib/actions/customerActions"
import { Check, AlertTriangle, Calendar, ShoppingBag } from "lucide-react"

export default async function CustomerNotificationsPage() {
  const res = await getCustomerNotifications()
  const notifications = res.success ? res.notifications : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-brand-emerald">My Notifications</h1>
        <p className="text-sm text-brand-charcoal/50 mt-1">View your order updates and important alerts.</p>
      </div>

      <div className="bg-white border border-brand-rose/15 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-rose/15">
          <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5" /> Recent Alerts ({notifications.length})
          </h3>
        </div>

        <div className="divide-y divide-brand-rose/10 max-h-[600px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-brand-charcoal/45 italic">No notifications found.</div>
          ) : (
            notifications.map((n: any) => {
              const dateStr = new Date(n.createdAt).toLocaleString("en-US", {
                month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })

            return (
              <div key={n._id} className="p-5 flex gap-4">
                <div className="shrink-0 mt-1">
                  <AlertTriangle className="w-5 h-5 text-brand-emerald" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-brand-charcoal">{n.title}</h4>
                    <span className="text-[10px] text-brand-charcoal/45 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {dateStr}
                    </span>
                  </div>
                  <p className="text-xs text-brand-charcoal/65 leading-relaxed">{n.message}</p>
                  {n.link && (
                    <a
                      href={n.link}
                      className="inline-block text-[11px] font-bold text-brand-emerald hover:underline pt-1"
                    >
                      View Order
                    </a>
                  )}
                </div>
              </div>
            )
          })
          )}
        </div>
      </div>
    </div>
  )
}
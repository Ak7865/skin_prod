export const dynamic = "force-dynamic";
import Link from "next/link"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/Order"
import User from "@/lib/models/User"
import { ShieldAlert, Eye, Calendar, User as UserIcon, Tag } from "lucide-react"

const STATUS_OPTIONS = [
  { label: "All Orders", value: "" },
  { label: "Pending Confirmation", value: "pending_confirmation" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipping", value: "shipping" },
  { label: "Tracking Updated", value: "tracking_updated" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" }
]

async function getOrdersData(statusQuery?: string) {
  await dbConnect()

  const query: any = {}
  if (statusQuery) {
    query.status = statusQuery
  }

  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })

  return JSON.parse(JSON.stringify(orders))
}

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const queryParams = await searchParams
  const selectedStatus = queryParams.status || ""
  const orders = await getOrdersData(selectedStatus)

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-800">Order Management</h1>
          <p className="text-sm text-slate-400 mt-1">Accept or reject customer orders, dispatch tracking IDs, and manage shipment pipelines.</p>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = selectedStatus === opt.value
          return (
            <Link
              key={opt.value}
              href={opt.value ? `/admin/orders?status=${opt.value}` : "/admin/orders"}
              className={`text-xs px-4 py-2 rounded-full font-bold border transition-all ${
                isActive
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {opt.label}
            </Link>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5" /> Order Fulfillment Registry ({orders.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Placement Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 pr-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {orders.map((o: any) => {
                const shortId = o._id.slice(-6).toUpperCase()
                const dateStr = new Date(o.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })

                // Status styling helper
                let statusColor = "bg-slate-100 text-slate-700"
                if (o.status === "cancelled") statusColor = "bg-red-50 text-red-700"
                else if (o.status === "delivered") statusColor = "bg-green-50 text-green-700"
                else if (o.status === "shipping" || o.status === "tracking_updated") statusColor = "bg-blue-50 text-blue-700"
                else if (o.status === "confirmed") statusColor = "bg-emerald-50 text-emerald-700"

                return (
                  <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID */}
                    <td className="p-4 pl-6">
                      <span className="font-bold text-slate-800">#{shortId}</span>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {dateStr}
                    </td>

                    {/* Customer details */}
                    <td className="p-4">
                      <div className="flex flex-col text-slate-600">
                        <span className="font-bold flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" /> {o.user?.name || "Unknown"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{o.user?.email || ""}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="p-4 font-bold text-slate-800">${o.grandTotal.toFixed(2)}</td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-block text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <Link
                        href={`/admin/orders/${o._id}`}
                        className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                )}
              )}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-slate-400 italic">No orders found matching the filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

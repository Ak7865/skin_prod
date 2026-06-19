export const dynamic = "force-dynamic";
import Link from "next/link"
import { notFound } from "next/navigation"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/Order"
import User from "@/lib/models/User"
import { updateOrderStatus, updateOrderTracking } from "@/lib/actions/adminActions"
import { revalidatePath } from "next/cache"
import { ArrowLeft, Package, MapPin, CreditCard, ShieldCheck, RefreshCw, Truck, Calendar, Tag, ShieldAlert, User as UserIcon } from "lucide-react"

async function getOrderDetails(orderId: string) {
  await dbConnect()
  if (!orderId.match(/^[0-9a-fA-F]{24}$/)) return null
  const order = await Order.findById(orderId).populate("user", "name email")
  return order ? JSON.parse(JSON.stringify(order)) : null
}

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const order = await getOrderDetails(id)
  if (!order) notFound()

  const shortId = order._id.slice(-6).toUpperCase()

  // Actions
  async function handleAcceptOrder() {
    "use server"
    await updateOrderStatus(order._id, "confirmed", "Order accepted by administrator")
    revalidatePath(`/admin/orders/${order._id}`)
  }

  async function handleRejectOrder() {
    "use server"
    await updateOrderStatus(order._id, "cancelled", "Order rejected/cancelled by administrator")
    revalidatePath(`/admin/orders/${order._id}`)
  }

  async function handleMarkDelivered() {
    "use server"
    await updateOrderStatus(order._id, "delivered", "Shipment delivered and verified")
    revalidatePath(`/admin/orders/${order._id}`)
  }

  async function handleSaveTracking(formData: FormData) {
    "use server"
    const courierName = formData.get("courierName") as string
    const trackingId = formData.get("trackingId") as string
    const shippingNote = formData.get("shippingNote") as string
    const estimatedDeliveryDate = new Date(formData.get("estimatedDeliveryDate") as string)

    await updateOrderTracking(order._id, {
      courierName,
      trackingId,
      shippingNote,
      estimatedDeliveryDate
    })
    revalidatePath(`/admin/orders/${order._id}`)
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <Link href="/admin/orders" className="text-xs font-bold text-slate-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
        <h1 className="text-3xl font-bold font-serif text-slate-800">Fulfill Order #{shortId}</h1>
        <p className="text-sm text-slate-400">Manage fulfillment progression, log courier dispatches, and trigger customer status alerts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Items list + Status History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Purchased Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4.5 h-4.5" /> Products in Invoice
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items.map((item: any) => (
                <div key={item.product} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <span className="text-slate-400 font-semibold">Qty: {item.quantity} • Price: ${item.price.toFixed(2)}</span>
                    </div>
                    <span className="font-bold text-slate-700">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4.5 h-4.5" /> Fulfillment History Logs
            </h3>

            <div className="relative border-l border-slate-200 ml-3.5 pl-6 space-y-5 text-xs py-1">
              {order.statusHistory.map((h: any, idx: number) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[32px] top-0.5 w-4.5 h-4.5 rounded-full bg-slate-200 border-2 border-white" />
                  <p className="font-bold text-slate-700 uppercase tracking-wide">
                    {h.status.replace("_", " ")}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {new Date(h.changedAt).toLocaleString()}
                  </p>
                  {h.note && <p className="text-slate-500 mt-1 italic leading-relaxed">{h.note}</p>}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Actions console + Customer shipping card */}
        <div className="space-y-6">
          
          {/* CONTROL CONSOLE PANEL */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5" /> Action Console
            </h3>

            <div className="space-y-4">
              
              {/* STATUS INDICATOR */}
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current State</span>
                <span className="text-[10px] bg-slate-900 text-white font-black uppercase px-2.5 py-0.5 rounded-full">
                  {order.status.replace("_", " ")}
                </span>
              </div>

              {/* 1. Pending Confirmation Actions */}
              {order.status === "pending_confirmation" && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <form action={handleAcceptOrder}>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm">
                      Accept Order
                    </button>
                  </form>
                  <form action={handleRejectOrder}>
                    <button type="submit" className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold py-2.5 rounded-xl transition-all">
                      Reject Order
                    </button>
                  </form>
                </div>
              )}

              {/* 2. Confirmed: Form to Add Tracking info */}
              {order.status === "confirmed" && (
                <form action={handleSaveTracking} className="space-y-3 pt-2 border-t border-slate-100 animate-fade-in">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Dispatch Ship Details</p>
                  
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Courier Name</label>
                    <input required name="courierName" type="text" placeholder="FedEx / UPS" className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tracking ID</label>
                    <input required name="trackingId" type="text" placeholder="1234567890" className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold font-mono" />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Est. Delivery Date</label>
                    <input required name="estimatedDeliveryDate" type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Dispatch Note</label>
                    <textarea name="shippingNote" rows={2} placeholder="Left at local warehouse..." className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold" />
                  </div>

                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm">
                    Assign & Ship
                  </button>
                </form>
              )}

              {/* 3. Shipped / Tracking Updated: Mark Delivered */}
              {(order.status === "tracking_updated" || order.status === "shipping") && (
                <div className="pt-2 border-t border-slate-100">
                  <form action={handleMarkDelivered}>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm">
                      Mark as Delivered
                    </button>
                  </form>
                </div>
              )}

              {/* 4. Complete / Cancelled Status Messages */}
              {order.status === "delivered" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex gap-2 text-xs text-green-700">
                  <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-green-600" />
                  <span> Fulfill complete. Order has been delivered. </span>
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-xs text-red-700">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-red-600" />
                  <span> Order cancelled. No further action permitted. </span>
                </div>
              )}

            </div>
          </div>

          {/* SHIPPING DESTINATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Ship Destination
            </h4>
            <div className="space-y-1 text-xs text-slate-500 font-semibold">
              <p className="font-bold text-slate-800">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2 text-[10px] text-slate-400 font-semibold">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* CUSTOMER CONTACT CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-4 h-4" /> Buyer Profile
            </h4>
            <div className="space-y-1 text-xs text-slate-500 font-semibold">
              <p className="font-bold text-slate-800">{order.user?.name || "Unknown"}</p>
              <p>{order.user?.email || "No email"}</p>
            </div>
          </div>

          {/* BILLING BREAKDOWN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Invoice Breakdown
            </h4>

            <div className="space-y-2.5 text-xs text-slate-500 font-semibold">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{order.shippingPrice === 0 ? "Free" : `$${order.shippingPrice.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax (8%)</span>
                <span>${order.taxPrice.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-bold text-emerald-600">
                <span>Grand Total</span>
                <span>${order.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

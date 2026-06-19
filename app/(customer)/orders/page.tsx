export const dynamic = "force-dynamic";
import Link from "next/link"
import { getOrders } from "@/lib/actions/customerActions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ShoppingBag, ChevronRight, Package, Calendar, Tag, CreditCard } from "lucide-react"

export default async function OrdersPage() {
  const session = await auth()
  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/orders"))
  }

  const res = await getOrders()
  const orders = res.success ? res.orders : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif text-brand-emerald">My Order History</h1>
        <p className="text-sm text-brand-charcoal/60 mt-1">View past orders, track active shipments, and download invoices.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white/40 border border-brand-rose/10 rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto glass">
          <div className="w-16 h-16 bg-brand-rose/30 text-brand-emerald rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6 text-brand-emerald/80" />
          </div>
          <h3 className="text-xl font-bold text-brand-emerald">No orders found</h3>
          <p className="text-sm text-brand-charcoal/60 leading-relaxed">
            You haven&apos;t placed any skincare orders yet. Shop our collections to start your skincare journey!
          </p>
          <Link
            href="/products"
            className="inline-block bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 px-8 py-3 rounded-full text-xs font-semibold tracking-wide"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {orders.map((order: any) => {
            const shortId = order._id.slice(-6).toUpperCase()
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })
            
            // Status styling helper
            let statusColor = "bg-brand-sage/55 text-brand-emerald"
            if (order.status === "cancelled") statusColor = "bg-red-50 text-red-700"
            else if (order.status === "delivered") statusColor = "bg-green-50 text-green-700"
            else if (order.status === "shipping") statusColor = "bg-blue-50 text-blue-700"

            return (
              <div
                key={order._id}
                className="bg-white border border-brand-rose/15 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-brand-emerald">Order #{shortId}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-brand-charcoal/65">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-emerald" /> {dateStr}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-brand-emerald" /> {order.items.length} items
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-brand-emerald" /> {order.paymentMethod.cardBrand} (•••• {order.paymentMethod.last4})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-brand-rose/10 gap-6">
                  <div>
                    <span className="text-[10px] text-brand-charcoal/45 uppercase tracking-wider block font-semibold text-right">Grand Total</span>
                    <span className="text-base font-bold text-brand-emerald">${order.grandTotal.toFixed(2)}</span>
                  </div>

                  <Link
                    href={`/orders/${order._id}`}
                    className="flex items-center gap-1 bg-brand-cream hover:bg-brand-sage/20 border border-brand-rose/25 text-brand-charcoal text-xs font-semibold px-4 py-2 rounded-full transition-all"
                  >
                    Track Order <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

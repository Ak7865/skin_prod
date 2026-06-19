export const dynamic = "force-dynamic";
import Link from "next/link"
import { notFound } from "next/navigation"
import { getOrderDetails } from "@/lib/actions/customerActions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Check, ArrowLeft, Package, MapPin, CreditCard, Truck, ShieldAlert } from "lucide-react"

const CONFETTI_COLORS = ["#1F3F35", "#E8D5CD", "#D4AF37", "#E2EAE4"]

function getConfettiPiece(index: number) {
  return {
    delay: index * 0.1,
    left: (index * 17) % 100,
    size: 5 + (index % 4) * 2,
    rotation: (index * 37) % 360,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length]
  }
}

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const { id } = await params;
  const session = await auth()
  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent(`/orders/${id}`))
  }
  const res = await getOrderDetails(id)
  if (!res.success || !res.order) {
    notFound()
  }

  const order = res.order
  const queryParams = await searchParams;
  const showSuccess = queryParams.success === "true"

  // Status mapping to determine timeline completed milestones
  const statusMilestones = [
    { key: "pending_confirmation", label: "Order Placed", desc: "Your order has been recorded and is awaiting verification" },
    { key: "confirmed", label: "Confirmed", desc: "Skincare specialists have approved and processed your order" },
    { key: "shipping", label: "Shipped", desc: "Package has been handed over to courier service" },
    { key: "tracking_updated", label: "Tracking Assigned", desc: "Delivery dispatch information updated by administrator" },
    { key: "delivered", label: "Delivered", desc: "Formulations successfully delivered to destination address" }
  ]

  // Find index of current status
  const currentStatusIdx = statusMilestones.findIndex((m) => m.key === order.status)
  const isCancelled = order.status === "cancelled"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative">
      
      {/* Native CSS Confetti celebration if just checked out */}
      {showSuccess && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {[...Array(30)].map((_, i) => {
            const piece = getConfettiPiece(i)

            return (
              <div
                key={i}
                className="absolute top-0 animate-bounce"
                style={{
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height: `${piece.size * 2}px`,
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotation}deg)`,
                  animation: `fall 3.5s linear ${piece.delay}s infinite`,
                  opacity: 0.8
                }}
              />
            )
          })}
          <style>{`
            @keyframes fall {
              0% { top: -5%; transform: translateY(0) rotate(0deg); }
              100% { top: 105%; transform: translateY(100vh) rotate(720deg); }
            }
          `}</style>
        </div>
      )}

      {/* Back button and page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-rose/15 pb-6">
        <div className="space-y-1">
          <Link href="/orders" className="text-xs font-semibold text-brand-emerald hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to History
          </Link>
          <h1 className="text-2xl font-bold font-serif text-brand-emerald">
            Order #{order._id.slice(-6).toUpperCase()}
          </h1>
          <p className="text-xs text-brand-charcoal/50">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-xs text-green-800 font-semibold max-w-sm">
            <div className="p-1 bg-green-500 text-white rounded-full shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>Payment successful! Your order has been placed.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Tracking Timeline + Order items */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TRACKING TIMELINE */}
          <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4.5 h-4.5" /> Order Tracking Timeline
            </h3>

            {isCancelled ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-700">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Order Cancelled</p>
                  <p className="text-xs mt-0.5">This transaction was cancelled. If you believe this is in error, contact support.</p>
                </div>
              </div>
            ) : (
              <div className="relative border-l border-brand-rose/30 ml-4 pl-6 space-y-8 py-2">
                {statusMilestones.map((m, idx) => {
                  const isCompleted = idx <= currentStatusIdx
                  const isCurrent = idx === currentStatusIdx

                  return (
                    <div key={m.key} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isCompleted
                          ? "bg-brand-emerald border-brand-emerald text-brand-cream"
                          : "bg-white border-brand-rose/30 text-brand-charcoal/30"
                      } ${isCurrent ? "ring-4 ring-brand-sage/40" : ""}`}>
                        {isCompleted ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </span>

                      {/* Milestone Text */}
                      <div className="space-y-1">
                        <h4 className={`text-sm font-bold ${isCompleted ? "text-brand-emerald" : "text-brand-charcoal/40"}`}>
                          {m.label}
                        </h4>
                        <p className={`text-xs ${isCompleted ? "text-brand-charcoal/65" : "text-brand-charcoal/30"}`}>
                          {m.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ITEM BREAKDOWN */}
          <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4.5 h-4.5" /> Items Ordered
            </h3>

            <div className="divide-y divide-brand-rose/10">
              {order.items.map((item: any) => (
                <div key={item.product} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-cream border border-brand-rose/10 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 flex justify-between items-center text-sm">
                    <div>
                      <Link href={`/products/${item.product}`} className="font-bold text-brand-charcoal hover:text-brand-emerald transition-colors line-clamp-1">
                        {item.name}
                      </Link>
                      <span className="text-xs text-brand-charcoal/45">Quantity: {item.quantity}</span>
                    </div>
                    <span className="font-semibold text-brand-charcoal">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Invoice Details & Shipping Info */}
        <div className="space-y-6">
          
          {/* COURIER INFO */}
          {order.tracking && order.tracking.trackingId && (
            <div className="bg-brand-sage/20 border border-brand-emerald/10 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-brand-emerald text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> Courier Details
              </h4>
              <div className="space-y-2.5 text-xs text-brand-charcoal/85">
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/50">Courier:</span>
                  <span className="font-bold">{order.tracking.courierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-charcoal/50">Tracking ID:</span>
                  <span className="font-mono font-bold text-brand-emerald">{order.tracking.trackingId}</span>
                </div>
                {order.tracking.estimatedDeliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-brand-charcoal/50">Est. Delivery:</span>
                    <span className="font-bold">
                      {new Date(order.tracking.estimatedDeliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {order.tracking.shippingNote && (
                  <div className="border-t border-brand-rose/10 pt-2 text-[11px] leading-relaxed text-brand-charcoal/65 italic">
                    Note: {order.tracking.shippingNote}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SHIPPING DETAILS */}
          <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-brand-emerald text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Ship Destination
            </h4>
            <div className="space-y-1 text-xs text-brand-charcoal/75">
              <p className="font-bold text-brand-charcoal">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2 text-[10px] text-brand-charcoal/45 font-semibold">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-brand-emerald text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Invoice Breakdown
            </h4>

            <div className="space-y-2.5 text-xs text-brand-charcoal/70">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-charcoal">${order.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-brand-charcoal">
                  {order.shippingPrice === 0 ? "Free" : `$${order.shippingPrice.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax (8%)</span>
                <span className="font-semibold text-brand-charcoal">${order.taxPrice.toFixed(2)}</span>
              </div>
              <div className="border-t border-brand-rose/10 pt-2 flex justify-between text-sm font-bold text-brand-emerald">
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

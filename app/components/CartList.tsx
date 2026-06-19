"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { updateCartQuantity, removeFromCart } from "@/lib/actions/customerActions"
import { Plus, Minus, Trash2, ArrowRight, Loader2, RefreshCw } from "lucide-react"

interface CartListProps {
  initialCart: {
    items: {
      product: {
        _id: string
        name: string
        brand: string
        price: number
        discount: number
        stock: number
        images: { secure_url: string }[]
      }
      quantity: number
    }[]
  }
}

export default function CartList({ initialCart }: CartListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const items = initialCart.items || []

  // Calculators
  const subtotal = items.reduce((acc, item) => {
    const p = item.product
    if (!p) return acc
    const priceAfterDiscount = p.price * (1 - p.discount / 100)
    return acc + priceAfterDiscount * item.quantity
  }, 0)

  const shipping = subtotal > 50 ? 0 : 5
  const tax = parseFloat((subtotal * 0.08).toFixed(2))
  const grandTotal = parseFloat((subtotal + shipping + tax).toFixed(2))

  function handleQtyUpdate(productId: string, newQty: number) {
    setUpdatingId(productId)
    startTransition(async () => {
      const res = await updateCartQuantity(productId, newQty)
      if (!res.success) {
        alert(res.error || "Failed to update quantity")
      }
      setUpdatingId(null)
      router.refresh()
    })
  }

  function handleRemove(productId: string) {
    setUpdatingId(productId)
    startTransition(async () => {
      const res = await removeFromCart(productId)
      if (!res.success) {
        alert(res.error || "Failed to remove item")
      }
      setUpdatingId(null)
      router.refresh()
    })
  }

  if (items.length === 0) {
    return (
      <div className="bg-white/40 border border-brand-rose/10 rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto glass">
        <div className="w-16 h-16 bg-brand-rose/30 text-brand-emerald rounded-full flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6 text-brand-emerald/80" />
        </div>
        <h3 className="text-xl font-bold text-brand-emerald">Your cart is empty</h3>
        <p className="text-sm text-brand-charcoal/60 leading-relaxed">
          Looks like you haven&apos;t added any clean formulations to your daily skincare ritual yet. Let&apos;s start customizing!
        </p>
        <Link
          href="/products"
          className="inline-block bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 px-8 py-3 rounded-full text-xs font-semibold tracking-wide"
        >
          Shop Products
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Column: Cart Items List */}
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => {
          const p = item.product
          if (!p) return null
          const priceAfterDiscount = p.price * (1 - p.discount / 100)
          const isUpdating = isPending && updatingId === p._id

          return (
            <div
              key={p._id}
              className={`bg-white border border-brand-rose/15 rounded-2xl p-4 flex gap-4 shadow-sm relative transition-opacity ${
                isUpdating ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {/* Product Image */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-brand-cream shrink-0 border border-brand-rose/10">
                <img
                  src={p.images[0]?.secure_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200"}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-brand-emerald font-semibold uppercase tracking-wider">{p.brand}</p>
                      <Link href={`/products/${p._id}`} className="hover:text-brand-emerald font-bold text-brand-charcoal text-sm line-clamp-1">
                        {p.name}
                      </Link>
                    </div>

                    <button
                      onClick={() => handleRemove(p._id)}
                      className="text-brand-charcoal/40 hover:text-red-500 transition-colors p-1"
                      title="Remove product"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-bold text-brand-emerald">${priceAfterDiscount.toFixed(2)}</span>
                    {p.discount > 0 && (
                      <span className="text-xs text-brand-charcoal/35 line-through">${p.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Bottom row: quantity adjustment */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center border border-brand-rose/20 rounded-full bg-brand-cream/40 px-1 py-0.5">
                    <button
                      onClick={() => handleQtyUpdate(p._id, item.quantity - 1)}
                      className="p-1 hover:bg-brand-sage/40 rounded-full text-brand-charcoal"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-brand-charcoal min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQtyUpdate(p._id, item.quantity + 1)}
                      className="p-1 hover:bg-brand-sage/40 rounded-full text-brand-charcoal"
                      disabled={item.quantity >= p.stock}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stock validation note */}
                  <span className="text-[10px] font-semibold text-brand-charcoal/45">
                    Max Stock: {p.stock} units
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Right Column: Calculations summary card */}
      <div className="space-y-4">
        <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm glass space-y-6">
          <h3 className="font-bold text-brand-emerald uppercase tracking-wider text-sm">Order Summary</h3>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between text-brand-charcoal/70">
              <span>Subtotal</span>
              <span className="font-semibold text-brand-charcoal">${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-brand-charcoal/70">
              <span>Shipping</span>
              <span className="font-semibold text-brand-charcoal">
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between text-brand-charcoal/70">
              <span>Estimated Sales Tax (8%)</span>
              <span className="font-semibold text-brand-charcoal">${tax.toFixed(2)}</span>
            </div>

            <div className="border-t border-brand-rose/10 pt-3 flex justify-between text-base font-bold text-brand-emerald">
              <span>Total Amount</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all shadow-sm text-center w-full"
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Support badges */}
        <div className="border border-brand-rose/15 rounded-xl bg-white/40 p-4 text-[11px] text-brand-charcoal/60 leading-relaxed space-y-2 glass">
          <p className="font-semibold text-brand-emerald">✓ Secure Checkout Process</p>
          <p>We only save non-sensitive payment card metadata. Raw cards details are processed through mock security vaults and never stored in plain databases.</p>
        </div>
      </div>

    </div>
  )
}

export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db"
import Cart from "@/lib/models/Cart"
import CartList from "@/app/components/CartList"
import { auth } from "@/auth"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function CartPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/cart"))
  }

  await dbConnect()
  const cart = await Cart.findOne({ user: session.user?.id }).populate("items.product")
  const plainCart = cart ? JSON.parse(JSON.stringify(cart)) : { items: [] }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif text-brand-emerald">Your Skincare Ritual Cart</h1>
        <p className="text-sm text-brand-charcoal/60 mt-1">Review your selections before completing checkout.</p>
      </div>

      <CartList initialCart={plainCart} />
    </div>
  )
}

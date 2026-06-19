export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db"
import Cart from "@/lib/models/Cart"
import Address from "@/lib/models/Address"
import PaymentMethod from "@/lib/models/PaymentMethod"
import CheckoutForm from "@/app/components/CheckoutForm"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function CheckoutPage() {
  const session = await auth()
  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/checkout"))
  }

  await dbConnect()

  const cart = await Cart.findOne({ user: session.user.id }).populate("items.product")
  if (!cart || cart.items.length === 0) {
    redirect("/cart")
  }

  const addresses = await Address.find({ user: session.user.id })
  const cards = await PaymentMethod.find({ user: session.user.id })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif text-brand-emerald">Secure Checkout</h1>
        <p className="text-sm text-brand-charcoal/60 mt-1">Review your selections, select shipping address and card details.</p>
      </div>

      <CheckoutForm
        cart={JSON.parse(JSON.stringify(cart))}
        addresses={JSON.parse(JSON.stringify(addresses))}
        cards={JSON.parse(JSON.stringify(cards))}
      />
    </div>
  )
}

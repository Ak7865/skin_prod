"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveAddress, savePaymentMethod, placeOrder } from "@/lib/actions/customerActions"
import { Check, Plus, CreditCard, MapPin, Phone, User, Calendar, Loader2, ArrowRight } from "lucide-react"

interface CheckoutFormProps {
  cart: {
    items: {
      product: {
        _id: string
        name: string
        price: number
        discount: number
        stock: number
      }
      quantity: number
    }[]
  }
  addresses: {
    _id: string
    name: string
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
    isDefault: boolean
  }[]
  cards: {
    _id: string
    cardBrand: string
    last4: string
    expiryMonth: number
    expiryYear: number
  }[]
}

export default function CheckoutForm({ cart, addresses, cards }: CheckoutFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Selected State
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((a) => a.isDefault)?._id || addresses[0]?._id || ""
  )
  const [selectedCardId, setSelectedCardId] = useState(
    cards[0]?._id || ""
  )

  // Forms toggles
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [formError, setFormError] = useState("")

  // Financial calculations
  const subtotal = cart.items.reduce((acc, item) => {
    const p = item.product
    if (!p) return acc
    const priceAfterDiscount = p.price * (1 - p.discount / 100)
    return acc + priceAfterDiscount * item.quantity
  }, 0)

  const shipping = subtotal > 50 ? 0 : 5
  const tax = parseFloat((subtotal * 0.08).toFixed(2))
  const grandTotal = parseFloat((subtotal + shipping + tax).toFixed(2))

  // Address Submit handler
  async function handleAddAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError("")
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await saveAddress(formData)
      if (res.success) {
        setShowAddressForm(false)
        router.refresh()
      } else {
        setFormError(res.error || "Failed to save address")
      }
    })
  }

  // Card Submit handler
  async function handleAddCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError("")
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await savePaymentMethod(formData)
      if (res.success) {
        setShowCardForm(false)
        router.refresh()
      } else {
        setFormError(res.error || "Failed to save card metadata")
      }
    })
  }

  // Final Order placement
  function handlePlaceOrder() {
    if (!selectedAddressId) {
      alert("Please select a shipping address")
      return
    }
    if (!selectedCardId) {
      alert("Please select a payment method")
      return
    }

    setFormError("")
    startTransition(async () => {
      const formData = new FormData()
      formData.set("addressId", selectedAddressId)
      formData.set("cardId", selectedCardId)

      const res = await placeOrder(formData)
      if (res.success && res.orderId) {
        router.push(`/orders/${res.orderId}?success=true`)
      } else {
        alert(res.error || "Failed to place order")
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Checkout Selection columns */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Address Selection */}
        <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Shipping Address
            </h3>
            {!showAddressForm && (
              <button
                onClick={() => setShowAddressForm(true)}
                className="text-xs font-semibold text-brand-emerald hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            )}
          </div>

          {showAddressForm ? (
            <form onSubmit={handleAddAddress} className="space-y-4 bg-brand-cream/35 p-4 rounded-xl border border-brand-rose/10 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Recipient Name</label>
                  <input required name="name" type="text" placeholder="Jane Doe" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Phone Number</label>
                  <input required name="phone" type="tel" placeholder="+1 (555) 000-0000" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Street Address</label>
                <input required name="street" type="text" placeholder="123 Beauty Lane" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">City</label>
                  <input required name="city" type="text" placeholder="New York" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">State</label>
                  <input required name="state" type="text" placeholder="NY" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Postal Code</label>
                  <input required name="postalCode" type="text" placeholder="10001" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input id="isDefault" name="isDefault" value="true" type="checkbox" className="rounded border-brand-rose/25 text-brand-emerald focus:ring-brand-emerald" />
                <label htmlFor="isDefault" className="text-xs text-brand-charcoal/70">Set as default shipping address</label>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-brand-rose/10">
                <button type="button" onClick={() => setShowAddressForm(false)} className="text-xs font-semibold px-4 py-2 border border-brand-rose/20 rounded-full hover:bg-white">Cancel</button>
                <button type="submit" disabled={isPending} className="bg-brand-emerald text-brand-cream text-xs font-bold px-5 py-2 rounded-full hover:bg-brand-emerald/90 transition-colors flex items-center gap-1.5">
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Address
                </button>
              </div>
            </form>
          ) : addresses.length === 0 ? (
            <p className="text-xs text-brand-charcoal/45 italic py-2">No shipping addresses saved. Please add one above to complete purchase.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr._id
                return (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddressId(addr._id)}
                    className={`border rounded-2xl p-4 cursor-pointer relative transition-all ${
                      isSelected
                        ? "border-brand-emerald bg-brand-sage/10 shadow-sm"
                        : "border-brand-rose/15 hover:border-brand-rose/45 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-brand-emerald text-brand-cream rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <p className="text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-emerald" /> {addr.name}
                    </p>
                    <p className="text-xs text-brand-charcoal/75 mt-2 leading-relaxed">
                      {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p className="text-[10px] text-brand-charcoal/50 flex items-center gap-1 mt-2">
                      <Phone className="w-3 h-3" /> {addr.phone}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Payment Selection */}
        <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment Cards
            </h3>
            {!showCardForm && (
              <button
                onClick={() => setShowCardForm(true)}
                className="text-xs font-semibold text-brand-emerald hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            )}
          </div>

          {showCardForm ? (
            <form onSubmit={handleAddCard} className="space-y-4 bg-brand-cream/35 p-4 rounded-xl border border-brand-rose/10 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Card Brand</label>
                  <select required name="cardBrand" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald">
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Discover">Discover</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Card Number (Last 4 Digits)</label>
                  <input required name="last4" maxLength={4} minLength={4} type="text" placeholder="4242" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Expiry Month</label>
                  <input required name="expiryMonth" type="number" min={1} max={12} placeholder="12" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Expiry Year</label>
                  <input required name="expiryYear" type="number" min={2026} max={2040} placeholder="2030" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald" />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-brand-rose/10">
                <button type="button" onClick={() => setShowCardForm(false)} className="text-xs font-semibold px-4 py-2 border border-brand-rose/20 rounded-full hover:bg-white">Cancel</button>
                <button type="submit" disabled={isPending} className="bg-brand-emerald text-brand-cream text-xs font-bold px-5 py-2 rounded-full hover:bg-brand-emerald/90 transition-colors flex items-center gap-1.5">
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Card
                </button>
              </div>
            </form>
          ) : cards.length === 0 ? (
            <p className="text-xs text-brand-charcoal/45 italic py-2">No payment methods registered. Please add a mock card above to complete checkout.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cards.map((c) => {
                const isSelected = selectedCardId === c._id
                return (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCardId(c._id)}
                    className={`border rounded-2xl p-4 cursor-pointer relative transition-all ${
                      isSelected
                        ? "border-brand-emerald bg-brand-sage/10 shadow-sm"
                        : "border-brand-rose/15 hover:border-brand-rose/45 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-brand-emerald text-brand-cream rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <p className="text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-brand-emerald" /> {c.cardBrand} •••• {c.last4}
                    </p>
                    <p className="text-[10px] text-brand-charcoal/50 flex items-center gap-1 mt-2.5 font-semibold">
                      <Calendar className="w-3.5 h-3.5" /> Exp: {String(c.expiryMonth).padStart(2, "0")}/{c.expiryYear}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Checkout Sidebar Total Amount */}
      <div className="space-y-4">
        <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm glass space-y-6">
          <h3 className="font-bold text-brand-emerald uppercase tracking-wider text-sm">Review Selections</h3>

          <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
            {cart.items.map((item) => {
              const priceAfter = item.product.price * (1 - item.product.discount / 100)
              return (
                <div key={item.product._id} className="flex justify-between text-xs text-brand-charcoal/70">
                  <span className="line-clamp-1 max-w-[150px]">{item.product.name} <span className="font-bold text-brand-emerald">x{item.quantity}</span></span>
                  <span className="font-semibold text-brand-charcoal">${(priceAfter * item.quantity).toFixed(2)}</span>
                </div>
              )
            })}
          </div>

          <div className="border-t border-brand-rose/10 pt-4 space-y-3.5 text-sm">
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
              <span>Sales Tax (8%)</span>
              <span className="font-semibold text-brand-charcoal">${tax.toFixed(2)}</span>
            </div>

            <div className="border-t border-brand-rose/10 pt-3 flex justify-between text-base font-bold text-brand-emerald">
              <span>Grand Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isPending || !selectedAddressId || !selectedCardId}
            className="flex items-center justify-center gap-2 bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all shadow-sm text-center w-full disabled:bg-brand-charcoal/20 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Order...
              </>
            ) : (
              <>
                Place Order & Pay
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 font-semibold">
            Error: {formError}
          </div>
        )}
      </div>

    </div>
  )
}

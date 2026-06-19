"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateProfile, changePassword } from "@/lib/actions/authActions"
import { saveAddress, deleteAddress, savePaymentMethod } from "@/lib/actions/customerActions"
import { User, ShieldAlert, Key, MapPin, CreditCard, Trash2, Plus, Calendar, Loader2, Check, Bell } from "lucide-react"

interface ProfileTabsProps {
  user: {
    name: string
    email: string
    image: string
    isOAuth: boolean
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
  activeTabQuery?: string
}

export default function ProfileTabs({ user, addresses, cards, activeTabQuery }: ProfileTabsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState(activeTabQuery || "details")

  // Form notifications
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Form states
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)

  function clearMsgs() {
    setSuccessMsg("")
    setErrorMsg("")
  }

  // Profile Details Submit
  async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearMsgs()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateProfile(formData)
      if (res.success) {
        setSuccessMsg("Profile details updated successfully")
        router.refresh()
      } else {
        setErrorMsg(res.error || "Failed to update profile")
      }
    })
  }

  // Password Submit
  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearMsgs()
    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match")
      return
    }

    startTransition(async () => {
      const res = await changePassword(formData)
      if (res.success) {
        setSuccessMsg("Password changed successfully")
        e.currentTarget.reset()
      } else {
        setErrorMsg(res.error || "Failed to change password")
      }
    })
  }

  // Address Save
  async function handleAddressSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearMsgs()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await saveAddress(formData)
      if (res.success) {
        setSuccessMsg("Shipping address saved successfully")
        setShowAddressForm(false)
        router.refresh()
      } else {
        setErrorMsg(res.error || "Failed to save address")
      }
    })
  }

  // Address Delete
  function handleAddressDelete(addressId: string) {
    clearMsgs()
    startTransition(async () => {
      const res = await deleteAddress(addressId)
      if (res.success) {
        setSuccessMsg("Address removed successfully")
        router.refresh()
      } else {
        setErrorMsg(res.error || "Failed to delete address")
      }
    })
  }

  // Card Save
  async function handleCardSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearMsgs()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await savePaymentMethod(formData)
      if (res.success) {
        setSuccessMsg("Payment card saved successfully")
        setShowCardForm(false)
        router.refresh()
      } else {
        setErrorMsg(res.error || "Failed to save card details")
      }
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
      
      {/* Sidebar Navigation */}
      <div className="flex flex-col gap-1 bg-white border border-brand-rose/15 rounded-2xl p-4 shadow-sm glass">
        <button
          onClick={() => { setActiveTab("details"); clearMsgs(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
            activeTab === "details"
              ? "bg-brand-emerald text-brand-cream"
              : "text-brand-charcoal hover:bg-brand-cream"
          }`}
        >
          <User className="w-4.5 h-4.5" /> Profile Details
        </button>

        {!user.isOAuth && (
          <button
            onClick={() => { setActiveTab("security"); clearMsgs(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === "security"
                ? "bg-brand-emerald text-brand-cream"
                : "text-brand-charcoal hover:bg-brand-cream"
            }`}
          >
            <Key className="w-4.5 h-4.5" /> Security / Password
          </button>
        )}

        <button
          onClick={() => { setActiveTab("addresses"); clearMsgs(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
            activeTab === "addresses"
              ? "bg-brand-emerald text-brand-cream"
              : "text-brand-charcoal hover:bg-brand-cream"
          }`}
        >
          <MapPin className="w-4.5 h-4.5" /> Saved Addresses
        </button>

        <button
          onClick={() => { setActiveTab("cards"); clearMsgs(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
            activeTab === "cards"
              ? "bg-brand-emerald text-brand-cream"
              : "text-brand-charcoal hover:bg-brand-cream"
          }`}
        >
          <CreditCard className="w-4.5 h-4.5" /> Payment Cards
        </button>

        <button
          onClick={() => { setActiveTab("notifications"); clearMsgs(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
            activeTab === "notifications"
              ? "bg-brand-emerald text-brand-cream"
              : "text-brand-charcoal hover:bg-brand-cream"
          }`}
        >
          <Bell className="w-4.5 h-4.5" /> Notifications
        </button>
      </div>

      {/* Main Section */}
      <div className="md:col-span-3 space-y-6">
        
        {/* Banner messages */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-xs text-green-700 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-700 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5" /> {errorMsg}
          </div>
        )}

        {/* 1. Details form */}
        {activeTab === "details" && (
          <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider">Account Specifications</h3>
              <p className="text-xs text-brand-charcoal/50">Edit your display name and profile image avatar.</p>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
              <div>
                <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Email Address (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-brand-cream/40 border border-brand-rose/25 rounded-lg text-xs p-2.5 text-brand-charcoal/45 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Full Name</label>
                <input
                  required
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Profile Image URL</label>
                <input
                  name="image"
                  type="text"
                  defaultValue={user.image}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 text-xs font-bold px-6 py-2.5 rounded-full transition-colors flex items-center gap-1.5"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Details
              </button>
            </form>
          </div>
        )}

        {/* 2. Security change password */}
        {activeTab === "security" && !user.isOAuth && (
          <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider">Change Account Password</h3>
              <p className="text-xs text-brand-charcoal/50">Ensure a secure password of at least 6 characters.</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
              <div>
                <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Current Password</label>
                <input
                  required
                  name="currentPassword"
                  type="password"
                  className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">New Password</label>
                <input
                  required
                  name="newPassword"
                  type="password"
                  className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Confirm New Password</label>
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 text-xs font-bold px-6 py-2.5 rounded-full transition-colors flex items-center gap-1.5"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Update Password
              </button>
            </form>
          </div>
        )}

        {/* 3. Addresses Management */}
        {activeTab === "addresses" && (
          <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider">Saved Addresses</h3>
                <p className="text-xs text-brand-charcoal/50">Manage default delivery address books.</p>
              </div>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-xs font-bold bg-brand-cream border border-brand-rose/25 text-brand-charcoal hover:bg-brand-sage/20 px-4 py-2 rounded-full flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Address
                </button>
              )}
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddressSave} className="space-y-4 bg-brand-cream/35 p-4 rounded-xl border border-brand-rose/10 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Recipient Name</label>
                    <input required name="name" type="text" placeholder="Jane Doe" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Phone Number</label>
                    <input required name="phone" type="tel" placeholder="+1 (555) 000-0000" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Street Address</label>
                  <input required name="street" type="text" placeholder="123 Skincare lane" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">City</label>
                    <input required name="city" type="text" placeholder="Seattle" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">State</label>
                    <input required name="state" type="text" placeholder="WA" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Postal Code</label>
                    <input required name="postalCode" type="text" placeholder="98101" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input id="isDefault" name="isDefault" value="true" type="checkbox" className="rounded border-brand-rose/25 text-brand-emerald focus:ring-brand-emerald" />
                  <label htmlFor="isDefault" className="text-xs text-brand-charcoal/70 font-semibold">Set as default shipping address</label>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-brand-rose/10">
                  <button type="button" onClick={() => setShowAddressForm(false)} className="text-xs font-semibold px-4 py-2 border border-brand-rose/20 rounded-full hover:bg-white">Cancel</button>
                  <button type="submit" disabled={isPending} className="bg-brand-emerald text-brand-cream text-xs font-bold px-5 py-2 rounded-full hover:bg-brand-emerald/90 transition-colors flex items-center gap-1.5">
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Address
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              <p className="text-xs text-brand-charcoal/45 italic py-4">No address book entries created.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr._id} className="border border-brand-rose/15 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-brand-emerald" /> {addr.name}
                        </p>
                        {addr.isDefault && (
                          <span className="bg-brand-sage/65 text-brand-emerald text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-charcoal/75 mt-2.5 leading-relaxed">
                        {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="text-[10px] text-brand-charcoal/45 font-semibold mt-2">
                        Phone: {addr.phone}
                      </p>
                    </div>

                    <div className="flex justify-end pt-4 mt-4 border-t border-brand-rose/10">
                      <button
                        onClick={() => handleAddressDelete(addr._id)}
                        disabled={isPending}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Payment Cards Management */}
        {activeTab === "cards" && (
          <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider">Registered Cards</h3>
                <p className="text-xs text-brand-charcoal/50">Save cards to expedite checkout. CVVs are never saved.</p>
              </div>
              {!showCardForm && (
                <button
                  onClick={() => setShowCardForm(true)}
                  className="text-xs font-bold bg-brand-cream border border-brand-rose/25 text-brand-charcoal hover:bg-brand-sage/20 px-4 py-2 rounded-full flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Register Card
                </button>
              )}
            </div>

            {showCardForm && (
              <form onSubmit={handleCardSave} className="space-y-4 bg-brand-cream/35 p-4 rounded-xl border border-brand-rose/10 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Card Brand</label>
                    <select required name="cardBrand" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-semibold">
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">American Express</option>
                      <option value="Discover">Discover</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Card Number (Last 4 Digits)</label>
                    <input required name="last4" maxLength={4} minLength={4} type="text" placeholder="4242" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-mono font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Expiry Month</label>
                    <input required name="expiryMonth" type="number" min={1} max={12} placeholder="12" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Expiry Year</label>
                    <input required name="expiryYear" type="number" min={2026} max={2040} placeholder="2030" className="w-full bg-white border border-brand-rose/20 rounded-lg text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-semibold" />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-brand-rose/10">
                  <button type="button" onClick={() => setShowCardForm(false)} className="text-xs font-semibold px-4 py-2 border border-brand-rose/20 rounded-full hover:bg-white">Cancel</button>
                  <button type="submit" disabled={isPending} className="bg-brand-emerald text-brand-cream text-xs font-bold px-5 py-2 rounded-full hover:bg-brand-emerald/90 transition-colors flex items-center gap-1.5">
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Register Card
                  </button>
                </div>
              </form>
            )}

            {cards.length === 0 ? (
              <p className="text-xs text-brand-charcoal/45 italic py-4">No registered cards found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cards.map((c) => (
                  <div key={c._id} className="border border-brand-rose/15 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-brand-emerald" /> {c.cardBrand}
                      </p>
                      <p className="text-sm font-semibold text-brand-charcoal/75 mt-2.5">
                        •••• •••• •••• {c.last4}
                      </p>
                      <p className="text-[10px] text-brand-charcoal/45 mt-2 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-brand-emerald" /> Exp: {String(c.expiryMonth).padStart(2, "0")}/{c.expiryYear}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
</div>
            )}

            {/* 5. Notifications */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-brand-rose/15 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-brand-emerald text-sm uppercase tracking-wider">Order Notifications</h3>
                  <p className="text-xs text-brand-charcoal/50">Track updates on your orders and alerts.</p>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-brand-charcoal/45 italic">
                    View all your notifications on the dedicated page.{" "}
                    <a href="/notifications" className="font-bold text-brand-emerald hover:underline">
                      See all notifications →
                    </a>
                  </p>
                </div>
              </div>
            )}

        </div>

    </div>
  )
}

export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import Order from "@/lib/models/Order"
import { toggleUserStatus } from "@/lib/actions/adminActions"
import { revalidatePath } from "next/cache"
import { Users, ShieldCheck, ShieldAlert, ShoppingBag } from "lucide-react"

async function getCustomersData() {
  await dbConnect()

  // Find all customer roles
  const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 })
  
  // Get order count and spend totals for each customer
  const customerData = await Promise.all(
    customers.map(async (cust) => {
      const orders = await Order.find({ user: cust._id })
      const spendTotal = orders.reduce((acc, order) => acc + order.grandTotal, 0)
      return {
        _id: cust._id.toString(),
        name: cust.name,
        email: cust.email,
        image: cust.image || "",
        status: cust.status,
        createdAt: cust.createdAt,
        ordersCount: orders.length,
        spendTotal
      }
    })
  )

  return customerData
}

export default async function AdminCustomersPage() {
  const customers = await getCustomersData()

  // Toggle user status server action
  async function handleToggleStatus(formData: FormData) {
    "use server"
    const userId = formData.get("userId") as string
    await toggleUserStatus(userId)
    revalidatePath("/admin/customers")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-slate-800">Customer Database</h1>
        <p className="text-sm text-slate-400 mt-1">Monitor buyer details, order frequency, financial spend, and manage account authorization status.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4.5 h-4.5" /> Registered Customer Accounts ({customers.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4 pl-6">Profile / Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Orders count</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Signed Up</th>
                <th className="p-4 pr-6 text-right">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Name and avatar */}
                  <td className="p-4 pl-6 flex items-center gap-3">
                    {c.image ? (
                      <img src={c.image} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold font-mono">
                        {c.name ? c.name[0].toUpperCase() : "U"}
                      </div>
                    )}
                    <span className="font-bold text-slate-800">{c.name}</span>
                  </td>

                  {/* Email */}
                  <td className="p-4 text-slate-500 font-semibold">{c.email}</td>

                  {/* Orders */}
                  <td className="p-4">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> {c.ordersCount}
                    </span>
                  </td>

                  {/* Total spent */}
                  <td className="p-4 font-bold text-emerald-600">${c.spendTotal.toFixed(2)}</td>

                  {/* Created date */}
                  <td className="p-4 text-slate-400 font-semibold">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>

                  {/* Toggle Status */}
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className={`inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        c.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {c.status}
                      </span>
                      
                      <form action={handleToggleStatus}>
                        <input type="hidden" name="userId" value={c._id} />
                        <button
                          type="submit"
                          className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition-all ${
                            c.status === "active"
                              ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                              : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {c.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-slate-400 italic">No customer records in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

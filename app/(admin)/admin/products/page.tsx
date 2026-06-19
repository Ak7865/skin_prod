export const dynamic = "force-dynamic";
import Link from "next/link"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/Product"
import Category from "@/lib/models/Category"
import { deleteProduct } from "@/lib/actions/adminActions"
import { revalidatePath } from "next/cache"
import { Plus, Trash2, Edit, AlertCircle, ShoppingCart } from "lucide-react"

async function getProducts() {
  await dbConnect()
  const products = await Product.find({})
    .populate("category")
    .sort({ createdAt: -1 })
  return JSON.parse(JSON.stringify(products))
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  // Delete product action helper
  async function handleDelete(formData: FormData) {
    "use server"
    const productId = formData.get("productId") as string
    await deleteProduct(productId)
    revalidatePath("/admin/products")
  }

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-800">Product Management</h1>
          <p className="text-sm text-slate-400 mt-1">Configure formulation cards, edit skin type targets, adjust discounts, and track stocks.</p>
        </div>
        
        <Link
          href="/admin/products/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Formulation
        </Link>
      </div>

      {/* Table grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4.5 h-4.5" /> Product Catalog ({products.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4 pl-6">Formulation / Brand</th>
                <th className="p-4">Category</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {products.map((prod: any) => {
                const shortStock = prod.stock <= 5

                return (
                  <tr key={prod._id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Thumbnail + Name */}
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={prod.images[0]?.secure_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=100"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{prod.name}</p>
                        <span className="text-[10px] text-slate-400 font-semibold">{prod.brand}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-slate-500 font-semibold capitalize">
                      {prod.category?.name || "Skincare"}
                    </td>

                    {/* Price */}
                    <td className="p-4 font-bold text-slate-800">${prod.price.toFixed(2)}</td>

                    {/* Discount */}
                    <td className="p-4 font-bold text-slate-500">
                      {prod.discount > 0 ? (
                        <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          -{prod.discount}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="p-4">
                      {shortStock ? (
                        <span className="bg-rose-50 text-rose-700 font-black px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1.5 w-fit">
                          <AlertCircle className="w-3.5 h-3.5" /> Low Stock ({prod.stock})
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px] w-fit">
                          Healthy ({prod.stock})
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${prod._id}/edit`}
                          className="p-2 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all"
                          title="Edit Formulation"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        
                        <form action={handleDelete}>
                          <input type="hidden" name="productId" value={prod._id} />
                          <button
                            type="submit"
                            className="p-2 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all"
                            title="Delete Formulation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>

                  </tr>
                )
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-slate-400 italic">No formulations created. Add one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

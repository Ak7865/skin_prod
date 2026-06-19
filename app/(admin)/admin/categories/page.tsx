export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db"
import Category from "@/lib/models/Category"
import { createCategory, deleteCategory } from "@/lib/actions/adminActions"
import { revalidatePath } from "next/cache"
import { FolderHeart, Plus, Trash2, Layers } from "lucide-react"

async function getCategories() {
  await dbConnect()
  const categories = await Category.find({}).sort({ createdAt: -1 })
  return JSON.parse(JSON.stringify(categories))
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  // Inline action to delete category
  async function handleDelete(formData: FormData) {
    "use server"
    const catId = formData.get("categoryId") as string
    await deleteCategory(catId)
    revalidatePath("/admin/categories")
  }

  // Inline action to create category
  async function handleCreate(formData: FormData) {
    "use server"
    await createCategory(formData)
    revalidatePath("/admin/categories")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-slate-800">Category Management</h1>
        <p className="text-sm text-slate-400 mt-1">Add, update, or remove skincare categories from the catalog.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Form */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4.5 h-4.5" /> Create Category
          </h3>
          
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category Name</label>
              <input
                required
                type="text"
                name="name"
                placeholder="e.g. Cleanser"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Image URL</label>
              <input
                type="text"
                name="image"
                placeholder="https://images.unsplash.com/photo..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief summary of category targets..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm"
            >
              Publish Category
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4.5 h-4.5" /> Active Categories ({categories.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {categories.map((cat: any) => (
              <div key={cat._id} className="p-4 flex items-center gap-4 justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={cat.image || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=100"}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 capitalize">{cat.name}</p>
                    <p className="text-xs text-slate-400 leading-normal line-clamp-1">{cat.description || "No description provided."}</p>
                  </div>
                </div>

                <form action={handleDelete}>
                  <input type="hidden" name="categoryId" value={cat._id.toString()} />
                  <button
                    type="submit"
                    className="p-2 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400 italic">No categories created. Publish one using the form.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

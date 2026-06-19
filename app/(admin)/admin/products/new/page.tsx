export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db"
import Category from "@/lib/models/Category"
import ProductForm from "@/app/components/ProductForm"

async function getCategories() {
  await dbConnect()
  const categories = await Category.find({})
  return JSON.parse(JSON.stringify(categories))
}

export default async function AdminNewProductPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-slate-800">New Formulation Card</h1>
        <p className="text-sm text-slate-400 mt-1">Publish a new skin care formulation in the store catalog.</p>
      </div>

      <ProductForm categories={categories} />
    </div>
  )
}

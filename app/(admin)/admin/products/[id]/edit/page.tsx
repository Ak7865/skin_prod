export const dynamic = "force-dynamic";
import { notFound } from "next/navigation"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/Product"
import Category from "@/lib/models/Category"
import ProductForm from "@/app/components/ProductForm"

async function getProductAndCategories(productId: string) {
  await dbConnect()
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) return null

  const product = await Product.findById(productId)
  if (!product) return null

  const categories = await Category.find({})

  return {
    product: JSON.parse(JSON.stringify(product)),
    categories: JSON.parse(JSON.stringify(categories))
  }
}

export default async function AdminEditProductPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const data = await getProductAndCategories(id)
  if (!data) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-slate-800">Edit Formulation Card</h1>
        <p className="text-sm text-slate-400 mt-1">Modify formulation specifications, prices, skin concerns, or restock item quantities.</p>
      </div>

      <ProductForm
        categories={data.categories}
        initialProduct={data.product}
      />
    </div>
  )
}

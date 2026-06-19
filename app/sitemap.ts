import { MetadataRoute } from "next"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/Product"
import Category from "@/lib/models/Category"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  let products: any[] = []
  let categories: any[] = []

  try {
    await dbConnect()
    products = await Product.find({}).select("_id updatedAt")
    categories = await Category.find({}).select("slug")
  } catch (e) {
    console.error("Sitemap generation database query failed:", e)
  }

  const productUrls = products.map((prod) => ({
    url: `${baseUrl}/products/${prod._id}`,
    lastModified: new Date(prod.updatedAt || Date.now())
  }))

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/products?category=${cat.slug}`,
    lastModified: new Date()
  }))

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/products`, lastModified: new Date() },
    ...categoryUrls,
    ...productUrls
  ]
}

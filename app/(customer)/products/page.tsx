export const dynamic = "force-dynamic";
import Link from "next/link"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/Product"
import Category from "@/lib/models/Category"
import { Star, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react"
import { addToCart } from "@/lib/actions/customerActions"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

const SKIN_TYPES = ["all", "sensitive", "oily", "dry", "combination"]
const CONCERNS = ["acne", "anti-aging", "dark-spots", "dryness", "pores", "dullness", "redness", "wrinkles", "uneven-tone"]
const SORTS = [
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Customer Rated", value: "rating" }
]

async function getProductsData(searchParams: any) {
  await dbConnect()

  const params = await searchParams;
  const page = parseInt(String(params.page || "1"))
  const limit = 6
  const skip = (page - 1) * limit

  // Cast all input parameters to string to prevent NoSQL query operator injection
  const search = typeof params.search === "string" ? params.search.trim() : ""
  const categorySlug = typeof params.category === "string" ? params.category.trim() : ""
  const skinType = typeof params.skinType === "string" ? params.skinType.trim() : ""
  const concern = typeof params.concern === "string" ? params.concern.trim() : ""
  const minPrice = typeof params.minPrice === "string" ? params.minPrice.trim() : ""
  const maxPrice = typeof params.maxPrice === "string" ? params.maxPrice.trim() : ""
  const minRating = typeof params.minRating === "string" ? params.minRating.trim() : ""
  const sort = typeof params.sort === "string" ? params.sort.trim() : "newest"

  const query: any = {}

  // 1. Search Query
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
      { ingredients: { $in: [new RegExp(search, "i")] } }
    ]
  }

  // 2. Category Filter
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug })
    if (cat) {
      query.category = cat._id
    }
  }

  // 3. Skin Type Filter
  if (skinType) {
    query.skinType = skinType
  }

  // 4. Concern Filter
  if (concern) {
    query.concernType = concern
  }

  // 5. Price Range Filter
  if (minPrice || maxPrice) {
    query.price = {}
    if (minPrice) query.price.$gte = parseFloat(minPrice)
    if (maxPrice) query.price.$lte = parseFloat(maxPrice)
  }

  // 6. Ratings Filter
  if (minRating) {
    query.rating = { $gte: parseFloat(minRating) }
  }

  // Sorting
  let sortOption: any = { createdAt: -1 }
  if (sort === "price-asc") sortOption = { price: 1 }
  else if (sort === "price-desc") sortOption = { price: -1 }
  else if (sort === "rating") sortOption = { rating: -1 }

  // Execute database query
  const totalCount = await Product.countDocuments(query)
  const products = await Product.find(query)
    .populate("category")
    .sort(sortOption)
    .skip(skip)
    .limit(limit)

  const categories = await Category.find({})

  return {
    products: JSON.parse(JSON.stringify(products)),
    categories: JSON.parse(JSON.stringify(categories)),
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit) || 1
  }
}

export default async function ProductListingPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams;
  const { products, categories, totalCount, currentPage, totalPages } = await getProductsData(params)

  // Quick helper to construct link urls with merged search parameters
  function getFilterLink(newParams: Record<string, string | null>) {
    const current = new URLSearchParams()
    
    // Copy current params
    Object.entries(params).forEach(([key, val]) => {
      if (val) current.set(key, val)
    })
    
    // Merge new params
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === "") {
        current.delete(key)
      } else {
        current.set(key, val)
      }
    })
    
    // Reset page on filter changes unless specifying page directly
    if (!newParams.page) {
      current.delete("page")
    }

    return `/products?${current.toString()}`
  }

  // Add to cart server action
  async function handleAddToCart(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session) {
      redirect("/login?callbackUrl=" + encodeURIComponent("/products"))
    }
    const productId = formData.get("productId") as string
    await addToCart(productId, 1)
    revalidatePath("/products")
  }

  const activeFiltersCount = Object.keys(params).filter(
    (k) => params[k] && k !== "page" && k !== "sort"
  ).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title Header */}
      <div className="border-b border-brand-rose/15 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-brand-emerald">Our Formulations</h1>
          <p className="text-sm text-brand-charcoal/60 mt-1">
            Showing {products.length} of {totalCount} results
          </p>
        </div>

        {/* Top Sorting dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-charcoal/60 uppercase tracking-wider">Sort:</span>
          <div className="relative">
            <select
              defaultValue={params.sort || "newest"}
              className="bg-white border border-brand-rose/25 text-sm rounded-full py-1.5 px-4 pr-8 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-medium appearance-none"
              // Standard client navigation simulation via client action if required, but standard select redirect is done nicely or simple links work. For standard selection, using a client component would be needed. However, we can use simple dropdown styling or styled links to keep this 100% server component.
              // To handle selection redirects simply in HTML: we can render individual link pills for sorting or standard options! Let's render a horizontal sorting list or pills, which looks even more premium than a generic browser select dropdown!
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* SORTS rendered as clickable pills for premium SEO compatibility */}
          <div className="hidden lg:flex gap-1.5 ml-2">
            {SORTS.map((s) => {
              const isActive = (params.sort || "newest") === s.value
              return (
                <Link
                  key={s.value}
                  href={getFilterLink({ sort: s.value })}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
                    isActive
                      ? "bg-brand-emerald text-brand-cream border-brand-emerald"
                      : "bg-white border-brand-rose/20 hover:border-brand-rose/65"
                  }`}
                >
                  {s.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR FILTERS */}
        <div className="space-y-6 lg:border-r lg:border-brand-rose/10 lg:pr-6">
          
          {/* Active Filters summary & Reset */}
          <div className="flex items-center justify-between pb-4 border-b border-brand-rose/10">
            <span className="font-bold text-brand-emerald flex items-center gap-1.5 text-sm uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4" /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </span>
            {activeFiltersCount > 0 && (
              <Link href="/products" className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear All
              </Link>
            )}
          </div>

          {/* 1. Category filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-brand-emerald uppercase tracking-wider">Categories</h4>
            <div className="flex flex-col gap-1.5">
              {categories.map((cat: any) => {
                const isActive = params.category === cat.slug
                return (
                  <Link
                    key={cat._id}
                    href={getFilterLink({ category: isActive ? null : cat.slug })}
                    className={`text-sm py-1 px-2.5 rounded-lg flex items-center justify-between capitalize ${
                      isActive ? "bg-brand-sage/65 text-brand-emerald font-semibold" : "text-brand-charcoal/80 hover:bg-brand-cream"
                    }`}
                  >
                    <span>{cat.name}s</span>
                    {isActive && <X className="w-3.5 h-3.5 text-brand-emerald" />}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 2. Skin Type filter */}
          <div className="space-y-2 pt-2 border-t border-brand-rose/10">
            <h4 className="text-xs font-bold text-brand-emerald uppercase tracking-wider">Skin Type</h4>
            <div className="flex flex-wrap gap-1.5">
              {SKIN_TYPES.map((type) => {
                const isActive = params.skinType === type || (!params.skinType && type === "all")
                return (
                  <Link
                    key={type}
                    href={getFilterLink({ skinType: type === "all" ? null : type })}
                    className={`text-xs px-3 py-1.5 rounded-full capitalize border ${
                      isActive
                        ? "bg-brand-emerald text-brand-cream border-brand-emerald font-semibold"
                        : "bg-white text-brand-charcoal/85 border-brand-rose/20 hover:border-brand-rose/65"
                    }`}
                  >
                    {type}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 3. Concern filter */}
          <div className="space-y-2 pt-2 border-t border-brand-rose/10">
            <h4 className="text-xs font-bold text-brand-emerald uppercase tracking-wider">Skin Concern</h4>
            <div className="flex flex-wrap gap-1.5">
              {CONCERNS.map((c) => {
                const isActive = params.concern === c
                return (
                  <Link
                    key={c}
                    href={getFilterLink({ concern: isActive ? null : c })}
                    className={`text-xs px-3 py-1.5 rounded-full capitalize border ${
                      isActive
                        ? "bg-brand-emerald text-brand-cream border-brand-emerald font-semibold"
                        : "bg-white text-brand-charcoal/85 border-brand-rose/20 hover:border-brand-rose/65"
                    }`}
                  >
                    {c.replace("-", " ")}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 4. Price filter */}
          <div className="space-y-3 pt-2 border-t border-brand-rose/10">
            <h4 className="text-xs font-bold text-brand-emerald uppercase tracking-wider">Price Range</h4>
            <form method="GET" action="/products" className="flex items-center gap-2">
              {/* Keep other filter fields inside input fields */}
              {Object.entries(params).map(([k, v]) => {
                if (v && k !== "minPrice" && k !== "maxPrice" && k !== "page") {
                  return <input key={k} type="hidden" name={k} value={v} />
                }
                return null
              })}
              <input
                type="number"
                name="minPrice"
                defaultValue={params.minPrice || ""}
                placeholder="Min"
                className="w-full bg-white border border-brand-rose/25 rounded-lg text-xs p-2 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
              />
              <span className="text-xs text-brand-charcoal/40">-</span>
              <input
                type="number"
                name="maxPrice"
                defaultValue={params.maxPrice || ""}
                placeholder="Max"
                className="w-full bg-white border border-brand-rose/25 rounded-lg text-xs p-2 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
              />
              <button
                type="submit"
                className="bg-brand-emerald text-brand-cream text-xs font-semibold px-3 py-2 rounded-lg hover:bg-brand-emerald/90 transition-colors"
              >
                Go
              </button>
            </form>
          </div>

          {/* 5. Rating filter */}
          <div className="space-y-2 pt-2 border-t border-brand-rose/10">
            <h4 className="text-xs font-bold text-brand-emerald uppercase tracking-wider">Minimum Rating</h4>
            <div className="flex flex-col gap-1.5">
              {[4, 3, 2].map((r) => {
                const isActive = params.minRating === String(r)
                return (
                  <Link
                    key={r}
                    href={getFilterLink({ minRating: isActive ? null : String(r) })}
                    className={`text-xs py-1.5 px-2.5 rounded-lg flex items-center gap-2 ${
                      isActive ? "bg-brand-sage/65 text-brand-emerald font-semibold" : "text-brand-charcoal/80 hover:bg-brand-cream"
                    }`}
                  >
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r ? "fill-brand-gold text-brand-gold" : "text-brand-charcoal/25"
                          }`}
                        />
                      ))}
                    </div>
                    <span>& Up</span>
                  </Link>
                )
              })}
            </div>
          </div>

        </div>

        {/* PRODUCTS GRID */}
        <div className="lg:col-span-3 space-y-12">
          {products.length === 0 ? (
            <div className="bg-white/40 border border-brand-rose/10 rounded-2xl p-16 text-center space-y-4 max-w-xl mx-auto glass mt-10">
              <SlidersHorizontal className="w-12 h-12 mx-auto text-brand-emerald/40" />
              <h3 className="text-xl font-bold text-brand-emerald">No formulations found</h3>
              <p className="text-sm text-brand-charcoal/60 leading-relaxed">
                We couldn&apos;t find any products matching your specific filters. Try loosening your skin concerns, clearing price ranges, or searching for alternative ingredients.
              </p>
              <Link href="/products" className="inline-block bg-brand-emerald text-brand-cream px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-brand-emerald/90">
                Reset All Filters
              </Link>
            </div>
          ) : (
            <>
              {/* Product Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod: any) => {
                  const priceAfterDiscount = prod.price * (1 - prod.discount / 100)
                  return (
                    <div
                      key={prod._id}
                      className="bg-white border border-brand-rose/15 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative group"
                    >
                      {/* Image & Badges */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-brand-cream mb-4">
                        {prod.discount > 0 && (
                          <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            -{prod.discount}% OFF
                          </span>
                        )}
                        <Link href={`/products/${prod._id}`}>
                          <img
                            src={prod.images[0]?.secure_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400"}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                          />
                        </Link>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 flex-grow">
                        <p className="text-xs text-brand-emerald font-semibold uppercase tracking-wider">{prod.brand}</p>
                        <Link href={`/products/${prod._id}`} className="hover:text-brand-emerald transition-colors block">
                          <h3 className="font-bold text-brand-charcoal text-sm line-clamp-1">{prod.name}</h3>
                        </Link>
                        <p className="text-xs text-brand-charcoal/60 line-clamp-2 min-h-[32px] leading-relaxed">
                          {prod.description}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-1 pt-1.5">
                          <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
                          <span className="text-xs font-bold text-brand-charcoal">{prod.rating || "5.0"}</span>
                          <span className="text-xs text-brand-charcoal/45">({prod.numReviews || "0"})</span>
                        </div>
                      </div>

                      {/* Price and Add Button */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-rose/10">
                        <div className="flex flex-col">
                          {prod.discount > 0 ? (
                            <>
                              <span className="text-xs text-brand-charcoal/45 line-through">${prod.price.toFixed(2)}</span>
                              <span className="text-base font-bold text-brand-emerald">${priceAfterDiscount.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-base font-bold text-brand-charcoal">${prod.price.toFixed(2)}</span>
                          )}
                        </div>

                        <form action={handleAddToCart}>
                          <input type="hidden" name="productId" value={prod._id.toString()} />
                          <button
                            type="submit"
                            disabled={prod.stock === 0}
                            className="bg-brand-emerald hover:bg-brand-emerald/90 text-brand-cream text-xs font-semibold px-4 py-2 rounded-full transition-colors disabled:bg-brand-charcoal/20"
                          >
                            {prod.stock > 0 ? "Add to Cart" : "Out of Stock"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                  {currentPage > 1 ? (
                    <Link
                      href={getFilterLink({ page: String(currentPage - 1) })}
                      className="p-2 border border-brand-rose/25 rounded-full hover:bg-brand-sage/20 text-brand-charcoal"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Link>
                  ) : (
                    <span className="p-2 border border-brand-rose/10 rounded-full text-brand-charcoal/20 cursor-not-allowed">
                      <ChevronLeft className="w-5 h-5" />
                    </span>
                  )}

                  <span className="text-sm font-semibold text-brand-charcoal">
                    Page {currentPage} of {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <Link
                      href={getFilterLink({ page: String(currentPage + 1) })}
                      className="p-2 border border-brand-rose/25 rounded-full hover:bg-brand-sage/20 text-brand-charcoal"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <span className="p-2 border border-brand-rose/10 rounded-full text-brand-charcoal/20 cursor-not-allowed">
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}

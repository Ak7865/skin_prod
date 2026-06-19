export const dynamic = "force-dynamic";
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/Product"
import Review from "@/lib/models/Review"
import Order from "@/lib/models/Order"
import Wishlist from "@/lib/models/Wishlist"
import { auth } from "@/auth"
import { Star, Leaf, CheckCircle2, ShieldAlert, Heart, Calendar, MessageSquare, AlertCircle } from "lucide-react"
import { addToCart, toggleWishlist, submitReview } from "@/lib/actions/customerActions"
import { revalidatePath } from "next/cache"

async function getProductDetails(productId: string) {
  await dbConnect()
  
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    return null
  }

  const product = await Product.findById(productId).populate("category")
  if (!product) return null

  // Fetch reviews (not hidden)
  const reviews = await Review.find({ product: productId, isHidden: false })
    .populate("user", "name image")
    .sort({ createdAt: -1 })

  // Find similar products in same category
  const similarProducts = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id }
  }).limit(4)

  return {
    product: JSON.parse(JSON.stringify(product)),
    reviews: JSON.parse(JSON.stringify(reviews)),
    similarProducts: JSON.parse(JSON.stringify(similarProducts))
  }
}

async function checkUserVerification(productId: string, userId?: string) {
  if (!userId) return { isVerified: false, hasReviewed: false, inWishlist: false, hasPurchased: false }
  try {
    await dbConnect()

    // 1. Has purchased the product in any non-cancelled order?
    const purchasedOrder = await Order.findOne({
      user: userId,
      status: { $ne: "cancelled" },
      "items.product": productId
    })
    const hasPurchased = !!purchasedOrder

    // 2. Is verified buyer? (Has delivered order containing product)
    const deliveredOrder = await Order.findOne({
      user: userId,
      status: "delivered",
      "items.product": productId
    })
    const isVerified = !!deliveredOrder

    // 3. Has already reviewed?
    const review = await Review.findOne({ user: userId, product: productId })
    const hasReviewed = !!review

    // 4. Saved in wishlist?
    const wishlist = await Wishlist.findOne({ user: userId })
    const inWishlist = wishlist ? wishlist.products.some((id: any) => id.toString() === productId) : false

    return { isVerified, hasReviewed, inWishlist, hasPurchased }
  } catch (e) {
    return { isVerified: false, hasReviewed: false, inWishlist: false, hasPurchased: false }
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const data = await getProductDetails(id)
  if (!data) return {}
  const { product } = data
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.images[0]?.secure_url || ""],
      type: "website"
    }
  }
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const data = await getProductDetails(id)
  if (!data) notFound()

  const { product, reviews, similarProducts } = data
  const session = await auth()
  const { isVerified, hasReviewed, inWishlist, hasPurchased } = await checkUserVerification(product._id, session?.user?.id)

  const priceAfterDiscount = product.price * (1 - product.discount / 100)

  // Calculate review breakdown percentages
  const ratingBreakdown = [0, 0, 0, 0, 0] // index 0 = 1 star, index 4 = 5 star
  reviews.forEach((r: any) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingBreakdown[r.rating - 1]++
    }
  })
  const totalReviews = reviews.length
  
  // Actions
  async function handleAddToCart(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session) {
      redirect("/login?callbackUrl=" + encodeURIComponent(`/products/${product._id}`))
    }
    const qty = parseInt(formData.get("quantity") as string) || 1
    await addToCart(product._id, qty)
    revalidatePath(`/products/${product._id}`)
  }

  async function handleToggleWishlist() {
    "use server"
    const session = await auth()
    if (!session) {
      redirect("/login?callbackUrl=" + encodeURIComponent(`/products/${product._id}`))
    }
    await toggleWishlist(product._id)
    revalidatePath(`/products/${product._id}`)
  }

  async function handleReviewSubmit(formData: FormData) {
    "use server"
    await submitReview(formData)
    revalidatePath(`/products/${product._id}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Product top: Images + Purchase details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Left Column: Image Display */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-white border border-brand-rose/15 shadow-sm">
            <img
              src={product.images[0]?.secure_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800"}
              alt={product.images[0]?.alt || product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnails if multiple exist */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img: any, idx: number) => (
                <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-brand-rose/15 cursor-pointer hover:border-brand-emerald">
                  <img src={img.secure_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Description + Checkout Card */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-emerald uppercase tracking-wider">{product.brand}</p>
              
              {/* Wishlist toggle */}
              <form action={handleToggleWishlist}>
                <button
                  type="submit"
                  className={`p-2 rounded-full border transition-all ${
                    inWishlist
                      ? "bg-red-50 border-red-200 text-red-500 hover:bg-white hover:border-brand-rose/25 hover:text-brand-charcoal"
                      : "bg-white border-brand-rose/25 text-brand-charcoal hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                  }`}
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </form>
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-charcoal font-serif">{product.name}</h1>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
                <span className="text-sm font-bold text-brand-charcoal">{product.rating || "5.0"}</span>
                <span className="text-sm text-brand-charcoal/45">({product.numReviews} Reviews)</span>
              </div>
              <span className="text-brand-rose">|</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-brand-sage/65 text-brand-emerald rounded-full capitalize">
                {product.category?.name || "Skincare"}
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-brand-charcoal/75 leading-relaxed">
            {product.description}
          </p>

          {/* Pricing & Stock block */}
          <div className="bg-white/50 border border-brand-rose/15 rounded-2xl p-6 space-y-4 shadow-sm glass">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-brand-charcoal/40 uppercase tracking-widest font-semibold block">Price</span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  {product.discount > 0 ? (
                    <>
                      <span className="text-2xl font-bold text-brand-emerald">${priceAfterDiscount.toFixed(2)}</span>
                      <span className="text-sm text-brand-charcoal/45 line-through">${product.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-brand-charcoal">${product.price.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Stock status */}
              <div className="text-right">
                <span className="text-xs text-brand-charcoal/40 uppercase tracking-widest font-semibold block">Availability</span>
                {product.stock > 5 ? (
                  <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mt-1">
                    In Stock ({product.stock})
                  </span>
                ) : product.stock > 0 ? (
                  <span className="inline-block text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full mt-1">
                    Low Stock (Only {product.stock} left)
                  </span>
                ) : (
                  <span className="inline-block text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full mt-1">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart form */}
            {product.stock > 0 && (
              <form action={handleAddToCart} className="flex gap-4">
                <div className="w-24">
                  <select
                    name="quantity"
                    className="w-full bg-white border border-brand-rose/25 text-sm rounded-full py-3 px-3 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
                  >
                    {[...Array(Math.min(10, product.stock))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Qty {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="flex-1 bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 py-3 rounded-full text-sm font-semibold tracking-wide transition-colors shadow-sm text-center"
                >
                  Add to Cart
                </button>
              </form>
            )}
          </div>

          {/* Skin targets */}
          <div className="grid grid-cols-2 gap-4 border-t border-brand-rose/10 pt-6">
            <div>
              <span className="text-xs text-brand-charcoal/45 font-bold uppercase tracking-wider">Target Skin Types</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {product.skinType.map((st: string) => (
                  <span key={st} className="text-[10px] uppercase font-bold px-2 py-0.5 border border-brand-rose/25 rounded-md bg-white text-brand-emerald capitalize">
                    {st}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-brand-charcoal/45 font-bold uppercase tracking-wider">Concerns Addressed</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {product.concernType.map((ct: string) => (
                  <span key={ct} className="text-[10px] uppercase font-bold px-2 py-0.5 border border-brand-rose/25 rounded-md bg-white text-brand-emerald capitalize">
                    {ct.replace("-", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Product bottom: Detailed Specs (Ingredients, Instructions, Benefits) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-brand-rose/10">
        
        {/* Ingredients */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-brand-emerald font-serif flex items-center gap-2">
            <Leaf className="w-5 h-5" /> Ingredients
          </h3>
          <p className="text-sm text-brand-charcoal/70 leading-relaxed">
            Our clean-conscious formulas prioritize transparency and bioavailability.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {product.ingredients.map((ing: string, i: number) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-white border border-brand-rose/15 rounded-lg text-brand-charcoal/80">
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-brand-emerald font-serif flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Product Benefits
          </h3>
          <p className="text-sm text-brand-charcoal/70 leading-relaxed">
            Expect real, dermatologist-tested improvements:
          </p>
          <ul className="space-y-2 pt-2 text-sm text-brand-charcoal/85">
            {product.benefits.map((benefit: string, i: number) => (
              <li key={i} className="flex gap-2 items-start">
                <CheckCircle2 className="w-4.5 h-4.5 text-brand-emerald shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Directions */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-brand-emerald font-serif flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Directions for Use
          </h3>
          <div className="bg-white p-5 rounded-2xl border border-brand-rose/15 shadow-sm text-sm text-brand-charcoal/75 leading-relaxed">
            {product.usageInstructions}
          </div>
        </div>

      </div>

      {/* Reviews Section */}
      <div className="pt-12 border-t border-brand-rose/10 space-y-8">
        <h2 className="text-2xl font-bold font-serif text-brand-emerald flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> Customer Reviews
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Summary Breakdown */}
          <div className="space-y-4">
            <div className="bg-white border border-brand-rose/15 p-6 rounded-2xl text-center space-y-2 shadow-sm">
              <span className="text-xs font-bold text-brand-charcoal/45 uppercase tracking-wider block">Average Rating</span>
              <p className="text-5xl font-black text-brand-emerald font-serif">{product.rating || "5.0"}</p>
              
              <div className="flex gap-0.5 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating || 5) ? "fill-brand-gold text-brand-gold" : "text-brand-charcoal/20"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-brand-charcoal/50">Based on {totalReviews} reviews</p>
            </div>

            {/* Percentage bars */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingBreakdown[stars - 1] || 0
                const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs text-brand-charcoal/75">
                    <span className="w-3 font-semibold">{stars}★</span>
                    <div className="flex-1 bg-brand-rose/25 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-emerald h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-8 text-right text-brand-charcoal/45">({count})</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reviews List & Write Review Box */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Conditional Review Form */}
            {session && !hasReviewed && (
              <div className="bg-brand-sage/20 border border-brand-emerald/10 p-6 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-bold text-brand-emerald">
                    {isVerified ? "Write a Verified Purchase Review" : "Write a Customer Review"}
                  </h3>
                  <p className="text-xs text-brand-charcoal/60">
                    Share your application results to help the community.
                  </p>
                  {!isVerified && (
                    <p className="text-[11px] text-brand-charcoal/55">
                      Delivered purchases earn a verified badge automatically.
                    </p>
                  )}
                </div>
                
                <form action={handleReviewSubmit} className="space-y-4">
                  <input type="hidden" name="productId" value={product._id} />
                  
                  <div>
                    <label className="text-xs font-semibold text-brand-charcoal/70 uppercase block mb-1">Select Stars</label>
                    <select
                      name="rating"
                      required
                      className="bg-white border border-brand-rose/25 text-sm rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Dislike)</option>
                      <option value="1">1 Star (Poor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-brand-charcoal/70 uppercase block mb-1">Written Review</label>
                    <textarea
                      name="comment"
                      required
                      rows={3}
                      placeholder="Comment on consistency, skin sensitivity, fragrance, or overall results..."
                      className="w-full bg-white border border-brand-rose/25 rounded-xl text-sm p-3 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 text-xs font-bold px-5 py-2 rounded-full transition-colors"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            )}

            {session && hasReviewed && (
              <div className="bg-brand-sage/10 p-4 rounded-xl border border-brand-rose/15 flex items-center gap-2.5 text-xs text-brand-emerald font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Thank you! You have already submitted a review for this formulation.
              </div>
            )}

            {session && !hasReviewed && !hasPurchased && (
              <div className="bg-white p-4 rounded-xl border border-brand-rose/15 flex gap-2.5 text-xs text-brand-charcoal/65 leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 text-brand-emerald shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> You can leave a review now, and the badge will switch to verified once you have a delivered order for this product.
                </span>
              </div>
            )}

            {!session && (
              <div className="bg-white p-4 rounded-xl border border-brand-rose/15 text-center text-xs">
                Please <Link href="/login" className="font-bold text-brand-emerald hover:underline">login</Link> to review this product.
              </div>
            )}

            {/* List */}
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-sm text-brand-charcoal/45">
                No reviews have been written for this product yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev: any) => (
                  <div key={rev._id} className="bg-white border border-brand-rose/10 p-5 rounded-2xl shadow-sm space-y-3.5">
                    
                    {/* User profile + rating */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        {rev.user?.image ? (
                          <img src={rev.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-rose text-brand-emerald flex items-center justify-center text-[10px] font-bold">
                            {rev.user?.name ? rev.user.name[0].toUpperCase() : "U"}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-brand-charcoal">{rev.user?.name || "Anonymous"}</p>
                          <span className="text-[10px] text-brand-charcoal/45 block">
                            {new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating ? "fill-brand-gold text-brand-gold" : "text-brand-charcoal/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed font-medium">
                      {rev.comment}
                    </p>

                    {/* Verified badge */}
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-emerald bg-brand-sage/40 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Recommended Products */}
      {similarProducts.length > 0 && (
        <div className="pt-12 border-t border-brand-rose/10 space-y-6">
          <h2 className="text-2xl font-bold font-serif text-brand-emerald">You May Also Like</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((prod: any) => {
              const recPriceAfter = prod.price * (1 - prod.discount / 100)
              return (
                <div
                  key={prod._id}
                  className="bg-white border border-brand-rose/15 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-brand-cream mb-4">
                    <Link href={`/products/${prod._id}`}>
                      <img
                        src={prod.images[0]?.secure_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400"}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                    </Link>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-brand-emerald font-semibold uppercase tracking-wider">{prod.brand}</p>
                    <Link href={`/products/${prod._id}`} className="hover:text-brand-emerald transition-colors">
                      <h3 className="font-bold text-brand-charcoal text-sm truncate">{prod.name}</h3>
                    </Link>
                    <div className="flex items-baseline gap-2 mt-1">
                      {prod.discount > 0 ? (
                        <>
                          <span className="text-sm font-bold text-brand-emerald">${recPriceAfter.toFixed(2)}</span>
                          <span className="text-xs text-brand-charcoal/45 line-through">${prod.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-brand-charcoal">${prod.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

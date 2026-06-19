export const dynamic = "force-dynamic";
import Link from "next/link"
import dbConnect from "@/lib/db"
import Category from "@/lib/models/Category"
import Product from "@/lib/models/Product"
import { Sparkles, ArrowRight, ShieldCheck, Heart, Leaf, Star } from "lucide-react"
import { addToCart } from "@/lib/actions/customerActions"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

async function getHomeData() {
  try {
    await dbConnect()
    const categories = await Category.find({}).limit(4)
    const bestSellers = await Product.find({ isFeatured: true }).populate("category").limit(4)
    return {
      categories: JSON.parse(JSON.stringify(categories)),
      bestSellers: JSON.parse(JSON.stringify(bestSellers))
    }
  } catch (e) {
    return { categories: [], bestSellers: [] }
  }
}

export default async function CustomerHomePage() {
  const { categories, bestSellers } = await getHomeData()

  // Inline action for add-to-cart on homepage
  async function handleAddToCart(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session) {
      redirect("/login?callbackUrl=" + encodeURIComponent("/"))
    }
    const productId = formData.get("productId") as string
    await addToCart(productId, 1)
    revalidatePath("/")
  }

  return (
    <div className="space-y-20 pb-20">

      {/* Elegant Hero Section */}
      <section className="relative bg-[#F4EBE1] overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=1600&auto=format&fit=crop"
            alt="Skincare ingredients background"
            className="w-full h-full object-cover opacity-25 object-center mix-blend-multiply"
          />
          {/* Subtle golden radial glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF6F0] via-transparent to-[#E8D5CD]/40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 sm:py-24">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-rose text-brand-emerald">
              <Sparkles className="w-3.5 h-3.5" /> Clean Skin Revolution
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-brand-emerald font-serif leading-tight">
              Timeless Radiance. <br />
              <span className="font-light italic text-brand-charcoal">Grounded in Science.</span>
            </h1>
            <p className="text-base sm:text-lg text-brand-charcoal/80 leading-relaxed max-w-lg">
              We construct clean formulations using clinical-grade active ingredients and organic botanical extracts to bring balance, clarity, and longevity to your skin.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/products"
                className="bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2"
              >
                Shop All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?concern=anti-aging"
                className="bg-white/80 border border-brand-rose/40 text-brand-charcoal hover:bg-white px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide transition-all hover:-translate-y-0.5"
              >
                Explore Rituals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Values Block */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white/50 border border-brand-rose/20 rounded-3xl p-8 sm:p-12 shadow-sm glass">
          <div className="flex flex-col items-center text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-brand-sage/40 text-brand-emerald flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-emerald">100% Vegan & Clean</h3>
            <p className="text-sm text-brand-charcoal/70 leading-relaxed">
              No parabens, sulfates, silicones, or synthetic fragrances. Cruelty-free formulas certified by skin specialists.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3.5 border-y md:border-y-0 md:border-x border-brand-rose/20 py-8 md:py-0 md:px-8">
            <div className="w-12 h-12 rounded-full bg-brand-rose/40 text-brand-emerald flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-emerald">Dermatologist Tested</h3>
            <p className="text-sm text-brand-charcoal/70 leading-relaxed">
              Every formula is clinically researched to guarantee safety, tolerance, and noticeable results for sensitive skin.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-brand-cream border border-brand-emerald/10 text-brand-emerald flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-emerald">Advanced Science</h3>
            <p className="text-sm text-brand-charcoal/70 leading-relaxed">
              Concentrated active ingredients like encapsulated retinol, hyaluronic acid, and niacinamide for optimal cellular recovery.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-emerald uppercase tracking-widest block mb-1">Collections</span>
            <h2 className="text-3xl font-bold font-serif text-brand-emerald">Shop By Skin Goal</h2>
          </div>
          <Link href="/products" className="text-sm font-semibold text-brand-emerald hover:text-brand-emerald/80 flex items-center gap-1">
            Browse all categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat: any) => (
            <Link
              key={cat._id}
              href={`/products?category=${cat.slug}`}
              className="group relative h-80 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover-lift"
            >
              <img
                src={cat.image || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400"}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/90 via-brand-charcoal/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6 text-brand-cream space-y-1">
                <h3 className="text-xl font-bold tracking-wide capitalize">{cat.name}s</h3>
                <p className="text-xs text-brand-rose/85 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-lg mx-auto space-y-2">
          <span className="text-xs font-bold text-brand-emerald uppercase tracking-widest block">Favorites</span>
          <h2 className="text-3xl font-bold font-serif text-brand-emerald">Our Best Sellers</h2>
          <p className="text-sm text-brand-charcoal/65">
            Highly-rated daily essentials loved by skin enthusiasts globally.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((prod: any) => {
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
                    <span className="text-xs text-brand-charcoal/45">({prod.numReviews || "12"})</span>
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
      </section>

      {/* Premium Reviews Block */}
      <section className="bg-brand-sage/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-md mx-auto space-y-2">
            <span className="text-xs font-bold text-brand-emerald uppercase tracking-widest block">Community</span>
            <h2 className="text-3xl font-bold font-serif text-brand-emerald">What Our Customers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-rose/10 space-y-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                ))}
              </div>
              <p className="text-sm italic text-brand-charcoal/80 leading-relaxed">
                &quot;The Gentle Hydrating Cleanser has completely saved my sensitive skin barrier! It cleanses thoroughly without leaving that tight, dry feeling. A permanent staple in my ritual.&quot;
              </p>
              <div className="border-t border-brand-rose/10 pt-3 flex items-center justify-between text-xs text-brand-charcoal/60">
                <span className="font-semibold text-brand-charcoal">Sarah M.</span>
                <span className="bg-brand-sage/50 text-brand-emerald font-semibold px-2 py-0.5 rounded-full">Verified Buyer</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-rose/10 space-y-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                ))}
              </div>
              <p className="text-sm italic text-brand-charcoal/80 leading-relaxed">
                &quot;The Niacinamide Glow Serum worked miracles on my dark spots. Within three weeks my skin tone was visibly more even and pores looked noticeably tighter. Love the light texture!&quot;
              </p>
              <div className="border-t border-brand-rose/10 pt-3 flex items-center justify-between text-xs text-brand-charcoal/60">
                <span className="font-semibold text-brand-charcoal">David K.</span>
                <span className="bg-brand-sage/50 text-brand-emerald font-semibold px-2 py-0.5 rounded-full">Verified Buyer</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-rose/10 space-y-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                ))}
              </div>
              <p className="text-sm italic text-brand-charcoal/80 leading-relaxed">
                &quot;I am in love with the Retinol Night Cream. It absorbs beautifully and I wake up with smooth, glowing skin every morning. I've seen a real difference in my fine lines.&quot;
              </p>
              <div className="border-t border-brand-rose/10 pt-3 flex items-center justify-between text-xs text-brand-charcoal/60">
                <span className="font-semibold text-brand-charcoal">Amanda R.</span>
                <span className="bg-brand-sage/50 text-brand-emerald font-semibold px-2 py-0.5 rounded-full">Verified Buyer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

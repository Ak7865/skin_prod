export const dynamic = "force-dynamic";
import Link from "next/link"
import { redirect } from "next/navigation"
import dbConnect from "@/lib/db"
import Wishlist from "@/lib/models/Wishlist"
import { Star, Trash2, ShoppingCart } from "lucide-react"
import { auth } from "@/auth"
import { addToCart, toggleWishlist } from "@/lib/actions/customerActions"
import { revalidatePath } from "next/cache"

async function getWishlistData(userId?: string) {
  if (!userId) return null
  await dbConnect()
  const wishlist = await Wishlist.findOne({ user: userId }).populate("products")
  return wishlist ? JSON.parse(JSON.stringify(wishlist.products)) : []
}

export default async function WishlistPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/wishlist"))
  }

  const products = await getWishlistData(session.user?.id) || []

  // Add item to cart server action
  async function handleAddToCart(formData: FormData) {
    "use server"
    const productId = formData.get("productId") as string
    await addToCart(productId, 1)
    revalidatePath("/wishlist")
  }

  // Remove item from wishlist server action
  async function handleRemoveWishlist(formData: FormData) {
    "use server"
    const productId = formData.get("productId") as string
    await toggleWishlist(productId)
    revalidatePath("/wishlist")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif text-brand-emerald">My Saved Items</h1>
        <p className="text-sm text-brand-charcoal/60 mt-1">Formulations you have saved for your daily ritual.</p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white/40 border border-brand-rose/10 rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto glass">
          <h3 className="text-xl font-bold text-brand-emerald">Wishlist is empty</h3>
          <p className="text-sm text-brand-charcoal/60 leading-relaxed">
            Discover new cleansers, moisturizers, or serums and tap the heart icon to save them here.
          </p>
          <Link
            href="/products"
            className="inline-block bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 px-8 py-3 rounded-full text-xs font-semibold tracking-wide"
          >
            Shop Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod: any) => {
            const priceAfterDiscount = prod.price * (1 - prod.discount / 100)
            return (
              <div
                key={prod._id}
                className="bg-white border border-brand-rose/15 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative group animate-fade-in"
              >
                {/* Delete button from Wishlist top-right */}
                <form action={handleRemoveWishlist} className="absolute top-6 right-6 z-15">
                  <input type="hidden" name="productId" value={prod._id.toString()} />
                  <button
                    type="submit"
                    className="p-2 bg-white/95 rounded-full border border-brand-rose/20 text-brand-charcoal/60 hover:text-red-500 hover:border-red-200 shadow-sm"
                    title="Remove from saved items"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>

                {/* Product Image */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-brand-cream mb-4">
                  <Link href={`/products/${prod._id}`}>
                    <img
                      src={prod.images[0]?.secure_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400"}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  </Link>
                </div>

                {/* Info */}
                <div className="space-y-1 flex-grow">
                  <p className="text-xs text-brand-emerald font-semibold uppercase tracking-wider">{prod.brand}</p>
                  <Link href={`/products/${prod._id}`} className="hover:text-brand-emerald font-bold text-brand-charcoal text-sm line-clamp-1 block">
                    {prod.name}
                  </Link>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
                    <span className="text-xs font-bold text-brand-charcoal">{prod.rating || "5.0"}</span>
                  </div>
                </div>

                {/* Pricing & Add to Cart */}
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
                      className="bg-brand-emerald hover:bg-brand-emerald/90 text-brand-cream text-xs font-semibold px-3 py-2 rounded-full transition-colors flex items-center gap-1 disabled:bg-brand-charcoal/20"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import React, { Suspense } from "react"
import Link from "next/link"
import { auth } from "@/auth"
import dbConnect from "@/lib/db"
import Cart from "@/lib/models/Cart"
import Category from "@/lib/models/Category"
import ClientSearch from "@/app/components/ClientSearch"
import ProfileDropdown from "@/app/components/ProfileDropdown"
import { Heart, ShoppingCart, Sparkles, Leaf, Award } from "lucide-react"

export const dynamic = "force-dynamic"

async function getCartCount(userId?: string) {
  if (!userId) return 0
  try {
    await dbConnect()
    const cart = await Cart.findOne({ user: userId })
    if (!cart) return 0
    return cart.items.reduce((total: number, item: any) => total + item.quantity, 0)
  } catch (e) {
    return 0
  }
}

async function getCategories() {
  try {
    await dbConnect()
    const categories = await Category.find({}).limit(5)
    return JSON.parse(JSON.stringify(categories))
  } catch (e) {
    return []
  }
}

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const cartCount = await getCartCount(session?.user?.id)
  const categories = await getCategories()

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream text-brand-charcoal">
      {/* Premium Top Bar announcement */}
      <div className="bg-brand-emerald text-brand-cream text-xs text-center py-2 font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-brand-rose" />
        Free shipping on all orders over $50. Clean, vegan skincare formulas.
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-brand-rose/15 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-4">
            
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="group flex flex-col">
                <span className="text-2xl font-bold tracking-widest text-brand-emerald font-serif transition-colors">
                  L&apos;ÉLIXIR
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-brand-emerald/70 -mt-1 pl-0.5">
                  Maison de Beauté
                </span>
              </Link>
            </div>

            {/* Central Categories Link */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="/products"
                className="text-sm font-semibold text-brand-charcoal hover:text-brand-emerald transition-colors"
              >
                All Products
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className="text-sm text-brand-charcoal/80 hover:text-brand-emerald transition-colors capitalize font-medium"
                >
                  {cat.name}
                </Link>
              ))}
              {session && (
                <Link
                  href="/orders"
                  className="text-sm font-semibold text-brand-charcoal hover:text-brand-emerald transition-colors"
                >
                  Orders
                </Link>
              )}
            </nav>

            {/* Search Bar wrapped in Suspense */}
            <div className="hidden md:flex flex-1 max-w-xs xl:max-w-md mx-4">
              <Suspense fallback={<div className="h-10 bg-slate-100 rounded-full animate-pulse w-full" />}>
                <ClientSearch />
              </Suspense>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-4 sm:gap-6">
              
              {session ? (
                <>
                  {/* Wishlist Icon */}
                  <Link
                    href="/wishlist"
                    className="relative p-1.5 text-brand-charcoal hover:text-brand-emerald transition-colors rounded-full hover:bg-brand-sage/20"
                    title="Wishlist"
                  >
                    <Heart className="w-5 h-5" />
                  </Link>

                  {/* Cart Icon with badge */}
                  <Link
                    href="/cart"
                    className="relative p-1.5 text-brand-charcoal hover:text-brand-emerald transition-colors rounded-full hover:bg-brand-sage/20"
                    title="Cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-brand-emerald text-brand-cream text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile dropdown */}
                  <ProfileDropdown sessionUser={session.user} />
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-brand-charcoal hover:text-brand-emerald transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-medium bg-brand-emerald text-brand-cream px-4 py-2 rounded-full hover:bg-brand-emerald/90 hover:shadow-sm transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              
            </div> 
          </div>

          {/* Small Search Bar for mobile wrapped in Suspense */}
          <div className="md:hidden pb-4 px-4">
            <Suspense fallback={<div className="h-10 bg-slate-100 rounded-full animate-pulse w-full" />}>
              <ClientSearch />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-grow">{children}</main>

      {/* Premium Footer */}
      <footer className="bg-brand-emerald text-brand-cream border-t border-brand-emerald/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            {/* Column 1: Brand details */}
            <div className="space-y-4">
              <span className="text-xl font-bold tracking-widest font-serif block">
                L&apos;ÉLIXIR
              </span>
              <p className="text-sm text-brand-rose/80 leading-relaxed">
                Elevating your daily self-care ritual with organic ingredients, clean formulations, and skin science designed for timeless luminosity.
              </p>
              <div className="flex gap-4 pt-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-rose">
                  <Leaf className="w-3.5 h-3.5" /> Vegan
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-rose">
                  <Award className="w-3.5 h-3.5" /> Certified
                </span>
              </div>
            </div>

            {/* Column 2: Categories */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-rose mb-4">
                Shop By Category
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/products" className="text-brand-cream/80 hover:text-brand-cream transition-colors">
                    All Products
                  </Link>
                </li>
                {categories.map((cat: any) => (
                  <li key={cat._id}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="text-brand-cream/80 hover:text-brand-cream transition-colors capitalize"
                    >
                      {cat.name}s
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-rose mb-4">
                Customer Care
              </h3>
              <ul className="space-y-2.5 text-sm text-brand-cream/80">
                {session && (
                  <>
                    <li>
                      <Link href="/orders" className="hover:text-brand-cream transition-colors">
                        Track Your Order
                      </Link>
                    </li>
                    <li>
                      <Link href="/profile" className="hover:text-brand-cream transition-colors">
                        Account Settings
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link href="/faq" className="hover:text-brand-cream transition-colors">
                    FAQs & Support
                  </Link>
                </li>
                <li>
                  <span className="block text-brand-rose/60">Phone: +1 (800) ELIXIR</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-rose">
                Join the Circle
              </h3>
              <p className="text-sm text-brand-rose/85">
                Subscribe to receive skin care rituals, product releases, and exclusive invites.
              </p>
              <form action={async (formData: FormData) => {
                "use server"
                // Newsletter subscription server action mock
              }} className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  className="bg-brand-cream/10 border border-brand-rose/20 rounded-full px-4 py-2 text-sm text-brand-cream placeholder-brand-rose/40 focus:outline-none focus:ring-1 focus:ring-brand-rose w-full"
                  required
                />
                <button
                  type="submit"
                  className="bg-brand-rose text-brand-emerald hover:bg-white text-xs font-semibold px-4 py-2 rounded-full transition-colors flex-shrink-0"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-brand-rose/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-brand-rose/65">
            <p>&copy; {new Date().getFullYear()} L&apos;ÉLIXIR. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-brand-cream">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-brand-cream">Terms of Use</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

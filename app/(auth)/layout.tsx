import React from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-brand-cream flex grid-cols-1 lg:grid-cols-2 lg:grid">
      
      {/* Centering Auth Container */}
      <div className="flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 flex-1">
        <div className="mx-auto w-full max-w-sm lg:w-96 space-y-8">
          
          {/* Logo Header */}
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-flex flex-col group">
              <span className="text-2xl font-bold tracking-widest text-brand-emerald font-serif">
                L&apos;ÉLIXIR
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-brand-emerald/70 -mt-1 pl-0.5">
                Maison de Beauté
              </span>
            </Link>
          </div>

          <div className="bg-white border border-brand-rose/15 rounded-3xl p-6 sm:p-8 shadow-sm glass">
            {children}
          </div>
        </div>
      </div>

      {/* Decorative Brand Side Panel (Desktop only) */}
      <div className="hidden lg:block relative w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop"
          alt="Premium skincare glass jars and cream"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-emerald/35 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-emerald via-transparent to-transparent opacity-90" />
        
        {/* Decorative Quote */}
        <div className="absolute bottom-16 left-16 right-16 text-brand-cream space-y-3.5">
          <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-rose" /> Clean Skincare
          </span>
          <blockquote className="text-3xl font-bold font-serif leading-tight">
            &quot;Beauty is self-care normalized. Elevate your daily ritual with dermatological purity.&quot;
          </blockquote>
          <p className="text-xs text-brand-rose/80">— L&apos;ÉLIXIR Laboratories</p>
        </div>
      </div>

    </div>
  )
}

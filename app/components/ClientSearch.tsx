"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

export default function ClientSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function handleChange(nextQuery: string) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      const trimmedQuery = nextQuery.trim()

      if (pathname === "/products") {
      const params = new URLSearchParams(searchParams.toString())
        if (trimmedQuery) {
          params.set("search", trimmedQuery)
        } else {
          params.delete("search")
        }
        params.delete("page")
        const queryString = params.toString()
        router.push(queryString ? `/products?${params.toString()}` : "/products")
      } else {
        if (!trimmedQuery) {
          return
        }
        router.push(`/products?search=${encodeURIComponent(trimmedQuery)}`)
      }
    }, 500)
  }

  const routeSearch = pathname === "/products" ? (searchParams.get("search") || "") : ""
  const inputKey = `${pathname}:${routeSearch}`

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-brand-emerald/50" />
      </div>
      <input
        key={inputKey}
        type="search"
        defaultValue={routeSearch}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search cleanser, serum, retinol, acne, ingredients..."
        className="w-full pl-9 pr-4 py-2 text-sm bg-white/80 border border-brand-rose/30 rounded-full focus:outline-none focus:ring-1 focus:ring-brand-emerald focus:border-brand-emerald transition-all"
      />
    </div>
  )
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

interface Bucket {
  tokens: number
  lastRefilled: number
}

const generalBuckets = new Map<string, Bucket>()
const authBuckets = new Map<string, Bucket>()

const LIMITS = {
  general: { max: 100, intervalMs: 60000 },
  auth: { max: 15, intervalMs: 60000 }
}

const CUSTOMER_ONLY_ROUTES = ["/cart", "/wishlist", "/orders", "/profile", "/checkout", "/notifications"]
const AUTH_ROUTES = ["/login", "/signup"]

function isRateLimited(ip: string, isAuthRoute: boolean): boolean {
  const limit = isAuthRoute ? LIMITS.auth : LIMITS.general
  const buckets = isAuthRoute ? authBuckets : generalBuckets

  const now = Date.now()
  let bucket = buckets.get(ip)

  if (!bucket) {
    bucket = { tokens: limit.max, lastRefilled: now }
    buckets.set(ip, bucket)
  }

  const elapsed = now - bucket.lastRefilled
  const refillRate = limit.max / limit.intervalMs
  const refillAmount = elapsed * refillRate

  if (refillAmount > 0) {
    bucket.tokens = Math.min(limit.max, bucket.tokens + refillAmount)
    bucket.lastRefilled = now
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return false
  }

  return true
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const { pathname } = url

  const forwardedFor = req.headers.get("x-forwarded-for")
  const ip = (forwardedFor ? forwardedFor.split(",")[0] : null) || "127.0.0.1"

  const isAuthRoute = pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth")

  const isStatic = pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")

  if (!isStatic && isRateLimited(ip, isAuthRoute)) {
    const acceptHeader = req.headers.get("accept") || ""

    if (acceptHeader.includes("text/html")) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Too Many Requests</title>
            <style>
              body { font-family: system-ui, sans-serif; background: #FAF6F0; color: #1E2E24; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: white; border: 1px solid #E8D5CD; padding: 2.5rem; border-radius: 1.5rem; text-align: center; max-width: 400px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
              h1 { color: #0C3E26; font-size: 1.75rem; margin-top: 0; }
              p { font-size: 0.95rem; color: #4A4A4A; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Too Many Requests</h1>
              <p>You have made too many requests in a short period. Please wait a minute and try again.</p>
            </div>
          </body>
        </html>`,
        {
          status: 429,
          headers: {
            "Content-Type": "text/html",
            "Retry-After": "60"
          }
        }
      )
    }

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Too many requests. Please try again later."
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60"
        }
      }
    )
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET
  })

  const isAuthenticated = !!token
  const isAdmin = token?.role === "admin"

  function getSafeCallbackUrl() {
    const callback = url.searchParams.get("callbackUrl")
    if (!callback || !callback.startsWith("/") || callback.startsWith("//")) {
      return null
    }
    if (AUTH_ROUTES.some((route) => callback.startsWith(route)) || callback.startsWith("/auth-callback")) {
      return null
    }
    return callback
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const callback = pathname + url.search
      url.pathname = "/login"
      url.search = ""
      url.searchParams.set("callbackUrl", callback)
      return NextResponse.redirect(url)
    }

    if (!isAdmin) {
      url.pathname = "/"
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  if (CUSTOMER_ONLY_ROUTES.some((path) => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const callback = pathname + url.search
      url.pathname = "/login"
      url.search = ""
      url.searchParams.set("callbackUrl", callback)
      return NextResponse.redirect(url)
    }

    if (isAdmin) {
      url.pathname = "/admin/dashboard"
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  if (AUTH_ROUTES.some((path) => pathname.startsWith(path)) && isAuthenticated) {
    const safeCallbackUrl = getSafeCallbackUrl()
    if (safeCallbackUrl && (!isAdmin || safeCallbackUrl.startsWith("/admin"))) {
      return NextResponse.redirect(new URL(safeCallbackUrl, req.url))
    }

    url.pathname = isAdmin ? "/admin/dashboard" : "/"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api/upload).*)",
  ],
}

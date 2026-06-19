"use client"

import { useMemo, useState, useTransition, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, ArrowRight, Loader2 } from "lucide-react"

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitError, setSubmitError] = useState("")

  const queryError = useMemo(() => {
    const err = searchParams.get("error")
    if (err === "OAuthAccountNotLinked") {
      return "This email is already associated with another provider. Please use your credentials or correct OAuth sign-in."
    }
    if (err === "AccessDenied") {
      return "Access denied: your account may be deactivated or suspended."
    }
    return err || ""
  }, [searchParams])

  const errorMsg = submitError || queryError

  const requestedCallbackUrl = searchParams.get("callbackUrl")
  const rawCallbackUrl =
    requestedCallbackUrl && requestedCallbackUrl.startsWith("/") && !requestedCallbackUrl.startsWith("//")
      ? requestedCallbackUrl
      : "/"
  const callbackUrl = `/auth-callback?callbackUrl=${encodeURIComponent(rawCallbackUrl)}`

  function handleCredentialsLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError("")

    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email: email.toLowerCase(),
          password,
          redirect: false,
          callbackUrl
        })

        if (res?.error) {
          setSubmitError(res.error)
        } else {
          router.push(callbackUrl)
          router.refresh()
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred"
        setSubmitError(message)
      }
    })
  }

  function handleGoogleLogin() {
    setSubmitError("")
    signIn("google", { callbackUrl })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-serif text-brand-emerald text-center lg:text-left">Welcome Back</h2>
        <p className="text-xs text-brand-charcoal/50 mt-1 text-center lg:text-left">Sign in to resume your clean skin care ritual.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700 font-semibold leading-relaxed">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Email Address</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-brand-cream/20 border border-brand-rose/25 rounded-xl text-sm p-3 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-semibold"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-brand-cream/20 border border-brand-rose/25 rounded-xl text-sm p-3 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-semibold"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-brand-emerald text-brand-cream hover:bg-brand-emerald/90 py-3 rounded-full text-sm font-semibold tracking-wide transition-all shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying credentials...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="relative flex items-center justify-center py-2 text-xs uppercase text-brand-charcoal/30">
        <div className="absolute inset-x-0 h-px bg-brand-rose/15" />
        <span className="relative bg-white px-3 font-semibold">Or continue with</span>
      </div>

      <button
        onClick={handleGoogleLogin}
        type="button"
        className="w-full border border-brand-rose/25 hover:border-brand-rose/65 bg-white text-brand-charcoal hover:bg-brand-cream py-3 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.567 0-6.47-2.903-6.47-6.47s2.903-6.47 6.47-6.47c1.554 0 2.978.55 4.1 1.465l3.14-3.14C19.167 1.83 15.938 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.76 0 11.76-4.76 11.76-11.76 0-.648-.065-1.243-.194-1.83H12.24z"
          />
        </svg>
        Sign In with Google
      </button>

      <p className="text-center text-xs text-brand-charcoal/60 pt-2">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-brand-emerald hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 py-6 text-center animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto" />
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-12 bg-slate-100 rounded-xl" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}

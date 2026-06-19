"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signUpUser } from "@/lib/actions/authActions"
import Link from "next/link"
import { ShieldAlert, ArrowRight, Loader2, Check } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    startTransition(async () => {
      const formData = new FormData()
      formData.set("name", name)
      formData.set("email", email)
      formData.set("password", password)

      const res = await signUpUser(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg("Account created successfully! Redirecting to login...")
        setTimeout(() => {
          router.push("/login?registered=true")
        }, 1500)
      }
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-serif text-brand-emerald text-center lg:text-left">Create Account</h2>
        <p className="text-xs text-brand-charcoal/50 mt-1 text-center lg:text-left">Join the circle for personalized skin rituals.</p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-700 font-semibold leading-relaxed">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-green-800 font-semibold">
          <Check className="w-4.5 h-4.5 shrink-0 text-green-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-brand-charcoal/50 uppercase block mb-1">Full Name</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full bg-brand-cream/20 border border-brand-rose/25 rounded-xl text-sm p-3 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-semibold"
          />
        </div>

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
            placeholder="Min. 6 characters"
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
              Creating account...
            </>
          ) : (
            <>
              Sign Up
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Link to Login */}
      <p className="text-center text-xs text-brand-charcoal/60 pt-2">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand-emerald hover:underline">
          Sign In
        </Link>
      </p>

    </div>
  )
}

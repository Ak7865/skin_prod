export const dynamic = "force-dynamic"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const callbackUrl =
    params.callbackUrl && params.callbackUrl.startsWith("/") && !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : "/"
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  // Redirect admins to the dashboard, and customers to their intended destination
  if (session?.user?.role === "admin") {
    redirect("/admin/dashboard")
  } else {
    // If the callbackUrl is /auth-callback or /login itself, fall back to storefront root
    const target = callbackUrl.includes("/auth-callback") || callbackUrl.includes("/login") ? "/" : callbackUrl
    redirect(target)
  }
}

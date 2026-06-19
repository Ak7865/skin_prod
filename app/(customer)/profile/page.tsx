export const dynamic = "force-dynamic";
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"
import Address from "@/lib/models/Address"
import PaymentMethod from "@/lib/models/PaymentMethod"
import ProfileTabs from "@/app/components/ProfileTabs"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const session = await auth()
  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/profile"))
  }

  await dbConnect()

  const user = await User.findById(session.user.id)
  if (!user) {
    redirect("/login")
  }

  const addresses = await Address.find({ user: session.user.id }).sort({ isDefault: -1 })
  const cards = await PaymentMethod.find({ user: session.user.id })
  const queryParams = await searchParams

  const plainUser = {
    name: user.name,
    email: user.email,
    image: user.image || "",
    isOAuth: !user.password
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Dynamic Profile Cover Banner */}
      <div className="bg-brand-emerald text-brand-cream rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        {plainUser.image ? (
          <img
            src={plainUser.image}
            alt={plainUser.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-brand-rose"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand-rose text-brand-emerald flex items-center justify-center text-3xl font-extrabold font-serif">
            {plainUser.name ? plainUser.name[0].toUpperCase() : "U"}
          </div>
        )}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif">{plainUser.name}</h1>
          <p className="text-xs text-brand-rose/80">{plainUser.email}</p>
          <span className="inline-block text-[10px] uppercase font-bold tracking-wider bg-white/10 border border-white/20 px-3 py-1 rounded-full mt-1.5">
            Member Since {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <ProfileTabs
        user={plainUser}
        addresses={JSON.parse(JSON.stringify(addresses))}
        cards={JSON.parse(JSON.stringify(cards))}
        activeTabQuery={queryParams.tab}
      />
    </div>
  )
}

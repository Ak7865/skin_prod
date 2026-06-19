export const dynamic = "force-dynamic";
import { getAdminNotifications } from "@/lib/actions/adminActions"
import AdminNotificationsList from "@/app/components/AdminNotificationsList"

export default async function AdminNotificationsPage() {
  const res = await getAdminNotifications()
  const notifications = res.success ? res.notifications : []

  return (
    <AdminNotificationsList initialNotifications={notifications} />
  )
}
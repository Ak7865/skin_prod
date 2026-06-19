export const dynamic = "force-dynamic";
import { getAnalyticsData } from "@/lib/actions/analyticsActions"
import AnalyticsPanel from "@/app/components/AnalyticsPanel"

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const queryParams = await searchParams;
  const { startDate, endDate } = queryParams;

  const res = await getAnalyticsData(startDate, endDate)
  const analyticsData = res.success && res.data ? res.data : {
    kpis: {
      totalRevenue: 0,
      totalSales: 0,
      ordersCount: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      avgOrderValue: 0
    },
    salesTrend: [],
    bestSellers: [],
    topCategories: [],
    topCustomers: [],
    lowStock: []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-slate-800">Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Review core financials, warnings, customer behaviors, and order fulfillment queues.</p>
      </div>

      <AnalyticsPanel
        initialData={analyticsData}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  )
}

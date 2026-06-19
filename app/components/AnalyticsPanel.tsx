"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, TrendingUp, Archive, AlertTriangle, ShieldCheck } from "lucide-react"

function getDefaultStartDate() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().split("T")[0]
}

function getDefaultEndDate() {
  return new Date().toISOString().split("T")[0]
}

interface AnalyticsPanelProps {
  initialData: {
    kpis: {
      totalRevenue: number
      totalSales: number
      ordersCount: number
      deliveredOrders: number
      cancelledOrders: number
      pendingOrders: number
      avgOrderValue: number
    }
    salesTrend: { date: string; revenue: number; orders: number }[]
    bestSellers: { _id: string; name: string; totalQty: number; totalRevenue: number }[]
    topCategories: { _id: string; revenue: number; sales: number }[]
    topCustomers: { _id: string; name: string; email: string; avatar?: string; totalSpend: number; ordersCount: number }[]
    lowStock: { _id: string; name: string; brand: string; stock: number; price: number }[]
  }
  startDate?: string
  endDate?: string
}

export default function AnalyticsPanel({ initialData, startDate, endDate }: AnalyticsPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [startVal, setStartVal] = useState(() => startDate || getDefaultStartDate())
  const [endVal, setEndVal] = useState(() => endDate || getDefaultEndDate())

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null)

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      router.push(`/admin/dashboard?startDate=${startVal}&endDate=${endVal}`)
    })
  }

  const { kpis, salesTrend, bestSellers, topCategories, topCustomers, lowStock } = initialData

  // -------------------------------------------------------------
  // PLOTTING DEVIATION CALCULATIONS FOR THE SVG TREND CHART
  // -------------------------------------------------------------
  const chartHeight = 220
  const chartWidth = 500
  const padding = 35

  const maxRevenue = Math.max(...salesTrend.map((t) => t.revenue), 100)
  const minRevenue = 0

  const points = salesTrend.map((t, index) => {
    const x = padding + (index / (salesTrend.length - 1 || 1)) * (chartWidth - padding * 2)
    // Invert Y coordinate since 0,0 is top-left in SVG
    const y = chartHeight - padding - ((t.revenue - minRevenue) / (maxRevenue - minRevenue)) * (chartHeight - padding * 2)
    return { x, y, label: t.date, val: t.revenue }
  })

  // Create SVG path string
  let pathD = ""
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
  }

  // Create area fill string
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : ""

  return (
    <div className="space-y-8">
      
      {/* Date Range controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-serif">Skincare Business Analytics</h2>
          <p className="text-xs text-slate-400">Perform complex reporting and filter operations.</p>
        </div>

        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={startVal}
            onChange={(e) => setStartVal(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 font-semibold"
          />
          <span className="text-slate-400 text-xs font-bold">to</span>
          <input
            type="date"
            value={endVal}
            onChange={(e) => setEndVal(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 focus:ring-1 focus:ring-emerald-500 font-semibold"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            {isPending ? "Syncing..." : "Update Range"}
          </button>
        </form>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex justify-between items-center">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Total Revenue</span>
            <p className="text-2xl font-black text-slate-800">${kpis.totalRevenue.toFixed(2)}</p>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Avg Order: ${kpis.avgOrderValue.toFixed(2)}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sales count */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex justify-between items-center">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Units Sold</span>
            <p className="text-2xl font-black text-slate-800">{kpis.totalSales} units</p>
            <span className="text-[10px] text-slate-400 font-semibold">Across {kpis.ordersCount} invoices</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex justify-between items-center">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Delivered Orders</span>
            <p className="text-2xl font-black text-slate-800">{kpis.deliveredOrders}</p>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Success: {kpis.ordersCount > 0 ? Math.round((kpis.deliveredOrders / kpis.ordersCount) * 100) : 100}%
            </span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Cancelled / Pending */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex justify-between items-center">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Fulfillment Queue</span>
            <p className="text-2xl font-black text-slate-800">{kpis.pendingOrders} Active</p>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Cancelled: {kpis.cancelledOrders}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Archive className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SVG Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Revenue Trend Line</h3>

          {salesTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 italic">No sales trend data for this date range.</div>
          ) : (
            <div className="relative">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                
                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding + ratio * (chartHeight - padding * 2)
                  const value = maxRevenue - ratio * (maxRevenue - minRevenue)
                  return (
                    <g key={i} className="opacity-15">
                      <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
                      <text x={padding - 5} y={y + 4} textAnchor="end" className="text-[9px] fill-slate-500 font-mono font-bold">${Math.round(value)}</text>
                    </g>
                  )
                })}

                {/* Shaded Area underneath line */}
                {areaD && <path d={areaD} fill="url(#chartGradient)" className="opacity-10" />}
                
                {/* Line Path */}
                {pathD && <path d={pathD} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Interactive Points */}
                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.label === p.label ? "6" : "4"}
                    className="fill-emerald-600 stroke-white stroke-2 cursor-pointer hover:r-6 transition-all"
                    onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, label: p.label, value: p.val })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}

                {/* X Axis Labels */}
                {points.map((p, idx) => {
                  // Only display every Nth label to prevent overlaps
                  const skipCount = Math.ceil(points.length / 6)
                  if (idx % skipCount !== 0 && idx !== points.length - 1) return null

                  return (
                    <text
                      key={idx}
                      x={p.x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-bold font-mono opacity-80"
                    >
                      {p.label.slice(-5)}
                    </text>
                  )
                })}

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute bg-slate-900 text-white rounded-xl shadow-xl p-2.5 text-[10px] space-y-0.5 border border-slate-800"
                  style={{
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                    top: `${(hoveredPoint.y / chartHeight) * 100 - 32}%`,
                    transform: "translateX(-50%)"
                  }}
                >
                  <p className="text-slate-400 font-semibold uppercase">{hoveredPoint.label}</p>
                  <p className="font-bold text-emerald-400 text-xs">Revenue: ${hoveredPoint.value.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-rose-600 text-sm uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4.5 h-4.5" /> Inventory Warnings
          </h3>

          {lowStock.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-xs text-slate-400 italic">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
              All items abundantly stocked!
            </div>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {lowStock.map((prod) => (
                <div
                  key={prod._id}
                  className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800 line-clamp-1">{prod.name}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">{prod.brand}</span>
                  </div>
                  <span className="bg-rose-100 text-rose-700 font-black px-2.5 py-1 rounded-full text-[10px]">
                    {prod.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Lists rows: Best Sellers, Top Categories, Top Customers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Best Sellers */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Top Formulation Sellers</h4>
          <div className="divide-y divide-slate-100">
            {bestSellers.map((item, idx) => (
              <div key={item._id} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                <div className="space-y-0.5">
                  <span className="font-black text-slate-400 block">0{idx + 1}.</span>
                  <p className="font-bold text-slate-800 line-clamp-1">{item.name}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">${item.totalRevenue.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{item.totalQty} sold</span>
                </div>
              </div>
            ))}
            {bestSellers.length === 0 && <p className="text-slate-400 text-xs italic py-4">No data.</p>}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Top Performing Categories</h4>
          <div className="divide-y divide-slate-100">
            {topCategories.map((item, idx) => (
              <div key={item._id} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                <div className="space-y-0.5">
                  <span className="font-black text-slate-400 block">0{idx + 1}.</span>
                  <p className="font-bold text-slate-800 capitalize">{item._id}s</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">${item.revenue.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{item.sales} sold</span>
                </div>
              </div>
            ))}
            {topCategories.length === 0 && <p className="text-slate-400 text-xs italic py-4">No data.</p>}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Top Skincare Customers</h4>
          <div className="divide-y divide-slate-100">
            {topCustomers.map((c) => (
              <div key={c._id} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  {c.avatar ? (
                    <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold font-mono">
                      {c.name ? c.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 line-clamp-1">{c.name}</p>
                    <span className="text-[9px] text-slate-400 font-semibold block">{c.email}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">${c.totalSpend.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{c.ordersCount} orders</span>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-slate-400 text-xs italic py-4">No data.</p>}
          </div>
        </div>

      </div>

    </div>
  )
}

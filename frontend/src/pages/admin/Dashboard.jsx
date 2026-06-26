import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DirhamSymbol } from 'dirham/react';
import DateRangeFilter, { computeDateRange } from './DateRangeFilter';
import {
  TrendingUp, ShoppingBag, Clock, XCircle,
  Gem, Trophy, Star, LayoutGrid,
} from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import api from '../../services/api';
import { StatusChip } from './adminUtils';
import { useAdminTheme } from './AdminThemeContext';
import { StatCard } from '../../components/admin/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/admin/ui/Card';

// ── Palette ───────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'];
const BAR_COLOR  = '#6366f1';

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { mode } = useAdminTheme();
  const isDark = mode === 'dark';

  const [summary,      setSummary]      = useState(null);
  const [sales,        setSales]        = useState([]);
  const [statusData,   setStatusData]   = useState([]);
  const [topProducts,  setTopProducts]  = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [dateRange,    setDateRange]    = useState(() => computeDateRange('today'));

  const handleFilterChange = useCallback((range) => setDateRange(range), []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate)   params.endDate   = dateRange.endDate;

    Promise.all([
      api.get('/admin/analytics/summary',          { params }),
      api.get('/admin/analytics/sales',            { params }),
      api.get('/admin/analytics/orders-by-status', { params }),
      api.get('/admin/analytics/products',         { params }),
      api.get('/admin/orders',                     { params: { ...params, limit: 8 } }),
    ]).then(([s, sal, st, top, ord]) => {
      setSummary(s.data.data);
      setSales(sal.data.data || []);
      setStatusData(st.data.data || []);
      setTopProducts(top.data.data?.slice(0, 8) || []);
      setRecentOrders(ord.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  // Derived metrics from API data
  const derived = useMemo(() => {
    const rev    = summary?.totalRevenue || 0;
    const orders = summary?.totalOrders  || 0;
    const getStatus = (s) => statusData.find(x => x.status === s)?.count || 0;

    const pending    = getStatus('pending');
    const delivered  = getStatus('delivered');
    const cancelled  = getStatus('cancelled');
    const processing = getStatus('processing');

    const trend = sales.length >= 2
      ? Math.round(((sales.at(-1).revenue - sales.at(-2).revenue) / (sales.at(-2).revenue || 1)) * 100)
      : null;
    const orderTrend = sales.length >= 2
      ? Math.round(((sales.at(-1).orders - sales.at(-2).orders) / (sales.at(-2).orders || 1)) * 100)
      : null;

    const categories = topProducts.reduce((acc, p) => {
      if (p.category) acc[p.category] = (acc[p.category] || 0) + (p.sold || 1);
      return acc;
    }, {});

    return {
      rev, orders, trend, orderTrend,
      pending, delivered, cancelled, processing,
      categories: Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    };
  }, [summary, sales, statusData, topProducts]);

  const now = new Date().toLocaleDateString('en-AE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── ApexCharts: Revenue area ──────────────────────────────────────────────
  const revenueLabels = sales.map(s => s.month);
  const revenueData   = sales.map(s => s.revenue);

  const revenueOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#6366f1'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0, stops: [0, 100] },
    },
    grid: {
      borderColor: isDark ? '#1f2937' : '#f1f5f9',
      strokeDashArray: 4,
      padding: { left: -4, right: 0 },
    },
    xaxis: {
      categories: revenueLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: isDark ? '#6b7280' : '#9ca3af', fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#6b7280' : '#9ca3af', fontSize: '11px' },
        formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (v) => `AED ${v.toLocaleString()}` },
    },
    markers: { size: 4, colors: ['#6366f1'], strokeWidth: 0 },
  };

  // ── ApexCharts: Status donut ──────────────────────────────────────────────
  const statusLabels = statusData.map(d => d.status);
  const statusValues = statusData.map(d => d.count);

  const donutOptions = {
    chart: { type: 'donut', background: 'transparent', fontFamily: 'Inter, sans-serif' },
    theme: { mode: isDark ? 'dark' : 'light' },
    labels: statusLabels,
    colors: PIE_COLORS,
    legend: { show: false },
    plotOptions: { pie: { donut: { size: '62%' } } },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(0)}%`,
      style: { fontSize: '11px', fontWeight: 700, colors: ['#fff'] },
      dropShadow: { enabled: false },
    },
    tooltip: { theme: isDark ? 'dark' : 'light' },
    stroke: { width: 0 },
  };

  // ── ApexCharts: Top products horizontal bar ───────────────────────────────
  const topProductsSlice = topProducts.slice(0, 6);
  const barLabels  = topProductsSlice.map(p => p.name?.length > 18 ? p.name.slice(0, 18) + '…' : p.name);
  const barData    = topProductsSlice.map(p => p.sold || 0);

  const barOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: [BAR_COLOR],
    plotOptions: {
      bar: { horizontal: true, borderRadius: 5, barHeight: '60%', distributed: false },
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: '10px', colors: [isDark ? '#d1d5db' : '#6b7280'] },
      formatter: (v) => v,
      offsetX: 6,
      textAnchor: 'start',
    },
    grid: {
      borderColor: isDark ? '#1f2937' : '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: barLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: isDark ? '#6b7280' : '#9ca3af', fontSize: '10px' } },
    },
    yaxis: {
      labels: { style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' } },
    },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  // ── Skeleton rows ─────────────────────────────────────────────────────────
  const skeletonRows = [1, 2, 3, 4].map(i => (
    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
      {[1, 2, 3, 4, 5].map(j => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  ));

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{now}</p>
        </div>
        <DateRangeFilter currentPreset={dateRange.preset || 'today'} onChange={handleFilterChange} />
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Gradient cards for first two */}
        <StatCard
          gradient
          color="indigo"
          title="Total Revenue"
          value={<span className="flex items-center gap-1"><DirhamSymbol size="0.82em" /> {derived.rev.toLocaleString()}</span>}
          change={derived.trend}
          changeLabel={dateRange.label || 'Today'}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          gradient
          color="violet"
          title="Total Orders"
          value={derived.orders.toLocaleString()}
          change={derived.orderTrend}
          changeLabel={dateRange.label || 'Today'}
          icon={ShoppingBag}
          loading={loading}
        />
        <StatCard
          color="amber"
          title="Pending Orders"
          value={loading ? '—' : derived.pending.toLocaleString()}
          changeLabel="Awaiting processing"
          icon={Clock}
        />
        <StatCard
          color="rose"
          title="Cancelled Orders"
          value={loading ? '—' : derived.cancelled.toLocaleString()}
          changeLabel="Refunded / void"
          icon={XCircle}
        />
      </div>

      {/* ── Charts Row 1: Revenue Trend + Order Status Donut ────────────── */}
      <div className="flex gap-5 mb-5 flex-wrap lg:flex-nowrap">
        {/* Revenue area chart */}
        <div className="flex-1 min-w-0 lg:flex-[2_1_0]">
          <Card>
            <CardHeader
              title="Revenue Trend"
              subtitle={dateRange.label || 'Today'}
              action={
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={11} /> Revenue
                </span>
              }
            />
            <CardBody>
              {sales.length > 0 ? (
                <ReactApexChart
                  type="area"
                  series={[{ name: 'Revenue', data: revenueData }]}
                  options={revenueOptions}
                  height={240}
                />
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Sales data will appear once orders are placed.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Order status donut */}
        <div className="flex-1 min-w-0 lg:flex-[1_1_0]">
          <Card className="h-full">
            <CardHeader
              title="Orders by Status"
              action={
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Gem size={11} /> Status
                </span>
              }
            />
            <CardBody>
              {statusData.length > 0 ? (
                <>
                  <ReactApexChart
                    type="donut"
                    series={statusValues}
                    options={donutOptions}
                    height={180}
                  />
                  <div className="mt-3 space-y-2">
                    {statusData.map((d, i) => (
                      <div key={d.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{d.status}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No order data yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Charts Row 2: Best Selling + Top Categories ──────────────── */}
      <div className="flex gap-5 mb-5 flex-wrap md:flex-nowrap">
        {/* Horizontal bar — best sellers */}
        <div className="flex-[7_1_0] min-w-0 w-full md:w-auto">
          <Card className="h-full">
            <CardHeader
              title="Best Selling Products"
              subtitle={dateRange.label || 'Today'}
              action={
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Trophy size={11} /> Top 6
                </span>
              }
            />
            <CardBody>
              {topProducts.length > 0 ? (
                <ReactApexChart
                  type="bar"
                  series={[{ name: 'Units Sold', data: barData }]}
                  options={barOptions}
                  height={220}
                />
              ) : (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No sales data yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Top Categories + Trending products */}
        <div className="flex-[5_1_0] min-w-0 w-full md:w-auto">
          <Card className="h-full">
            <CardHeader
              title="Top Categories"
              action={
                <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <LayoutGrid size={11} /> Categories
                </span>
              }
            />
            <CardBody>
              {derived.categories.length > 0 ? (
                <div className="space-y-3">
                  {derived.categories.map((cat, i) => {
                    const max = derived.categories[0].value;
                    const pct = Math.round((cat.value / max) * 100);
                    const color = PIE_COLORS[i % PIE_COLORS.length];
                    return (
                      <div key={cat.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat.name}</span>
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{cat.value} sold</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No category data yet.</p>
                </div>
              )}

              {topProducts.length > 0 && (
                <>
                  <hr className="my-4 border-gray-100 dark:border-gray-800" />
                  <div className="flex items-center gap-1.5 mb-3">
                    <Star size={14} className="text-amber-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Trending Products</span>
                  </div>
                  <div className="space-y-2">
                    {topProducts.slice(0, 4).map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5 whitespace-nowrap">
                          {p.sold || 0} sold
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Recent Orders ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Recent Orders"
          action={
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-1.5 transition-colors"
            >
              View All
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && recentOrders.length === 0
                ? skeletonRows
                : recentOrders.length > 0
                  ? recentOrders.map(o => (
                    <tr
                      key={o._id}
                      className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                        #{o._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {o.user?.name || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                          <DirhamSymbol size="0.85em" /> {o.totalAmount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <StatusChip status={o.status} />
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                  : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                        No orders yet.
                      </td>
                    </tr>
                  )
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

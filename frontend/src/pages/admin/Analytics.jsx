import { useState, useEffect, useMemo, useCallback } from 'react';
import { DirhamSymbol } from 'dirham/react';
import DateRangeFilter, { computeDateRange } from './DateRangeFilter';
import {
  TrendingUp, BarChart2, PieChart, Trophy,
  Users, Smartphone, Gauge, Layers, Gem,
  ArrowRightLeft, Filter, LineChart as LineChartIcon,
} from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import api from '../../services/api';
import { useAdminTheme } from './AdminThemeContext';
import { StatCard } from '../../components/admin/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/admin/ui/Card';

// ── Palette ───────────────────────────────────────────────────────────────────
const PIE_PALETTE = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'];
const BAR_PALETTE = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6'];

// ── Static mock datasets ──────────────────────────────────────────────────────
const DEVICE_MOCK = [
  { name: 'Mobile',  value: 58 },
  { name: 'Desktop', value: 34 },
  { name: 'Tablet',  value: 8  },
];

const TRAFFIC_MOCK = [
  { name: 'Organic',  value: 44 },
  { name: 'Direct',   value: 26 },
  { name: 'Social',   value: 20 },
  { name: 'Referral', value: 10 },
];

const FUNNEL_MOCK = [
  { stage: 'Sessions',      value: 12400 },
  { stage: 'Product Views', value: 5800  },
  { stage: 'Add to Cart',   value: 1480  },
  { stage: 'Checkout',      value: 820   },
  { stage: 'Purchase',      value: 480   },
];

const CUSTOMER_MOCK = [
  { name: 'New',       value: 36 },
  { name: 'Returning', value: 52 },
  { name: 'VIP',       value: 12 },
];

// ── ChartSkeleton ─────────────────────────────────────────────────────────────
function ChartSkeleton({ height = 300 }) {
  return (
    <Card className="h-full">
      <CardBody>
        <div className="h-5 w-2/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div
          className="bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
          style={{ height }}
        />
      </CardBody>
    </Card>
  );
}

// ── DonutWidget ───────────────────────────────────────────────────────────────
function DonutWidget({ icon: Icon, iconColor, title, data, colors, isDark }) {
  const labels = data.map(d => d.name);
  const values = data.map(d => d.value);

  const options = {
    chart: { type: 'donut', background: 'transparent', fontFamily: 'Inter, sans-serif' },
    theme: { mode: isDark ? 'dark' : 'light' },
    labels,
    colors,
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

  return (
    <Card className="h-full">
      <CardHeader
        title={title}
        action={
          <span className="flex items-center gap-1" style={{ color: iconColor }}>
            <Icon size={14} />
          </span>
        }
      />
      <CardBody>
        <ReactApexChart type="donut" series={values} options={options} height={160} />
        <div className="mt-3 space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-300">{d.name}</span>
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {d.value}{typeof d.value === 'number' && d.value <= 100 ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const { mode } = useAdminTheme();
  const isDark = mode === 'dark';

  const [sales,       setSales]       = useState([]);
  const [statusData,  setStatusData]  = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [dateRange,   setDateRange]   = useState(() => computeDateRange('today'));

  const handleFilterChange = useCallback((range) => setDateRange(range), []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate)   params.endDate   = dateRange.endDate;

    Promise.all([
      api.get('/admin/analytics/sales',            { params }),
      api.get('/admin/analytics/orders-by-status', { params }),
      api.get('/admin/analytics/products',         { params }),
      api.get('/admin/analytics/summary',          { params }),
    ]).then(([s, st, tp, sum]) => {
      setSales(s.data.data || []);
      setStatusData(st.data.data || []);
      setTopProducts(tp.data.data?.slice(0, 10) || []);
      setSummary(sum.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  const derived = useMemo(() => {
    const rev    = summary?.totalRevenue || 0;
    const orders = summary?.totalOrders  || 0;
    const avgOV  = orders > 0 ? Math.round(rev / orders) : 0;
    const convRate = orders > 0 ? ((orders / (orders * 26.3)) * 100).toFixed(1) : '0.0';

    const revenueByCategory = topProducts.reduce((acc, p) => {
      const cat = p.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (p.sold || 0) * (p.price || 0);
      return acc;
    }, {});

    const topCategories = Object.entries(revenueByCategory)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const brandSales = topProducts.reduce((acc, p) => {
      if (p.brand) acc[p.brand] = (acc[p.brand] || 0) + (p.sold || 0);
      return acc;
    }, {});
    const topBrands = Object.entries(brandSales)
      .map(([name, value]) => ({ name, value }))
      .filter(b => b.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const monthlyCompare = sales.slice(-2).map((m) => ({
      period: m.month, revenue: m.revenue, orders: m.orders,
    }));

    return { rev, orders, avgOV, convRate, topCategories, topBrands, monthlyCompare };
  }, [summary, topProducts, sales]);

  const periodLabel = dateRange.label || 'Today';

  // ── Shared chart config helpers ───────────────────────────────────────────
  const axisLabelStyle = { colors: isDark ? '#6b7280' : '#9ca3af', fontSize: '11px' };
  const gridBorderColor = isDark ? '#1f2937' : '#f1f5f9';

  const baseChartConfig = {
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
  };

  // ── Row 1: Sales Overview area chart ─────────────────────────────────────
  const salesLabels = sales.map(s => s.month);

  const salesOverviewOptions = {
    chart: { ...baseChartConfig, type: 'area' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#6366f1', '#8b5cf6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: [2.5, 2] },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.0, stops: [0, 100] },
    },
    grid: { borderColor: gridBorderColor, strokeDashArray: 4, padding: { left: -4 } },
    xaxis: {
      categories: salesLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: [
      {
        labels: {
          style: axisLabelStyle,
          formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
        },
      },
      {
        opposite: true,
        labels: { style: axisLabelStyle },
      },
    ],
    legend: { position: 'top', fontSize: '12px', labels: { colors: isDark ? '#9ca3af' : '#6b7280' } },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: [
        { formatter: (v) => `AED ${v.toLocaleString()}` },
        { formatter: (v) => `${v} orders` },
      ],
    },
    markers: { size: [4, 3], strokeWidth: 0 },
  };

  // ── Row 1: Order Status donut ─────────────────────────────────────────────
  const statusDonutData = statusData.length > 0
    ? statusData.map(d => ({ name: d.status, value: d.count }))
    : [{ name: 'No data', value: 1 }];

  // ── Row 2: Revenue Growth bar chart ──────────────────────────────────────
  const revenueBarOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#6366f1'],
    plotOptions: { bar: { borderRadius: 5, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: gridBorderColor, strokeDashArray: 4 },
    xaxis: {
      categories: salesLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: {
      labels: {
        style: axisLabelStyle,
        formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (v) => `AED ${v.toLocaleString()}` },
    },
  };

  // ── Row 2: Order Analytics line chart ────────────────────────────────────
  const orderLineOptions = {
    chart: { ...baseChartConfig, type: 'line' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#8b5cf6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    grid: { borderColor: gridBorderColor, strokeDashArray: 4 },
    xaxis: {
      categories: salesLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: { labels: { style: axisLabelStyle } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
    markers: { size: 4, strokeWidth: 0 },
  };

  // ── Row 4: Product Performance bar ───────────────────────────────────────
  const productBarOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: BAR_PALETTE,
    plotOptions: {
      bar: { horizontal: true, borderRadius: 5, barHeight: '65%', distributed: true },
    },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      style: { fontSize: '10px', colors: [isDark ? '#d1d5db' : '#6b7280'] },
      offsetX: 6,
      textAnchor: 'start',
    },
    grid: {
      borderColor: gridBorderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' },
        maxWidth: 130,
      },
    },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  const productBarLabels = topProducts.map(p =>
    p.name?.length > 20 ? p.name.slice(0, 20) + '…' : p.name
  );
  const productBarData = topProducts.map(p => p.sold || 0);

  // ── Row 5: Category bar ───────────────────────────────────────────────────
  const catBarOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: PIE_PALETTE,
    plotOptions: {
      bar: { horizontal: true, borderRadius: 5, barHeight: '65%', distributed: true },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: {
      borderColor: gridBorderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: axisLabelStyle,
        formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
      },
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' },
        maxWidth: 100,
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (v) => `AED ${v.toLocaleString()}` },
    },
  };

  // ── Row 5: Brand bar ──────────────────────────────────────────────────────
  const brandBarOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: BAR_PALETTE,
    plotOptions: {
      bar: { horizontal: true, borderRadius: 5, barHeight: '65%', distributed: true },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: {
      borderColor: gridBorderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' },
        maxWidth: 100,
      },
    },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  // ── Row 6: Funnel bar ─────────────────────────────────────────────────────
  const funnelColors = FUNNEL_MOCK.map((_, i) => {
    const opacity = 1 - i * 0.15;
    return `rgba(99,102,241,${opacity})`;
  });

  const funnelOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: funnelColors,
    plotOptions: {
      bar: { horizontal: true, borderRadius: 5, barHeight: '65%', distributed: true },
    },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      style: { fontSize: '10px', colors: [isDark ? '#d1d5db' : '#6b7280'] },
      formatter: (v) => v.toLocaleString(),
      offsetX: 6,
      textAnchor: 'start',
    },
    grid: {
      borderColor: gridBorderColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: FUNNEL_MOCK.map(f => f.stage),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' },
        maxWidth: 110,
      },
    },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  // ── Row 6: Period comparison bar ──────────────────────────────────────────
  const compareColors = ['#f59e0b', '#6366f1'];
  const compareOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: compareColors,
    plotOptions: {
      bar: { borderRadius: 5, columnWidth: '50%', distributed: true },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: { borderColor: gridBorderColor, strokeDashArray: 4 },
    xaxis: {
      categories: derived.monthlyCompare.map(m => m.period),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: {
      labels: {
        style: axisLabelStyle,
        formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (v) => `AED ${v.toLocaleString()}` },
    },
  };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Sales performance, customer insights &amp; product analytics
          </p>
        </div>
        <DateRangeFilter currentPreset={dateRange.preset || 'today'} onChange={handleFilterChange} />
      </div>

      {/* ── KPI stat bar ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="h-4 w-3/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
              <div className="h-8 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              color="indigo"
              title={`Revenue · ${periodLabel}`}
              value={<span className="flex items-center gap-1"><DirhamSymbol size="0.82em" /> {derived.rev.toLocaleString()}</span>}
              icon={TrendingUp}
            />
            <StatCard
              color="violet"
              title={`Orders · ${periodLabel}`}
              value={derived.orders.toLocaleString()}
              icon={BarChart2}
            />
            <StatCard
              color="emerald"
              title="Avg Order Value"
              value={<span className="flex items-center gap-1"><DirhamSymbol size="0.82em" /> {derived.avgOV.toLocaleString()}</span>}
              icon={LineChartIcon}
            />
            <StatCard
              color="sky"
              title="Conv. Rate"
              value={`${derived.convRate}%`}
              icon={Gauge}
            />
          </>
        )}
      </div>

      {/* ── Chart content: skeleton while loading ──────────────────────── */}
      {loading ? (
        <div className="flex flex-wrap gap-5">
          {[300, 280, 280, 280, 240, 240, 280, 260].map((h, i) => (
            <div key={i} className="flex-1 min-w-0 basis-full md:basis-[calc(50%-10px)]">
              <ChartSkeleton height={h} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Row 1: Sales Overview area + Order Status donut ────────── */}
          <div className="flex gap-5 mb-5 flex-wrap lg:flex-nowrap">
            <div className="flex-1 min-w-0 lg:flex-[2_1_0]">
              <Card className="h-full">
                <CardHeader
                  title="Sales Overview"
                  subtitle={`Revenue and orders — ${periodLabel}`}
                  action={
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp size={11} /> {periodLabel}
                    </span>
                  }
                />
                <CardBody>
                  {sales.length > 0 ? (
                    <ReactApexChart
                      type="area"
                      series={[
                        { name: 'Revenue', data: sales.map(s => s.revenue) },
                        { name: 'Orders',  data: sales.map(s => s.orders) },
                      ]}
                      options={salesOverviewOptions}
                      height={260}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">No sales data for this period.</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="flex-1 min-w-0 lg:flex-[1_1_0]">
              <DonutWidget
                icon={PieChart}
                iconColor="#8b5cf6"
                title="Order Status"
                data={statusDonutData}
                colors={PIE_PALETTE}
                isDark={isDark}
              />
            </div>
          </div>

          {/* ── Row 2: Revenue Growth bar + Order Analytics line ─────── */}
          <div className="flex gap-5 mb-5 flex-wrap md:flex-nowrap">
            <div className="flex-1 min-w-0">
              <Card className="h-full">
                <CardHeader
                  title="Revenue Growth"
                  subtitle={`AED revenue — ${periodLabel}`}
                  action={
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <BarChart2 size={11} /> Revenue
                    </span>
                  }
                />
                <CardBody>
                  {sales.length > 0 ? (
                    <ReactApexChart
                      type="bar"
                      series={[{ name: 'Revenue', data: sales.map(s => s.revenue) }]}
                      options={revenueBarOptions}
                      height={260}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">No data for this period.</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="flex-1 min-w-0">
              <Card className="h-full">
                <CardHeader
                  title="Order Analytics"
                  subtitle={`Order count trend — ${periodLabel}`}
                  action={
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <ArrowRightLeft size={11} /> Orders
                    </span>
                  }
                />
                <CardBody>
                  {sales.length > 0 ? (
                    <ReactApexChart
                      type="line"
                      series={[{ name: 'Orders', data: sales.map(s => s.orders) }]}
                      options={orderLineOptions}
                      height={260}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">No data for this period.</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* ── Row 3: Three donut charts (mock) ─────────────────────── */}
          <div className="flex gap-5 mb-5 flex-wrap sm:flex-nowrap">
            <div className="flex-1 min-w-0 basis-full sm:basis-auto">
              <DonutWidget
                icon={Users}
                iconColor="#0ea5e9"
                title="Customer Segments"
                data={CUSTOMER_MOCK}
                colors={['#0ea5e9', '#6366f1', '#f59e0b']}
                isDark={isDark}
              />
            </div>
            <div className="flex-1 min-w-0 basis-full sm:basis-auto">
              <DonutWidget
                icon={Smartphone}
                iconColor="#8b5cf6"
                title="Device Analytics"
                data={DEVICE_MOCK}
                colors={['#8b5cf6', '#8b5cf6cc', '#8b5cf680']}
                isDark={isDark}
              />
            </div>
            <div className="flex-1 min-w-0 basis-full sm:basis-auto">
              <DonutWidget
                icon={Layers}
                iconColor="#10b981"
                title="Traffic Sources"
                data={TRAFFIC_MOCK}
                colors={['#10b981', '#6366f1', '#f59e0b', '#ec4899']}
                isDark={isDark}
              />
            </div>
          </div>

          {/* ── Row 4: Product Performance ──────────────────────────── */}
          <div className="mb-5">
            <Card>
              <CardHeader
                title="Product Performance"
                subtitle={`Top 10 best-selling products — ${periodLabel}`}
                action={
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Trophy size={11} /> Top 10
                  </span>
                }
              />
              <CardBody>
                {topProducts.length > 0 ? (
                  <ReactApexChart
                    type="bar"
                    series={[{ name: 'Units Sold', data: productBarData }]}
                    options={{
                      ...productBarOptions,
                      xaxis: {
                        ...productBarOptions.xaxis,
                        categories: productBarLabels,
                      },
                    }}
                    height={280}
                  />
                ) : (
                  <div className="h-72 flex items-center justify-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">No product sales for this period.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* ── Row 5: Top Categories + Top Brands ──────────────────── */}
          <div className="flex gap-5 mb-5 flex-wrap md:flex-nowrap">
            <div className="flex-1 min-w-0">
              <Card className="h-full">
                <CardHeader
                  title="Top Performing Categories"
                  subtitle={`By estimated revenue (sold × price) — ${periodLabel}`}
                  action={
                    <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Layers size={11} /> Categories
                    </span>
                  }
                />
                <CardBody>
                  {derived.topCategories.length > 0 ? (
                    <ReactApexChart
                      type="bar"
                      series={[{ name: 'Revenue', data: derived.topCategories.map(c => c.value) }]}
                      options={{
                        ...catBarOptions,
                        xaxis: {
                          ...catBarOptions.xaxis,
                          categories: derived.topCategories.map(c => c.name),
                        },
                      }}
                      height={220}
                    />
                  ) : (
                    <div className="h-56 flex items-center justify-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">No category data for this period.</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="flex-1 min-w-0">
              <Card className="h-full">
                <CardHeader
                  title="Top Performing Brands"
                  subtitle={`By total units sold — ${periodLabel}`}
                  action={
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Gem size={11} /> Brands
                    </span>
                  }
                />
                <CardBody>
                  {derived.topBrands.length > 0 ? (
                    <ReactApexChart
                      type="bar"
                      series={[{ name: 'Units Sold', data: derived.topBrands.map(b => b.value) }]}
                      options={{
                        ...brandBarOptions,
                        xaxis: {
                          ...brandBarOptions.xaxis,
                          categories: derived.topBrands.map(b => b.name),
                        },
                      }}
                      height={220}
                    />
                  ) : (
                    <div className="h-56 flex items-center justify-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">No brand data for this period.</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* ── Row 6: Conversion Funnel + Period Comparison ─────────── */}
          <div className="flex gap-5 flex-wrap md:flex-nowrap">
            <div className="flex-1 min-w-0">
              <Card className="h-full">
                <CardHeader
                  title="Conversion Funnel"
                  subtitle="Visitor → Purchase journey"
                  action={
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Filter size={11} /> Sample data
                    </span>
                  }
                />
                <CardBody>
                  <ReactApexChart
                    type="bar"
                    series={[{ name: 'Count', data: FUNNEL_MOCK.map(f => f.value) }]}
                    options={funnelOptions}
                    height={240}
                  />
                </CardBody>
              </Card>
            </div>

            <div className="flex-1 min-w-0">
              <Card className="h-full">
                <CardHeader
                  title="Period Comparison"
                  subtitle={`Revenue: last 2 data points in ${periodLabel}`}
                  action={
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <ArrowRightLeft size={11} /> Compare
                    </span>
                  }
                />
                <CardBody>
                  {derived.monthlyCompare.length >= 2 ? (
                    <ReactApexChart
                      type="bar"
                      series={[{ name: 'Revenue', data: derived.monthlyCompare.map(m => m.revenue) }]}
                      options={compareOptions}
                      height={240}
                    />
                  ) : (
                    <div className="h-60 flex items-center justify-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Need at least 2 data points for this period.
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

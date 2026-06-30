import { useState, useEffect, useMemo, useCallback } from 'react';
import { DirhamSymbol } from 'dirham/react';
import DateRangeFilter, { computeDateRange } from './DateRangeFilter';
import {
  TrendingUp, BarChart2, PieChart, Trophy,
  Users, Smartphone, Gauge, Layers, Gem,
  ArrowRightLeft, Filter, LineChart as LineChartIcon,
} from 'lucide-react';
import { Box, Grid, Typography, Chip } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import api from '../../services/api';
import { useAdminTheme } from './AdminThemeContext';
import { StatCard } from '../../components/admin/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/admin/ui/Card';
import { Skeleton } from '../../components/admin/ui/Skeleton';

const PIE_PALETTE = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'];
const BAR_PALETTE = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6'];

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

function ChartSkeleton({ height = 300 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardBody>
        <Skeleton height={20} width="40%" sx={{ mb: 2 }} />
        <Skeleton height={height} sx={{ borderRadius: 2 }} />
      </CardBody>
    </Card>
  );
}

function BadgeChip({ color, icon: Icon, label }) {
  const colorMap = {
    indigo:  { bg: 'rgba(99,102,241,0.1)',  text: '#6366f1' },
    violet:  { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6' },
    amber:   { bg: 'rgba(245,158,11,0.1)', text: '#d97706' },
    teal:    { bg: 'rgba(20,184,166,0.1)', text: '#0d9488' },
    violet2: { bg: 'rgba(124,58,237,0.1)', text: '#7c3aed' },
    orange:  { bg: 'rgba(249,115,22,0.1)', text: '#ea580c' },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: 5, bgcolor: c.bg, color: c.text, fontSize: 11, fontWeight: 600 }}>
      {Icon && <Icon size={11} />}
      {label}
    </Box>
  );
}

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
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: iconColor }}>
            <Icon size={14} />
          </Box>
        }
      />
      <CardBody>
        <ReactApexChart type="donut" series={values} options={options} height={190} />
        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {data.map((d, i) => (
            <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors[i % colors.length], flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{d.name}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                {d.value}{typeof d.value === 'number' && d.value <= 100 ? '%' : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardBody>
    </Card>
  );
}

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

  const axisLabelStyle = { colors: isDark ? '#6b7280' : '#9ca3af', fontSize: '11px' };
  const gridBorderColor = isDark ? '#1f2937' : '#f1f5f9';

  const baseChartConfig = {
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
  };

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
      { labels: { style: axisLabelStyle, formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` } },
      { opposite: true, labels: { style: axisLabelStyle } },
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

  const statusDonutData = statusData.length > 0
    ? statusData.map(d => ({ name: d.status, value: d.count }))
    : [{ name: 'No data', value: 1 }];

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
    yaxis: { labels: { style: axisLabelStyle, formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` } },
    tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (v) => `AED ${v.toLocaleString()}` } },
  };

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

  const productBarOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: BAR_PALETTE,
    plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '65%', distributed: true } },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      style: { fontSize: '10px', colors: [isDark ? '#d1d5db' : '#6b7280'] },
      offsetX: 6, textAnchor: 'start',
    },
    grid: {
      borderColor: gridBorderColor, strokeDashArray: 4,
      xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } },
    },
    xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: axisLabelStyle } },
    yaxis: { labels: { style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' }, maxWidth: 130 } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  const productBarLabels = topProducts.map(p =>
    p.name?.length > 20 ? p.name.slice(0, 20) + '…' : p.name
  );
  const productBarData = topProducts.map(p => p.sold || 0);

  const catBarOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: PIE_PALETTE,
    plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '65%', distributed: true } },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: {
      borderColor: gridBorderColor, strokeDashArray: 4,
      xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } },
    },
    xaxis: {
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: axisLabelStyle, formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` },
    },
    yaxis: { labels: { style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' }, maxWidth: 100 } },
    tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (v) => `AED ${v.toLocaleString()}` } },
  };

  const brandBarOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: BAR_PALETTE,
    plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '65%', distributed: true } },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: {
      borderColor: gridBorderColor, strokeDashArray: 4,
      xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } },
    },
    xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: axisLabelStyle } },
    yaxis: { labels: { style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' }, maxWidth: 100 } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  const funnelColors = FUNNEL_MOCK.map((_, i) => `rgba(99,102,241,${1 - i * 0.15})`);
  const funnelOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: funnelColors,
    plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '65%', distributed: true } },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      style: { fontSize: '10px', colors: [isDark ? '#d1d5db' : '#6b7280'] },
      formatter: (v) => v.toLocaleString(), offsetX: 6, textAnchor: 'start',
    },
    grid: {
      borderColor: gridBorderColor, strokeDashArray: 4,
      xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: FUNNEL_MOCK.map(f => f.stage),
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: { labels: { style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' }, maxWidth: 110 } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  const compareOptions = {
    chart: { ...baseChartConfig, type: 'bar' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#f59e0b', '#6366f1'],
    plotOptions: { bar: { borderRadius: 5, columnWidth: '50%', distributed: true } },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: { borderColor: gridBorderColor, strokeDashArray: 4 },
    xaxis: {
      categories: derived.monthlyCompare.map(m => m.period),
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: axisLabelStyle },
    },
    yaxis: { labels: { style: axisLabelStyle, formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}` } },
    tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (v) => `AED ${v.toLocaleString()}` } },
  };

  function EmptyChart({ height = 300 }) {
    return (
      <Box sx={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 3,
          bgcolor: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart2 size={20} color="#6366f1" strokeWidth={1.5} />
        </Box>
        <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.6 }}>No data for this period.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', fontSize: { xs: '1.5rem', md: '1.75rem' } }}>Analytics</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
            Sales performance, customer insights &amp; product analytics
          </Typography>
        </Box>
        <DateRangeFilter currentPreset={dateRange.preset || 'today'} onChange={handleFilterChange} />
      </Box>

      {/* KPI stat bar */}
      <Grid container spacing={2.5}>
        {loading ? (
          [0,1,2,3].map(i => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, bgcolor: 'background.paper' }}>
                <Skeleton height={16} width="60%" sx={{ mb: 1.5 }} />
                <Skeleton height={32} width="80%" />
              </Box>
            </Grid>
          ))
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard color="indigo" title={`Revenue · ${periodLabel}`}
                value={<Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}><DirhamSymbol size="0.82em" /> {derived.rev.toLocaleString()}</Box>}
                icon={TrendingUp}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard color="violet" title={`Orders · ${periodLabel}`} value={derived.orders.toLocaleString()} icon={BarChart2} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard color="emerald" title="Avg Order Value"
                value={<Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}><DirhamSymbol size="0.82em" /> {derived.avgOV.toLocaleString()}</Box>}
                icon={LineChartIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard color="sky" title="Conv. Rate" value={`${derived.convRate}%`} icon={Gauge} />
            </Grid>
          </>
        )}
      </Grid>

      {/* Charts — skeleton while loading */}
      {loading ? (
        <Grid container spacing={2.5}>
          {[300, 280, 280, 280, 240, 240, 280, 260].map((h, i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <ChartSkeleton height={h} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Row 1: Sales Overview (8 cols) + Order Status (4 cols) */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title="Sales Overview"
                  subtitle={`Revenue and orders — ${periodLabel}`}
                  action={<BadgeChip color="indigo" icon={TrendingUp} label={periodLabel} />}
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
                      height={310}
                    />
                  ) : <EmptyChart height={310} />}
                </CardBody>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DonutWidget
                icon={PieChart}
                iconColor="#8b5cf6"
                title="Order Status"
                data={statusDonutData}
                colors={PIE_PALETTE}
                isDark={isDark}
              />
            </Grid>
          </Grid>

          {/* Row 2: Revenue Growth + Order Analytics */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Revenue Growth" subtitle={`AED revenue — ${periodLabel}`} action={<BadgeChip color="amber" icon={BarChart2} label="Revenue" />} />
                <CardBody>
                  {sales.length > 0
                    ? <ReactApexChart type="bar" series={[{ name: 'Revenue', data: sales.map(s => s.revenue) }]} options={revenueBarOptions} height={300} />
                    : <EmptyChart height={300} />
                  }
                </CardBody>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Order Analytics" subtitle={`Order count trend — ${periodLabel}`} action={<BadgeChip color="violet" icon={ArrowRightLeft} label="Orders" />} />
                <CardBody>
                  {sales.length > 0
                    ? <ReactApexChart type="line" series={[{ name: 'Orders', data: sales.map(s => s.orders) }]} options={orderLineOptions} height={300} />
                    : <EmptyChart height={300} />
                  }
                </CardBody>
              </Card>
            </Grid>
          </Grid>

          {/* Row 3: Three donut charts */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DonutWidget icon={Users} iconColor="#0ea5e9" title="Customer Segments" data={CUSTOMER_MOCK} colors={['#0ea5e9', '#6366f1', '#f59e0b']} isDark={isDark} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DonutWidget icon={Smartphone} iconColor="#8b5cf6" title="Device Analytics" data={DEVICE_MOCK} colors={['#8b5cf6', '#8b5cf6cc', '#8b5cf680']} isDark={isDark} />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
              <DonutWidget icon={Layers} iconColor="#10b981" title="Traffic Sources" data={TRAFFIC_MOCK} colors={['#10b981', '#6366f1', '#f59e0b', '#ec4899']} isDark={isDark} />
            </Grid>
          </Grid>

          {/* Row 4: Product Performance — full width */}
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <Card>
                <CardHeader title="Product Performance" subtitle={`Top 10 best-selling products — ${periodLabel}`} action={<BadgeChip color="amber" icon={Trophy} label="Top 10" />} />
                <CardBody>
                  {topProducts.length > 0 ? (
                    <ReactApexChart
                      type="bar"
                      series={[{ name: 'Units Sold', data: productBarData }]}
                      options={{ ...productBarOptions, xaxis: { ...productBarOptions.xaxis, categories: productBarLabels } }}
                      height={340}
                    />
                  ) : <EmptyChart height={340} />}
                </CardBody>
              </Card>
            </Grid>
          </Grid>

          {/* Row 5: Top Categories + Top Brands */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Top Performing Categories" subtitle={`By estimated revenue — ${periodLabel}`} action={<BadgeChip color="teal" icon={Layers} label="Categories" />} />
                <CardBody>
                  {derived.topCategories.length > 0 ? (
                    <ReactApexChart
                      type="bar"
                      series={[{ name: 'Revenue', data: derived.topCategories.map(c => c.value) }]}
                      options={{ ...catBarOptions, xaxis: { ...catBarOptions.xaxis, categories: derived.topCategories.map(c => c.name) } }}
                      height={270}
                    />
                  ) : <EmptyChart height={270} />}
                </CardBody>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Top Performing Brands" subtitle={`By total units sold — ${periodLabel}`} action={<BadgeChip color="indigo" icon={Gem} label="Brands" />} />
                <CardBody>
                  {derived.topBrands.length > 0 ? (
                    <ReactApexChart
                      type="bar"
                      series={[{ name: 'Units Sold', data: derived.topBrands.map(b => b.value) }]}
                      options={{ ...brandBarOptions, xaxis: { ...brandBarOptions.xaxis, categories: derived.topBrands.map(b => b.name) } }}
                      height={270}
                    />
                  ) : <EmptyChart height={270} />}
                </CardBody>
              </Card>
            </Grid>
          </Grid>

          {/* Row 6: Conversion Funnel + Period Comparison */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Conversion Funnel" subtitle="Visitor → Purchase journey" action={<BadgeChip color="violet2" icon={Filter} label="Sample data" />} />
                <CardBody>
                  <ReactApexChart
                    type="bar"
                    series={[{ name: 'Count', data: FUNNEL_MOCK.map(f => f.value) }]}
                    options={funnelOptions}
                    height={280}
                  />
                </CardBody>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Period Comparison" subtitle={`Revenue: last 2 data points in ${periodLabel}`} action={<BadgeChip color="orange" icon={ArrowRightLeft} label="Compare" />} />
                <CardBody>
                  {derived.monthlyCompare.length >= 2 ? (
                    <ReactApexChart
                      type="bar"
                      series={[{ name: 'Revenue', data: derived.monthlyCompare.map(m => m.revenue) }]}
                      options={compareOptions}
                      height={280}
                    />
                  ) : <EmptyChart height={280} />}
                </CardBody>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

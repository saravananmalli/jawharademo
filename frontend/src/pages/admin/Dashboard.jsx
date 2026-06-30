import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DirhamSymbol } from 'dirham/react';
import DateRangeFilter, { computeDateRange } from './DateRangeFilter';
import {
  TrendingUp, ShoppingBag, Clock, XCircle,
  Gem, Trophy, Star, LayoutGrid, ArrowRight,
} from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import {
  Box, Grid, Paper, Typography, Chip, Button,
  TableHead, TableBody, TableRow, TableCell,
  Skeleton,
} from '@mui/material';
import api from '../../services/api';
import { StatusChip } from './adminUtils';
import { useAdminTheme } from './AdminThemeContext';
import { StatCard } from '../../components/admin/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/admin/ui/Card';
import { Table, Th, Td, Tr } from '../../components/admin/ui/Table';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'];
const BAR_COLOR  = '#6366f1';

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

  const derived = useMemo(() => {
    const rev    = summary?.totalRevenue || 0;
    const orders = summary?.totalOrders  || 0;
    const getStatus = (s) => statusData.find(x => x.status === s)?.count || 0;
    const pending    = getStatus('pending');
    const delivered  = getStatus('delivered');
    const cancelled  = getStatus('cancelled');

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
      rev, orders, trend, orderTrend, pending, delivered, cancelled,
      categories: Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    };
  }, [summary, sales, statusData, topProducts]);

  const now = new Date().toLocaleDateString('en-AE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const chartFont = '"Inter", sans-serif';
  const gridColor = isDark ? '#1e2535' : '#f1f5f9';
  const labelColor = isDark ? '#6b7280' : '#9ca3af';

  const revenueOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', fontFamily: chartFont },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#6366f1'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.22, opacityTo: 0.0, stops: [0, 100] },
    },
    grid: { borderColor: gridColor, strokeDashArray: 4, padding: { left: -4, right: 0 } },
    xaxis: {
      categories: sales.map(s => s.month),
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: labelColor, fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        style: { colors: labelColor, fontSize: '11px' },
        formatter: (v) => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
      },
    },
    tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (v) => `AED ${v.toLocaleString()}` } },
    markers: { size: 4, colors: ['#6366f1'], strokeWidth: 0 },
  };

  const donutOptions = {
    chart: { type: 'donut', background: 'transparent', fontFamily: chartFont },
    theme: { mode: isDark ? 'dark' : 'light' },
    labels: statusData.map(d => d.status),
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

  const topProductsSlice = topProducts.slice(0, 6);
  const barOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', fontFamily: chartFont },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: [BAR_COLOR],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
    dataLabels: {
      enabled: true,
      style: { fontSize: '10px', colors: [isDark ? '#d1d5db' : '#6b7280'] },
      formatter: (v) => v, offsetX: 6, textAnchor: 'start',
    },
    grid: { borderColor: gridColor, strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    xaxis: {
      categories: topProductsSlice.map(p => p.name?.length > 18 ? p.name.slice(0, 18) + '…' : p.name),
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: labelColor, fontSize: '10px' } },
    },
    yaxis: { labels: { style: { colors: isDark ? '#9ca3af' : '#4b5563', fontSize: '10px' } } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  const skeletonCols = [1, 2, 3, 4, 5];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', fontSize: { xs: '1.5rem', md: '1.75rem' } }}>Dashboard</Typography>
          <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', mt: 0.75 }}>{now}</Typography>
        </Box>
        <DateRangeFilter currentPreset={dateRange.preset || 'today'} onChange={handleFilterChange} />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5}>
        {[
          {
            color: 'indigo', title: 'Total Revenue', icon: TrendingUp,
            value: <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><DirhamSymbol size="0.78em" /> {derived.rev.toLocaleString()}</Box>,
            change: derived.trend, changeLabel: dateRange.label || 'Today', loading,
          },
          {
            color: 'violet', title: 'Total Orders', icon: ShoppingBag,
            value: derived.orders.toLocaleString(),
            change: derived.orderTrend, changeLabel: dateRange.label || 'Today', loading,
          },
          {
            color: 'amber', title: 'Pending Orders', icon: Clock,
            value: loading ? '—' : derived.pending.toLocaleString(),
            changeLabel: 'Awaiting processing',
          },
          {
            color: 'rose', title: 'Cancelled Orders', icon: XCircle,
            value: loading ? '—' : derived.cancelled.toLocaleString(),
            changeLabel: 'Refunded / void',
          },
        ].map((stat, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Revenue Trend"
              subtitle={dateRange.label || 'Today'}
              action={
                <Chip
                  label="Revenue"
                  icon={<TrendingUp size={10} />}
                  size="small"
                  sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: 'primary.main', fontWeight: 600, fontSize: 11 }}
                />
              }
            />
            <CardBody>
              {sales.length > 0 ? (
                <ReactApexChart
                  type="area"
                  series={[{ name: 'Revenue', data: sales.map(s => s.revenue) }]}
                  options={revenueOptions}
                  height={290}
                />
              ) : (
                <EmptyChart icon={TrendingUp} color="#6366f1" message="Sales data will appear once orders are placed." />
              )}
            </CardBody>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Orders by Status"
              action={
                <Chip
                  label="Status"
                  icon={<Gem size={10} />}
                  size="small"
                  sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 600, fontSize: 11 }}
                />
              }
            />
            <CardBody>
              {statusData.length > 0 ? (
                <>
                  <ReactApexChart
                    type="donut"
                    series={statusData.map(d => d.count)}
                    options={donutOptions}
                    height={200}
                  />
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {statusData.map((d, i) => (
                      <Box key={d.status} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <Typography sx={{ fontSize: '12.5px', color: 'text.secondary', textTransform: 'capitalize' }}>{d.status}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '12.5px', fontWeight: 700 }}>{d.count}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <EmptyChart icon={Gem} color="#8b5cf6" message="No order data yet." />
              )}
            </CardBody>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Best Selling Products"
              subtitle={dateRange.label || 'Today'}
              action={
                <Chip
                  label="Top 6"
                  icon={<Trophy size={10} />}
                  size="small"
                  sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#d97706', fontWeight: 600, fontSize: 11 }}
                />
              }
            />
            <CardBody>
              {topProducts.length > 0 ? (
                <ReactApexChart
                  type="bar"
                  series={[{ name: 'Units Sold', data: topProductsSlice.map(p => p.sold || 0) }]}
                  options={barOptions}
                  height={260}
                />
              ) : (
                <EmptyChart icon={Trophy} color="#f59e0b" message="No sales data yet." />
              )}
            </CardBody>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Top Categories"
              action={
                <Chip
                  label="Categories"
                  icon={<LayoutGrid size={10} />}
                  size="small"
                  sx={{ bgcolor: 'rgba(20,184,166,0.1)', color: '#0d9488', fontWeight: 600, fontSize: 11 }}
                />
              }
            />
            <CardBody>
              {derived.categories.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {derived.categories.map((cat, i) => {
                    const max = derived.categories[0].value;
                    const pct = Math.round((cat.value / max) * 100);
                    return (
                      <Box key={cat.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography sx={{ fontSize: '12.5px', fontWeight: 600 }}>{cat.name}</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled' }}>{cat.value} sold</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
                          <Box
                            sx={{
                              height: '100%', borderRadius: 999,
                              bgcolor: PIE_COLORS[i % PIE_COLORS.length],
                              width: `${pct}%`,
                              transition: 'width 0.7s ease-out',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <EmptyChart icon={LayoutGrid} color="#14b8a6" message="No category data yet." small />
              )}

              {topProducts.length > 0 && (
                <>
                  <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 2.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Star size={13} color="#f59e0b" fill="#f59e0b" />
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Trending</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {topProducts.slice(0, 4).map((p, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 20, height: 20, borderRadius: 1, flexShrink: 0,
                          bgcolor: 'rgba(99,102,241,0.1)',
                          color: 'primary.main',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800,
                        }}>
                          {i + 1}
                        </Box>
                        <Typography sx={{ flex: 1, fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </Typography>
                        <Chip
                          label={p.sold || 0}
                          size="small"
                          sx={{ fontSize: 10, height: 20, fontWeight: 700, color: 'text.secondary', bgcolor: 'action.hover' }}
                        />
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardBody>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Card>
        <CardHeader
          title="Recent Orders"
          action={
            <Button
              component={Link}
              to="/admin/orders"
              size="small"
              variant="outlined"
              color="primary"
              endIcon={<ArrowRight size={12} />}
              sx={{ borderRadius: 2.5, fontSize: 12 }}
            >
              View All
            </Button>
          }
        />
        <Table>
          <TableHead>
            <TableRow>
              {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                <Th key={h}>{h}</Th>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && recentOrders.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {skeletonCols.map(j => (
                    <TableCell key={j}>
                      <Skeleton variant="text" height={16} sx={{ borderRadius: 1 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : recentOrders.length > 0
                ? recentOrders.map(o => (
                  <Tr key={o._id}>
                    <Td>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>
                        #{o._id.slice(-8).toUpperCase()}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                        {o.user?.name || '—'}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DirhamSymbol size="0.85em" /> {o.totalAmount?.toLocaleString()}
                      </Typography>
                    </Td>
                    <Td><StatusChip status={o.status} /></Td>
                    <Td>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {new Date(o.createdAt).toLocaleDateString()}
                      </Typography>
                    </Td>
                  </Tr>
                ))
                : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <ShoppingBag size={22} style={{ opacity: 0.3 }} />
                        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>No orders yet.</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
            }
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}

function EmptyChart({ icon: Icon, color, message, small = false }) {
  return (
    <Box sx={{ height: small ? 120 : 290, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <Box sx={{
        width: small ? 40 : 52, height: small ? 40 : 52,
        borderRadius: 3,
        bgcolor: `${color}14`,
        border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={small ? 18 : 22} color={color} strokeWidth={1.5} />
      </Box>
      <Typography sx={{ fontSize: 13, color: 'text.disabled', textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>{message}</Typography>
    </Box>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DirhamSymbol } from 'dirham/react';
import DateRangeFilter, { computeDateRange } from './DateRangeFilter';
import {
  Box, Grid, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Skeleton,
  Button, Avatar, Stack, Chip, Divider,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import AttachMoneyIcon   from '@mui/icons-material/AttachMoney';
import ShoppingBagIcon   from '@mui/icons-material/ShoppingBag';
import InventoryIcon     from '@mui/icons-material/Inventory2';
import PeopleIcon        from '@mui/icons-material/People';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon   from '@mui/icons-material/EmojiEvents';
import LocalShippingIcon  from '@mui/icons-material/LocalShipping';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import CancelIcon         from '@mui/icons-material/Cancel';
import AccessTimeIcon     from '@mui/icons-material/AccessTime';
import FavoriteIcon       from '@mui/icons-material/Favorite';
import ShoppingCartIcon   from '@mui/icons-material/ShoppingCart';
import CategoryIcon       from '@mui/icons-material/Category';
import StarIcon           from '@mui/icons-material/Star';
import DiamondIcon        from '@mui/icons-material/Diamond';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import api from '../../services/api';
import { StatusChip } from './adminUtils';

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  gold:    '#967123',
  maroon:  '#8B1538',
  green:   '#16a34a',
  blue:    '#2563eb',
  orange:  '#ea580c',
  teal:    '#0891b2',
  purple:  '#7c3aed',
  pink:    '#db2777',
};

const PIE_COLORS = [C.gold, C.maroon, C.green, C.blue, C.orange, C.teal];

// ── MetricCard ────────────────────────────────────────────────────────────────
function MetricCard({ title, value, sub, icon: Icon, color, trend, loading }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }
  const trendPositive = trend >= 0;
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
        bgcolor: color,
      }} />
      <CardContent sx={{ pl: 2.5, pr: 2.5, pt: 2.25, pb: '18px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, fontSize: '0.64rem', lineHeight: 1.3 }}>
            {title}
          </Typography>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha(color, isDark ? 0.2 : 0.1),
          }}>
            <Icon sx={{ fontSize: '1.1rem', color }} />
          </Box>
        </Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1.15} sx={{ mb: 0.35 }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{sub}</Typography>}
        {trend != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
            <Typography variant="caption" fontWeight={700}
              sx={{ color: trendPositive ? 'success.main' : 'error.main' }}>
              {trendPositive ? '▲' : '▼'} {Math.abs(trend)}%
            </Typography>
            <Typography variant="caption" color="text.disabled">vs last month</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── Custom donut label ────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: '0.72rem', fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [summary,      setSummary]      = useState(null);
  const [sales,        setSales]        = useState([]);
  const [statusData,   setStatusData]   = useState([]);
  const [topProducts,  setTopProducts]  = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading,      setLoading]      = useState(true);
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
      categories: Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
    };
  }, [summary, sales, statusData, topProducts]);

  const chartGrid   = isDark ? 'rgba(255,255,255,0.06)' : '#f0f2f5';
  const axisColor   = isDark ? '#6b7280' : '#9ca3af';
  const tooltipSx   = {
    backgroundColor: isDark ? '#1e2433' : '#fff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
    borderRadius: 8,
    color: isDark ? '#f9fafb' : '#111827',
  };
  const labelSx = { color: isDark ? '#f9fafb' : '#111827', fontWeight: 600 };

  const now = new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">{now}</Typography>
        </Box>
        <DateRangeFilter currentPreset={dateRange.preset || 'today'} onChange={handleFilterChange} />
      </Box>

      {/* ── Metrics Row ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        {[
          { title: 'Total Revenue',    value: <><DirhamSymbol size="0.82em" /> {derived.rev.toLocaleString()}</>, sub: dateRange.label,       icon: AttachMoneyIcon, color: C.gold,   trend: derived.trend },
          { title: 'Total Orders',     value: derived.orders.toLocaleString(),               sub: dateRange.label,       icon: ShoppingBagIcon, color: C.maroon, trend: derived.orderTrend },
          { title: 'Pending Orders',   value: derived.pending.toLocaleString(),              sub: 'Awaiting processing', icon: AccessTimeIcon,  color: C.orange },
          { title: 'Cancelled Orders', value: derived.cancelled.toLocaleString(),            sub: 'Refunded / void',     icon: CancelIcon,      color: '#dc2626' },
        ].map(m => (
          <Box key={m.title} sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: 1 }, minWidth: 0 }}>
            <MetricCard {...m} loading={loading} />
          </Box>
        ))}
      </Box>

      {/* ── Charts Row 1: Sales Area + Order Status Donut ─────────────── */}
      <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
        <Box sx={{ flex: { xs: '1 1 100%', lg: '2 1 0' }, minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon sx={{ color: C.gold, fontSize: '1.2rem' }} />
                  <Typography variant="subtitle1" fontWeight={700}>Revenue Trend</Typography>
                </Box>
                <Chip label={dateRange.label || 'Today'} size="small" variant="outlined"
                  sx={{ fontSize: '0.72rem', height: 24 }} />
              </Box>
              {sales.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={sales} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.gold} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipSx} labelStyle={labelSx}
                      formatter={v => [`AED ${v.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke={C.gold} strokeWidth={2.5}
                      fill="url(#revGrad)" dot={{ r: 4, fill: C.gold, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">Sales data will appear once orders are placed.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DiamondIcon sx={{ color: C.maroon, fontSize: '1.2rem' }} />
                  <Typography variant="subtitle1" fontWeight={700}>Orders by Status</Typography>
                </Box>
                <Chip label={dateRange.label || 'Today'} size="small" variant="outlined"
                  sx={{ fontSize: '0.72rem', height: 24 }} />
              </Box>
              {statusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusData} dataKey="count" nameKey="status"
                        cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                        labelLine={false} label={renderPieLabel}>
                        {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipSx} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {statusData.map((d, i) => (
                      <Box key={d.status} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{d.status}</Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={700}>{d.count}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              ) : (
                <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">No order data yet.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ── Charts Row 2: Top Products + Top Categories ───────────────── */}
      <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '7 1 0' }, minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon sx={{ color: C.gold, fontSize: '1.2rem' }} />
                  <Typography variant="subtitle1" fontWeight={700}>Best Selling Products</Typography>
                </Box>
                <Chip label={dateRange.label || 'Today'} size="small" variant="outlined"
                  sx={{ fontSize: '0.72rem', height: 24 }} />
              </Box>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topProducts.slice(0, 6)} layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={120}
                      tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipSx} labelStyle={labelSx} />
                    <Bar dataKey="sold" fill={C.gold} radius={[0, 5, 5, 0]} label={{ position: 'right', fontSize: 10, fill: axisColor }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">No sales data yet.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '5 1 0' }, minWidth: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CategoryIcon sx={{ color: C.teal, fontSize: '1.2rem' }} />
                <Typography variant="subtitle1" fontWeight={700}>Top Categories</Typography>
              </Box>
              {derived.categories.length > 0 ? (
                <Stack spacing={1.25}>
                  {derived.categories.map((cat, i) => {
                    const max = derived.categories[0].value;
                    const pct = Math.round((cat.value / max) * 100);
                    const barColor = PIE_COLORS[i % PIE_COLORS.length];
                    return (
                      <Box key={cat.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                          <Typography variant="caption" fontWeight={600}>{cat.name}</Typography>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">{cat.value} sold</Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: isDark ? 'rgba(255,255,255,0.07)' : '#f0f2f5', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: barColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">No category data yet.</Typography>
                </Box>
              )}

              {topProducts.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <StarIcon sx={{ color: C.gold, fontSize: '1rem' }} />
                    <Typography variant="body2" fontWeight={700}>Trending Products</Typography>
                  </Box>
                  <Stack spacing={0.75}>
                    {topProducts.slice(0, 4).map((p, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.62rem', fontWeight: 800, bgcolor: alpha(C.gold, 0.15), color: C.gold, flexShrink: 0 }}>
                          {i + 1}
                        </Avatar>
                        <Typography variant="caption" noWrap sx={{ flex: 1 }}>{p.name}</Typography>
                        <Chip label={`${p.sold || 0} sold`} size="small" variant="outlined"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ── Recent Orders ─────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingBagIcon sx={{ color: C.maroon, fontSize: '1.2rem' }} />
              <Typography variant="subtitle1" fontWeight={700}>Recent Orders</Typography>
            </Box>
            <Button component={Link} to="/admin/orders" size="small" variant="outlined"
              sx={{ fontSize: '0.8rem', borderRadius: '8px' }}>
              View All
            </Button>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? [1,2,3,4].map(i => (
                  <TableRow key={i}>
                    {[1,2,3,4,5].map(j => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                )) : recentOrders.length > 0 ? recentOrders.map(o => (
                  <TableRow key={o._id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.secondary' }}>
                      #{o._id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{o.user?.name || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}><DirhamSymbol size="0.85em" /> {o.totalAmount?.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={o.status} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.disabled' }}>
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DirhamSymbol } from 'dirham/react';
import DateRangeFilter, { computeDateRange } from './DateRangeFilter';
import {
  Box, Card, CardContent, Typography, Skeleton, Chip,
  Stack, Divider,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import DonutLargeIcon    from '@mui/icons-material/DonutLarge';
import BarChartIcon      from '@mui/icons-material/BarChart';
import EmojiEventsIcon   from '@mui/icons-material/EmojiEvents';
import PeopleIcon        from '@mui/icons-material/People';
import PhoneAndroidIcon  from '@mui/icons-material/PhoneAndroid';
import TrafficIcon       from '@mui/icons-material/Traffic';
import CategoryIcon      from '@mui/icons-material/Category';
import DiamondIcon       from '@mui/icons-material/Diamond';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FunnelIcon        from '@mui/icons-material/FilterAlt';
import ShowChartIcon     from '@mui/icons-material/ShowChart';
import AttachMoneyIcon   from '@mui/icons-material/AttachMoney';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import api from '../../services/api';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  gold:   '#967123',
  maroon: '#8B1538',
  green:  '#16a34a',
  blue:   '#2563eb',
  orange: '#ea580c',
  teal:   '#0891b2',
  purple: '#7c3aed',
  pink:   '#db2777',
};

const PIE_PALETTE = [C.gold, C.maroon, C.green, C.blue, C.orange, C.teal];
const BAR_PALETTE = [C.gold, C.maroon, C.green, C.blue, C.orange, C.teal, C.purple, C.pink];

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

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, badge, children, minH = 300 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{title}</Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          {badge && (
            <Chip label={badge} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
          )}
        </Box>
        <Box sx={{ minHeight: minH }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function StatBar({ items, loading }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: 1 }, minWidth: 0 }}>
            <Card>
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Skeleton variant="text" width="55%" sx={{ mb: 0.75 }} />
                <Skeleton variant="text" width="80%" height={32} />
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
      {items.map(({ label, value, color, icon: Icon }) => (
        <Box key={label} sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: 1 }, minWidth: 0 }}>
          <Card>
            <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography
                  variant="caption" color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, fontSize: '0.63rem' }}
                >
                  {label}
                </Typography>
                <Box sx={{
                  width: 30, height: 30, borderRadius: '8px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  bgcolor: alpha(color, isDark ? 0.18 : 0.1),
                }}>
                  <Icon sx={{ fontSize: '0.95rem', color }} />
                </Box>
              </Box>
              <Typography variant="h6" fontWeight={800}>{value}</Typography>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
}

function DonutCard({ icon, title, data, colors }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const tooltipSx = {
    backgroundColor: isDark ? '#1e2433' : '#fff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
    borderRadius: 8,
  };
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.07) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    return (
      <text
        x={cx + r * Math.cos(-midAngle * RADIAN)}
        y={cy + r * Math.sin(-midAngle * RADIAN)}
        fill="#fff" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '0.7rem', fontWeight: 700 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Box>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={44} outerRadius={72}
              labelLine={false} label={renderLabel}>
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipSx} />
          </PieChart>
        </ResponsiveContainer>
        <Stack spacing={0.6} sx={{ mt: 1 }}>
          {data.map((d, i) => (
            <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors[i % colors.length], flexShrink: 0 }} />
                <Typography variant="caption">{d.name}</Typography>
              </Box>
              <Typography variant="caption" fontWeight={700}>
                {d.value}{typeof d.value === 'number' && d.value <= 100 ? '%' : ''}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 300 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="text" width="45%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [sales,       setSales]       = useState([]);
  const [statusData,  setStatusData]  = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [dateRange,   setDateRange]   = useState(() => computeDateRange('today'));

  // stable callback — never changes identity, safe in useEffect deps
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

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#f0f2f5';
  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const tt = {
    backgroundColor: isDark ? '#1e2433' : '#fff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
    borderRadius: 8,
    color: isDark ? '#f9fafb' : '#111827',
  };
  const labelSx = { color: isDark ? '#f9fafb' : '#111827', fontWeight: 600 };

  const periodLabel = dateRange.label || 'Today';

  return (
    <Box>
      {/* ── Header — always visible so DateRangeFilter never unmounts ── */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Analytics</Typography>
          <Typography variant="body2" color="text.secondary">
            Sales performance, customer insights &amp; product analytics
          </Typography>
        </Box>
        <DateRangeFilter currentPreset={dateRange.preset || 'today'} onChange={handleFilterChange} />
      </Box>

      {/* ── Summary stat bar — shows skeleton while loading ─────────── */}
      <StatBar
        loading={loading}
        items={[
          { label: `Revenue · ${periodLabel}`, value: <><DirhamSymbol size="0.82em" /> {derived.rev.toLocaleString()}</>,   color: C.gold,   icon: AttachMoneyIcon },
          { label: `Orders · ${periodLabel}`,  value: derived.orders.toLocaleString(),                                          color: C.maroon, icon: BarChartIcon },
          { label: 'Avg Order Value',           value: <><DirhamSymbol size="0.82em" /> {derived.avgOV.toLocaleString()}</>,   color: C.green,  icon: ShowChartIcon },
          { label: 'Conv. Rate',                value: `${derived.convRate}%`,                  color: C.blue,   icon: TrendingUpIcon },
        ]}
      />

      {/* ── Chart content: skeleton grid while loading ───────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
          {[300, 280, 280, 280, 240, 240, 280, 260].map((h, i) => (
            <Box key={i} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 10px)' }, minWidth: 0 }}>
              <ChartSkeleton height={h} />
            </Box>
          ))}
        </Box>
      ) : (
        <>
          {/* ── Row 1: Sales Overview + Order Status Donut ────────────── */}
          <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
            <Box sx={{ flex: { xs: '1 1 100%', lg: '2 1 0' }, minWidth: 0 }}>
              <SectionCard
                icon={<TrendingUpIcon sx={{ fontSize: '1.2rem' }} />}
                title="Sales Overview"
                subtitle={`Revenue and orders — ${periodLabel}`}
                badge={periodLabel}
                minH={250}
              >
                {sales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={sales} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.gold}   stopOpacity={0.28} />
                          <stop offset="95%" stopColor={C.gold}   stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ordersAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.maroon} stopOpacity={0.22} />
                          <stop offset="95%" stopColor={C.maroon} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tt} labelStyle={labelSx}
                        formatter={(v, n) => n === 'revenue' ? [`AED ${v.toLocaleString()}`, 'Revenue'] : [v, 'Orders']} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', color: axisColor }} />
                      <Area yAxisId="rev" type="monotone" dataKey="revenue" name="revenue" stroke={C.gold}
                        strokeWidth={2.5} fill="url(#salesAreaGrad)"
                        dot={{ r: 4, fill: C.gold, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      <Area yAxisId="ord" type="monotone" dataKey="orders" name="orders" stroke={C.maroon}
                        strokeWidth={2} fill="url(#ordersAreaGrad)"
                        dot={{ r: 3, fill: C.maroon, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.disabled">No sales data for this period.</Typography>
                  </Box>
                )}
              </SectionCard>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: 0 }}>
              <DonutCard
                icon={<DonutLargeIcon sx={{ fontSize: '1.2rem', color: C.maroon }} />}
                title="Order Status"
                data={statusData.length > 0
                  ? statusData.map(d => ({ name: d.status, value: d.count }))
                  : [{ name: 'No data', value: 1 }]}
                colors={PIE_PALETTE}
              />
            </Box>
          </Box>

          {/* ── Row 2: Revenue Growth + Order Analytics ───────────────── */}
          <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: 1 }, minWidth: 0 }}>
              <SectionCard
                icon={<BarChartIcon sx={{ fontSize: '1.2rem', color: C.gold }} />}
                title="Revenue Growth"
                subtitle={`AED revenue — ${periodLabel}`}
                minH={260}
              >
                {sales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sales} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tt} labelStyle={labelSx}
                        formatter={v => [`AED ${v.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill={C.gold} radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.disabled">No data for this period.</Typography>
                  </Box>
                )}
              </SectionCard>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: 1 }, minWidth: 0 }}>
              <SectionCard
                icon={<CompareArrowsIcon sx={{ fontSize: '1.2rem', color: C.blue }} />}
                title="Order Analytics"
                subtitle={`Order count trend — ${periodLabel}`}
                minH={260}
              >
                {sales.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={sales} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tt} labelStyle={labelSx} />
                      <Line type="monotone" dataKey="orders" stroke={C.maroon} strokeWidth={2.5}
                        dot={{ r: 4, fill: C.maroon, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.disabled">No data for this period.</Typography>
                  </Box>
                )}
              </SectionCard>
            </Box>
          </Box>

          {/* ── Row 3: 3 Donut charts (mock — no date dependency) ─────── */}
          <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 0 }}>
              <DonutCard
                icon={<PeopleIcon sx={{ fontSize: '1.2rem', color: C.teal }} />}
                title="Customer Segments"
                data={CUSTOMER_MOCK}
                colors={[C.teal, C.blue, C.gold]}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 0 }}>
              <DonutCard
                icon={<PhoneAndroidIcon sx={{ fontSize: '1.2rem', color: C.purple }} />}
                title="Device Analytics"
                data={DEVICE_MOCK}
                colors={[C.purple, C.maroon, C.orange]}
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 0 }}>
              <DonutCard
                icon={<TrafficIcon sx={{ fontSize: '1.2rem', color: C.green }} />}
                title="Traffic Sources"
                data={TRAFFIC_MOCK}
                colors={[C.green, C.blue, C.orange, C.pink]}
              />
            </Box>
          </Box>

          {/* ── Row 4: Product Performance ───────────────────────────── */}
          <Box sx={{ mb: 2.5 }}>
            <SectionCard
              icon={<EmojiEventsIcon sx={{ fontSize: '1.2rem', color: C.gold }} />}
              title="Product Performance"
              subtitle={`Top 10 best-selling products — ${periodLabel}`}
              minH={280}
            >
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProducts} layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={130}
                      tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tt} labelStyle={labelSx} />
                    <Bar dataKey="sold" radius={[0, 5, 5, 0]}
                      label={{ position: 'right', fontSize: 10, fill: axisColor }}>
                      {topProducts.map((_, i) => <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.disabled">No product sales for this period.</Typography>
                </Box>
              )}
            </SectionCard>
          </Box>

          {/* ── Row 5: Top Categories + Top Brands ───────────────────── */}
          <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: 1 }, minWidth: 0 }}>
              <SectionCard
                icon={<CategoryIcon sx={{ fontSize: '1.2rem', color: C.teal }} />}
                title="Top Performing Categories"
                subtitle={`By estimated revenue (sold × price) — ${periodLabel}`}
                minH={220}
              >
                {derived.topCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={derived.topCategories} layout="vertical"
                      margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false}
                        tickFormatter={v => `AED ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                      <YAxis type="category" dataKey="name" width={90}
                        tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tt} labelStyle={labelSx}
                        formatter={v => [`AED ${v.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                        {derived.topCategories.map((_, i) => (
                          <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.disabled">No category data for this period.</Typography>
                  </Box>
                )}
              </SectionCard>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: 1 }, minWidth: 0 }}>
              <SectionCard
                icon={<DiamondIcon sx={{ fontSize: '1.2rem', color: C.gold }} />}
                title="Top Performing Brands"
                subtitle={`By total units sold — ${periodLabel}`}
                minH={220}
              >
                {derived.topBrands.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={derived.topBrands} layout="vertical"
                      margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90}
                        tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tt} labelStyle={labelSx} />
                      <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                        {derived.topBrands.map((_, i) => (
                          <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.disabled">No brand data for this period.</Typography>
                  </Box>
                )}
              </SectionCard>
            </Box>
          </Box>

          {/* ── Row 6: Conversion Funnel + Monthly Comparison ────────── */}
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: 1 }, minWidth: 0 }}>
              <SectionCard
                icon={<FunnelIcon sx={{ fontSize: '1.2rem', color: C.purple }} />}
                title="Conversion Funnel"
                subtitle="Visitor → Purchase journey"
                badge="Sample data"
                minH={240}
              >
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={FUNNEL_MOCK} layout="vertical"
                    margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="stage" width={100}
                      tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tt} labelStyle={labelSx} />
                    <Bar dataKey="value" radius={[0, 5, 5, 0]}
                      label={{ position: 'right', fontSize: 10, fill: axisColor, formatter: v => v.toLocaleString() }}>
                      {FUNNEL_MOCK.map((_, i) => (
                        <Cell key={i} fill={C.purple} fillOpacity={1 - i * 0.15} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: 1 }, minWidth: 0 }}>
              <SectionCard
                icon={<CompareArrowsIcon sx={{ fontSize: '1.2rem', color: C.orange }} />}
                title="Period Comparison"
                subtitle={`Revenue: last 2 data points in ${periodLabel}`}
                minH={240}
              >
                {derived.monthlyCompare.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={derived.monthlyCompare} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tt} labelStyle={labelSx}
                        formatter={v => [`AED ${v.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" radius={[5, 5, 0, 0]}>
                        {derived.monthlyCompare.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? C.orange : C.gold} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.disabled">
                      Need at least 2 data points for this period.
                    </Typography>
                  </Box>
                )}
              </SectionCard>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2, Package, Tag, Award, ShoppingBag,
  Users, Star, Image, Ticket, Smartphone, Monitor, PlayCircle,
  Layers, Settings, LogOut, Diamond, Bell, Sun, Moon, Menu as MenuIcon,
  ChevronDown, ChevronRight, CheckCheck, Search, X,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import {
  Box, Drawer, AppBar, Toolbar, IconButton, Typography,
  List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Avatar, Menu, MenuItem, Badge,
  InputBase, Divider, Tooltip, useTheme,
  ThemeProvider, createTheme,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AdminThemeProvider, useAdminTheme } from './AdminThemeContext';
import { Toast } from '../../components/admin/ui/Toast';
import '../../styles/admin/admin.css';

const SIDEBAR_W           = 240;
const SIDEBAR_COLLAPSED_W = 64;

/* Dark sidebar has its own isolated theme so it never inherits the page palette */
const SIDEBAR_THEME = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', light: '#818cf8' },
    background: { default: '#0b0d14', paper: '#0b0d14' },
    text: { primary: '#fff', secondary: 'rgba(255,255,255,0.5)' },
  },
  typography: { fontFamily: '"Inter", -apple-system, sans-serif' },
  shape: { borderRadius: 12 },
  components: {
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 8 } } },
  },
});

/* ── Navigation config ──────────────────────────────────────────────── */
const NAV = [
  { section: 'Main' },
  { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/admin/analytics',  icon: BarChart2,       label: 'Analytics' },
  { section: 'Catalog' },
  { to: '/admin/products',   icon: Package,         label: 'Products' },
  { to: '/admin/categories', icon: Tag,             label: 'Categories' },
  { to: '/admin/brands',     icon: Award,           label: 'Brands' },
  { section: 'Commerce' },
  { to: '/admin/orders',     icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/customers',  icon: Users,           label: 'Customers' },
  { to: '/admin/reviews',    icon: Star,            label: 'Reviews' },
  { section: 'Content' },
  { to: '/admin/banners',    icon: Image,           label: 'Banners' },
  { to: '/admin/offers',     icon: Ticket,          label: 'Offers & Countdown' },
  {
    accordion: 'mobile',
    label: 'Mobile Apps',
    icon: Smartphone,
    children: [
      { to: '/admin/mobile/dashboard',   icon: Monitor,    label: 'Dashboard' },
      { to: '/admin/mobile/onboarding',  icon: PlayCircle, label: 'Onboarding Screens' },
      { to: '/admin/mobile/home-banner', icon: Layers,     label: 'Home Banner' },
    ],
  },
  { section: 'System' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const BREADCRUMB_MAP = {
  '/admin':                    { section: null,       label: 'Dashboard' },
  '/admin/analytics':          { section: 'Main',     label: 'Analytics' },
  '/admin/products':           { section: 'Catalog',  label: 'Products' },
  '/admin/products/add':       { section: 'Products', label: 'Add Product' },
  '/admin/categories':         { section: 'Catalog',  label: 'Categories' },
  '/admin/brands':             { section: 'Catalog',  label: 'Brands' },
  '/admin/orders':             { section: 'Commerce', label: 'Orders' },
  '/admin/customers':          { section: 'Commerce', label: 'Customers' },
  '/admin/reviews':            { section: 'Commerce', label: 'Reviews' },
  '/admin/banners':            { section: 'Content',  label: 'Banners' },
  '/admin/offers':             { section: 'Content',  label: 'Offers' },
  '/admin/mobile/dashboard':   { section: 'Mobile',   label: 'Dashboard' },
  '/admin/mobile/onboarding':  { section: 'Mobile',   label: 'Onboarding' },
  '/admin/mobile/home-banner': { section: 'Mobile',   label: 'Home Banner' },
  '/admin/settings':           { section: 'System',   label: 'Settings' },
};

function getBreadcrumb(pathname) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  if (pathname.match(/^\/admin\/products\/[^/]+\/edit$/))
    return { section: 'Products', label: 'Edit Product' };
  const parts = pathname.replace('/admin/', '').split('/');
  return {
    section: null,
    label: parts.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' / '),
  };
}

/* ── Sidebar content ────────────────────────────────────────────────── */
function SidebarContent({ collapsed, onClose, onToggle }) {
  const location  = useLocation();
  const { logout, user } = useAuth();
  const navigate  = useNavigate();

  const [openAccordions, setOpenAccordions] = useState(() => {
    const init = {};
    NAV.forEach(item => {
      if (item.accordion)
        init[item.accordion] = item.children.some(c => location.pathname.startsWith(c.to));
    });
    return init;
  });

  const toggleAccordion = key =>
    setOpenAccordions(p => ({ ...p, [key]: !p[key] }));

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = item =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <ThemeProvider theme={SIDEBAR_THEME}>
      <Box
        sx={{
          display: 'flex', flexDirection: 'column', height: '100%',
          overflow: 'hidden', bgcolor: '#0b0d14', userSelect: 'none',
        }}
      >
        {/* Logo row */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, px: 2,
          height: 64, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 2.5, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.35)',
          }}>
            <Diamond size={14} color="#fff" />
          </Box>
          {!collapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{
                fontSize: 12, fontWeight: 800, color: '#fff',
                letterSpacing: '0.2em', lineHeight: 1.2, textTransform: 'uppercase',
              }}>
                Jawhara
              </Typography>
              <Typography sx={{
                fontSize: 10, color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.2,
              }}>
                Admin
              </Typography>
            </Box>
          )}
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
            <IconButton
              onClick={onToggle}
              size="small"
              sx={{
                ml: 'auto', color: 'rgba(255,255,255,0.2)', width: 28, height: 28,
                display: { xs: 'none', md: 'flex' },
                '&:hover': { color: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.07)' },
              }}
            >
              {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Navigation */}
        <Box
          className="admin-scroll"
          sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 2, px: 1 }}
        >
          {NAV.map((item, idx) => {
            /* Section label */
            if (item.section) {
              if (collapsed)
                return <Divider key={idx} sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.07)' }} />;
              return (
                <Typography
                  key={idx}
                  sx={{
                    display: 'block', px: 1.5, pb: 0.75,
                    pt: idx === 0 ? 0 : 2.5,
                    fontSize: '10px', fontWeight: 700,
                    color: 'rgba(255,255,255,0.22)',
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                  }}
                >
                  {item.section}
                </Typography>
              );
            }

            /* Accordion */
            if (item.accordion) {
              const isOpen    = openAccordions[item.accordion];
              const anyActive = item.children.some(c => location.pathname.startsWith(c.to));
              const Icon      = item.icon;
              return (
                <Box key={item.accordion} sx={{ mb: 0.5 }}>
                  <Tooltip title={collapsed ? item.label : ''} placement="right">
                    <ListItemButton
                      onClick={() => toggleAccordion(item.accordion)}
                      sx={{
                        px: 1.25, py: 0.875, mb: 0.25,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: anyActive && !isOpen ? '#c7d2fe' : 'rgba(255,255,255,0.48)',
                        bgcolor: anyActive && !isOpen ? 'rgba(99,102,241,0.12)' : 'transparent',
                        borderRadius: 1.5,
                        '&:hover': { color: 'rgba(255,255,255,0.82)', bgcolor: 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 34, color: 'inherit' }}>
                        <Icon size={15} strokeWidth={anyActive ? 2.2 : 1.75} />
                      </ListItemIcon>
                      {!collapsed && (
                        <>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
                          />
                          <ChevronDown
                            size={12}
                            style={{
                              color: 'rgba(255,255,255,0.28)',
                              transform: isOpen ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s',
                            }}
                          />
                        </>
                      )}
                    </ListItemButton>
                  </Tooltip>
                  {!collapsed && (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{
                        ml: 2.75,
                        borderLeft: '1px solid rgba(255,255,255,0.07)',
                        pl: 1.25, pb: 0.5, mt: 0.25,
                      }}>
                        {item.children.map(child => {
                          const active = location.pathname.startsWith(child.to);
                          const CIcon  = child.icon;
                          return (
                            <ListItemButton
                              key={child.to}
                              component={NavLink}
                              to={child.to}
                              onClick={onClose}
                              sx={{
                                px: 1.25, py: 0.625, mb: 0.25, borderRadius: 1.5,
                                color: active ? '#a5b4fc' : 'rgba(255,255,255,0.38)',
                                bgcolor: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                                fontWeight: active ? 600 : 400,
                                '&:hover': { color: 'rgba(255,255,255,0.72)', bgcolor: 'rgba(255,255,255,0.05)' },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
                                <CIcon size={13} strokeWidth={active ? 2.2 : 1.75} />
                              </ListItemIcon>
                              <ListItemText
                                primary={child.label}
                                primaryTypographyProps={{ fontSize: '12.5px', fontWeight: active ? 600 : 400 }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </Box>
                    </Collapse>
                  )}
                </Box>
              );
            }

            /* Regular nav item */
            const active = isActive(item);
            const Icon   = item.icon;
            return (
              <Tooltip key={item.to} title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  sx={{
                    px: 1.25, py: 0.875, mb: 0.25, borderRadius: 1.5,
                    position: 'relative', overflow: 'hidden',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    color: active ? '#c7d2fe' : 'rgba(255,255,255,0.48)',
                    bgcolor: active ? 'rgba(99,102,241,0.14)' : 'transparent',
                    '&:hover': {
                      color: active ? '#c7d2fe' : 'rgba(255,255,255,0.82)',
                      bgcolor: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.06)',
                    },
                    '&::before': active ? {
                      content: '""',
                      position: 'absolute',
                      left: 0, top: 6, bottom: 6, width: 3,
                      borderRadius: '0 6px 6px 0',
                      background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                    } : {},
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 34, color: 'inherit' }}>
                    <Icon size={15} strokeWidth={active ? 2.2 : 1.75} />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '13px', fontWeight: active ? 600 : 500 }}
                    />
                  )}
                  {!collapsed && active && (
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#818cf8', opacity: 0.85 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </Box>

        {/* User profile + logout */}
        <Box sx={{ px: 1, pb: 2, flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
          {!collapsed && user && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, py: 1,
              mb: 0.5, borderRadius: 1.5,
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <Avatar sx={{
                width: 28, height: 28, fontSize: 11, fontWeight: 700, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name?.split(' ')[0] || 'Admin'}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
          )}
          <Tooltip title={collapsed ? 'Sign Out' : ''} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                px: 1.25, py: 0.875, borderRadius: 1.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'rgba(255,255,255,0.28)',
                '&:hover': { color: '#f87171', bgcolor: 'rgba(239,68,68,0.1)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 'auto' : 34, color: 'inherit' }}>
                <LogOut size={14} strokeWidth={1.75} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }} />
              )}
            </ListItemButton>
          </Tooltip>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

/* ── Header ─────────────────────────────────────────────────────────── */
function Header({ sidebarW, onMenuClick }) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useAdminTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isDark = mode === 'dark';

  const [userAnchor,    setUserAnchor]    = useState(null);
  const [notifAnchor,   setNotifAnchor]   = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [searchValue,   setSearchValue]   = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchNotifications = useCallback(() => {
    api.get('/admin/notifications?limit=10')
      .then(({ data }) => {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  const markAllRead = () => {
    api.put('/admin/notifications/read-all')
      .then(() => {
        setUnreadCount(0);
        setNotifications(p => p.map(n => ({ ...n, read: true })));
      })
      .catch(() => {});
  };

  const { section, label } = getBreadcrumb(location.pathname);

  const headerBg = isDark
    ? 'rgba(12,14,22,0.88)'
    : 'rgba(255,255,255,0.88)';

  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        left:  { md: `${sidebarW}px` },
        width: { md: `calc(100% - ${sidebarW}px)` },
        bgcolor: headerBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${borderColor}`,
        color: isDark ? '#e2e8f0' : '#0f172a',
        transition: theme.transitions.create(['left', 'width'], {
          easing: theme.transitions.easing.easeInOut,
          duration: 220,
        }),
        zIndex: 20,
      }}
    >
      <Toolbar sx={{ height: 64, minHeight: '64px !important', px: { xs: 2, md: 3 }, gap: 1.5 }}>
        {/* Mobile menu button */}
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{ display: { md: 'none' }, color: 'inherit' }}
        >
          <MenuIcon size={18} />
        </IconButton>

        {/* Breadcrumb */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, flex: 1 }}>
          {section ? (
            <>
              <Typography sx={{ fontSize: 12.5, color: isDark ? '#64748b' : '#94a3b8', fontWeight: 500 }}>
                {section}
              </Typography>
              <ChevronRight size={12} color={isDark ? '#334155' : '#cbd5e1'} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e2e8f0' : '#0f172a' }}>
                {label}
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', letterSpacing: '-0.01em' }}>
              {label}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, display: { xs: 'flex', md: 'none' } }} />

        {/* Search */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1,
            height: 36, borderRadius: 2.5,
            border: '1px solid',
            borderColor: searchFocused
              ? isDark ? 'rgba(99,102,241,0.7)' : '#6366f1'
              : isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.14)',
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8f9fc',
            px: 1.5,
            width: searchFocused ? 260 : 190,
            transition: 'all 0.2s ease',
            boxShadow: searchFocused ? `0 0 0 3px rgba(99,102,241,0.14)` : 'none',
          }}
        >
          <Search size={13} color={isDark ? '#64748b' : '#94a3b8'} />
          <InputBase
            placeholder="Quick search…"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            sx={{ flex: 1, fontSize: '13px', color: isDark ? '#e2e8f0' : '#0f172a' }}
          />
          {searchValue && (
            <IconButton
              size="small"
              onClick={() => setSearchValue('')}
              sx={{ p: 0, color: isDark ? '#64748b' : '#94a3b8' }}
            >
              <X size={11} />
            </IconButton>
          )}
        </Box>

        {/* Notifications */}
        <Tooltip title="Notifications" placement="bottom">
          <IconButton
            onClick={e => setNotifAnchor(e.currentTarget)}
            size="small"
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.11)'}`,
              width: 34, height: 34,
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#e2e8f0' : '#0f172a',
              },
            }}
          >
            <Badge
              badgeContent={unreadCount > 9 ? '9+' : unreadCount}
              color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16, padding: '0 3px' } }}
            >
              <Bell size={15} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Notifications panel */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          PaperProps={{
            sx: {
              width: 328, mt: 1.5, borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark
                ? '0 20px 48px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.35)'
                : '0 20px 48px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.06)',
              overflow: 'hidden', p: 0,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2.5, py: 1.75,
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Box sx={{
                  px: 1, py: 0.25, fontSize: 10, fontWeight: 700,
                  bgcolor: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 6,
                }}>
                  {unreadCount} new
                </Box>
              )}
            </Box>
            {unreadCount > 0 && (
              <Tooltip title="Mark all read">
                <IconButton size="small" onClick={markAllRead} sx={{ color: '#6366f1' }}>
                  <CheckCheck size={14} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box sx={{ maxHeight: 320, overflowY: 'auto' }} className="admin-scroll">
            {notifications.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: 2.5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 1.5,
                }}>
                  <Bell size={18} style={{ opacity: 0.35 }} />
                </Box>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  No notifications yet
                </Typography>
              </Box>
            ) : notifications.map(n => (
              <MenuItem
                key={n._id}
                onClick={() => {
                  if (!n.read) {
                    api.put(`/admin/notifications/${n._id}/read`)
                      .then(() => {
                        setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x));
                        setUnreadCount(c => Math.max(0, c - 1));
                      }).catch(() => {});
                  }
                  setNotifAnchor(null);
                  navigate(n.link || '/admin/reviews');
                }}
                sx={{
                  alignItems: 'flex-start', gap: 1.5, py: 1.75, px: 2.5, mx: 0,
                  borderRadius: 0,
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  bgcolor: !n.read
                    ? (isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)')
                    : 'transparent',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  },
                }}
              >
                <Box sx={{ mt: 0.75, flexShrink: 0 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: n.read ? 'transparent' : '#6366f1' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 12.5, lineHeight: 1.45,
                    fontWeight: n.read ? 400 : 500,
                    color: n.read ? 'text.secondary' : 'text.primary',
                  }}>
                    {n.message}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5 }}>
                    {new Date(n.createdAt).toLocaleDateString('en-AE', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Box>
        </Menu>

        {/* Theme toggle */}
        <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} placement="bottom">
          <IconButton
            onClick={toggleMode}
            size="small"
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.11)'}`,
              width: 34, height: 34,
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#e2e8f0' : '#0f172a',
              },
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </IconButton>
        </Tooltip>

        {/* User avatar */}
        <Box
          onClick={e => setUserAnchor(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.25,
            height: 36, px: 1.25, borderRadius: 2.5, cursor: 'pointer',
            border: '1px solid transparent',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
          }}
        >
          <Avatar sx={{
            width: 26, height: 26, fontSize: 11, fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </Avatar>
          <Typography sx={{
            fontSize: 13, fontWeight: 600,
            maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: { xs: 'none', sm: 'block' },
            color: isDark ? '#e2e8f0' : '#0f172a',
          }}>
            {user?.name?.split(' ')[0] || 'Admin'}
          </Typography>
        </Box>

        {/* User menu */}
        <Menu
          anchorEl={userAnchor}
          open={Boolean(userAnchor)}
          onClose={() => setUserAnchor(null)}
          PaperProps={{
            sx: {
              width: 228, mt: 1.5, borderRadius: 3,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark
                ? '0 20px 48px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.35)'
                : '0 20px 48px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.06)',
              overflow: 'hidden', p: 0,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User info header */}
          <Box sx={{
            px: 2.5, py: 2,
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{
                width: 38, height: 38, fontSize: 14, fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>
                  {user?.name}
                </Typography>
                <Typography sx={{
                  fontSize: 11.5, color: 'text.disabled',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
                }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 1 }}>
            <MenuItem
              onClick={() => { setUserAnchor(null); logout(); navigate('/login'); }}
              sx={{ borderRadius: 2, color: 'error.main', fontWeight: 600, fontSize: '13px', gap: 1.5, mx: 0 }}
            >
              <LogOut size={14} /> Sign Out
            </MenuItem>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

/* ── AdminShell ──────────────────────────────────────────────────────── */
function AdminShell() {
  const theme = useTheme();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W;

  const sidebarContent = (
    <SidebarContent
      collapsed={collapsed}
      onToggle={() => setCollapsed(p => !p)}
      onClose={() => setMobileOpen(false)}
    />
  );

  return (
    <Box
      className="admin-root"
      sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}
    >
      {/* Desktop sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarW,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarW,
            boxSizing: 'border-box',
            bgcolor: '#0b0d14',
            border: 'none',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.easeInOut,
              duration: 220,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Mobile sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_W,
            bgcolor: '#0b0d14',
            border: 'none',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Header */}
      <Header sidebarW={sidebarW} onMenuClick={() => setMobileOpen(p => !p)} />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px',
          minHeight: '100vh',
          transition: theme.transitions.create('margin-left', {
            easing: theme.transitions.easing.easeInOut,
            duration: 220,
          }),
        }}
      >
        <Box
          className="page-enter"
          sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1600, mx: 'auto' }}
        >
          <Outlet />
        </Box>
      </Box>

      <Toast />
    </Box>
  );
}

export default function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminShell />
    </AdminThemeProvider>
  );
}

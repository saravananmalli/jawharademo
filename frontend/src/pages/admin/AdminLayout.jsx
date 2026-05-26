import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton, Avatar, Chip, Tooltip,
  Menu, MenuItem, useMediaQuery, useTheme, InputBase, Badge, Popover, Paper,
} from '@mui/material';
import DashboardIcon       from '@mui/icons-material/Dashboard';
import InventoryIcon       from '@mui/icons-material/Inventory2';
import ShoppingBagIcon     from '@mui/icons-material/ShoppingBag';
import PeopleIcon          from '@mui/icons-material/People';
import BarChartIcon        from '@mui/icons-material/BarChart';
import CategoryIcon        from '@mui/icons-material/Category';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import StarIcon            from '@mui/icons-material/Star';
import ImageIcon           from '@mui/icons-material/Image';
import LocalOfferIcon      from '@mui/icons-material/LocalOffer';
import SettingsIcon        from '@mui/icons-material/Settings';
import LogoutIcon          from '@mui/icons-material/Logout';
import MenuIcon            from '@mui/icons-material/Menu';
import DiamondIcon         from '@mui/icons-material/Diamond';
import DarkModeIcon           from '@mui/icons-material/DarkMode';
import LightModeIcon          from '@mui/icons-material/LightMode';
import SearchIcon             from '@mui/icons-material/Search';
import NotificationsIcon      from '@mui/icons-material/Notifications';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { useAuth }            from '../../context/AuthContext';
import api                    from '../../services/api';
import { AdminThemeProvider, useAdminTheme } from './AdminThemeContext';

const DRAWER_WIDTH = 252;

const NAV = [
  { section: 'Main' },
  { to: '/admin',            icon: <DashboardIcon />,          label: 'Dashboard',          end: true },
  { to: '/admin/analytics',  icon: <BarChartIcon />,           label: 'Analytics' },
  { section: 'Catalog' },
  { to: '/admin/products',   icon: <InventoryIcon />,          label: 'Products' },
  { to: '/admin/categories', icon: <CategoryIcon />,           label: 'Categories' },
  { to: '/admin/brands',     icon: <BrandingWatermarkIcon />,  label: 'Brands' },
  { section: 'Commerce' },
  { to: '/admin/orders',     icon: <ShoppingBagIcon />,        label: 'Orders' },
  { to: '/admin/customers',  icon: <PeopleIcon />,             label: 'Customers' },
  { to: '/admin/reviews',    icon: <StarIcon />,               label: 'Reviews' },
  { section: 'Content' },
  { to: '/admin/banners',    icon: <ImageIcon />,              label: 'Banners' },
  { to: '/admin/offers',     icon: <LocalOfferIcon />,         label: 'Offers & Countdown' },
  { section: 'System' },
  { to: '/admin/settings',   icon: <SettingsIcon />,           label: 'Settings' },
];

function SidebarContent({ onClose }) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.25, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <DiamondIcon sx={{ color: '#967123', fontSize: 26, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ color: '#967123', letterSpacing: 2.5, lineHeight: 1.2, fontWeight: 800, fontSize: '0.95rem' }}
              noWrap
            >
              JAWHARA
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.6rem', display: 'block' }}
            >
              Admin Panel
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Nav — scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: 4 } }}>
        <List dense disablePadding>
          {NAV.map((item, idx) => {
            if (item.section) {
              return (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{ px: 2.5, pt: idx === 0 ? 1.5 : 2.25, pb: 0.75, display: 'block', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.4, fontSize: '0.6rem', fontWeight: 700 }}
                >
                  {item.section}
                </Typography>
              );
            }
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <ListItem key={item.to} disablePadding sx={{ px: 1.25, mb: 0.25 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  onClick={onClose}
                  sx={{
                    borderRadius: '9px',
                    py: 0.9,
                    px: 1.5,
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.52)',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                    minHeight: 40,
                    transition: 'background-color 0.15s, color 0.15s',
                    '&:hover': {
                      backgroundColor: isActive ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)',
                      color: '#ffffff',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: 'inherit', '& svg': { fontSize: '1.1rem' } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.845rem', fontWeight: isActive ? 600 : 400, lineHeight: 1.3 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Sign out */}
      <Box sx={{ px: 1.25, pb: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: '9px', py: 0.9, px: 1.5, color: 'rgba(255,255,255,0.38)', minHeight: 40, transition: 'background-color 0.15s, color 0.15s', '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.07)' } }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: 'inherit', '& svg': { fontSize: '1.1rem' } }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.845rem', fontWeight: 400 }} />
        </ListItemButton>
      </Box>
    </Box>
  );
}

function AdminShell() {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useAdminTheme();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMd = useMediaQuery(muiTheme.breakpoints.up('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl]     = useState(null);

  // Notification bell state
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [notifAnchor, setNotifAnchor]       = useState(null);

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
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotifOpen  = (e) => { setNotifAnchor(e.currentTarget); fetchNotifications(); };
  const handleNotifClose = () => setNotifAnchor(null);

  const markAllRead = () => {
    api.put('/admin/notifications/read-all')
      .then(() => { setUnreadCount(0); setNotifications(p => p.map(n => ({ ...n, read: true }))); })
      .catch(() => {});
  };

  const handleDrawerToggle = () => setMobileOpen(p => !p);
  const handleMenuOpen     = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose    = () => setAnchorEl(null);
  const handleLogout       = () => { handleMenuClose(); logout(); navigate('/login'); };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── Permanent sidebar (desktop) ───────────────────────── */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="admin navigation"
      >
        {/* Mobile temp drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <SidebarContent onClose={handleDrawerToggle} />
        </Drawer>

        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
            },
          }}
          open
        >
          <SidebarContent onClose={() => {}} />
        </Drawer>
      </Box>

      {/* ── Main content area ─────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          // No extra ml needed — the nav Box above reserves the width in flex layout
        }}
      >
        {/* AppBar */}
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, sm: 64 }, px: { xs: 2, md: 3 } }}>
            {/* Mobile hamburger */}
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 0.5, color: 'text.primary' }}
              aria-label="open drawer"
            >
              <MenuIcon />
            </IconButton>

            {/* Rounded search bar — matches reference */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1,
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: '1px solid',
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
                borderRadius: '24px',
                px: 2,
                py: 0.6,
                flex: 1,
                maxWidth: 320,
              }}
            >
              <SearchIcon sx={{ fontSize: '1.05rem', color: 'text.secondary', flexShrink: 0 }} />
              <InputBase
                placeholder="Quick Search..."
                inputProps={{ 'aria-label': 'search' }}
                sx={{
                  flex: 1,
                  fontSize: '0.865rem',
                  color: 'text.primary',
                  '& input::placeholder': { color: 'text.secondary', opacity: 1 },
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Notification bell */}
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                onClick={handleNotifOpen}
                sx={{
                  width: 36, height: 36,
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '9px',
                  '&:hover': { color: 'primary.main', borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <Badge badgeContent={unreadCount} color="error" max={9}>
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={handleNotifClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { width: 340, mt: 0.5, borderRadius: 2 } }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
                {unreadCount > 0 && (
                  <Tooltip title="Mark all as read">
                    <IconButton size="small" onClick={markAllRead}>
                      <CheckCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No notifications</Typography>
                  </Box>
                ) : (
                  notifications.map(n => (
                    <Box
                      key={n._id}
                      sx={{
                        px: 2, py: 1.25,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: n.read ? 'transparent' : 'action.hover',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.selected' },
                      }}
                      onClick={() => {
                        if (!n.read) {
                          api.put(`/admin/notifications/${n._id}/read`)
                            .then(() => {
                              setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x));
                              setUnreadCount(c => Math.max(0, c - 1));
                            }).catch(() => {});
                        }
                        handleNotifClose();
                        navigate(n.link || '/admin/reviews');
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        {!n.read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.7, flexShrink: 0 }} />
                        )}
                        <Box sx={{ flex: 1, pl: n.read ? 1.5 : 0 }}>
                          <Typography variant="body2" fontWeight={n.read ? 400 : 600} sx={{ lineHeight: 1.4 }}>
                            {n.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(n.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Popover>

            {/* Dark / Light toggle */}
            <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                onClick={toggleMode}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '9px',
                  '&:hover': { color: 'primary.main', borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Admin chip */}
            <Chip
              label="Admin"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, height: 28, fontSize: '0.72rem', display: { xs: 'none', sm: 'flex' } }}
            />

            {/* Avatar menu */}
            <Tooltip title="Account settings">
              <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0.5 }}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ sx: { minWidth: 200, mt: 0.5 } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 'auto' }}><LogoutIcon fontSize="small" /></ListItemIcon>
                <Typography variant="body2" fontWeight={600}>Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
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

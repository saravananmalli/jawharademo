import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2, Package, Tag, Award, ShoppingBag,
  Users, Star, Image, Ticket, Smartphone, Monitor, PlayCircle,
  Layers, Settings, LogOut, Diamond, Bell, Sun, Moon, Menu,
  ChevronDown, ChevronLeft, ChevronRight, CheckCheck, Search,
  X, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AdminThemeProvider, useAdminTheme } from './AdminThemeContext';
import { Toast } from '../../components/admin/ui/Toast';
import '../../styles/admin/admin-tailwind.css';

/* ── Nav configuration ─────────────────────────────────────────── */
const NAV = [
  { section: 'Main' },
  { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard',   end: true },
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
      { to: '/admin/mobile/dashboard',   icon: Monitor,     label: 'Dashboard' },
      { to: '/admin/mobile/onboarding',  icon: PlayCircle,  label: 'Onboarding Screens' },
      { to: '/admin/mobile/home-banner', icon: Layers,      label: 'Home Banner' },
    ],
  },
  { section: 'System' },
  { to: '/admin/settings',   icon: Settings,        label: 'Settings' },
];

/* ── Sidebar ────────────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle, onClose, mobileOpen }) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [openAccordions, setOpenAccordions] = useState(() => {
    const init = {};
    NAV.forEach(item => {
      if (item.accordion) {
        init[item.accordion] = item.children.some(c => location.pathname.startsWith(c.to));
      }
    });
    return init;
  });

  const toggleAccordion = (key) =>
    setOpenAccordions(p => ({ ...p, [key]: !p[key] }));

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

  /* ── Inner content (shared between desktop & mobile) ─────────── */
  const Content = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo row */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shrink-0">
          <Diamond size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="text-sm font-bold text-white tracking-widest truncate leading-tight">JAWHARA</p>
            <p className="text-[10px] text-white/30 tracking-widest uppercase leading-tight">Admin Panel</p>
          </div>
        )}
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggle}
          className="hidden md:flex ml-auto w-6 h-6 items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/08 transition-colors shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 admin-scroll">
        {NAV.map((item, idx) => {
          /* Section label */
          if (item.section) {
            if (collapsed) return <div key={idx} className="my-2 mx-3 h-px bg-white/[0.06]" />;
            return (
              <p key={idx} className="px-4 pt-4 pb-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em]">
                {item.section}
              </p>
            );
          }

          /* Accordion group */
          if (item.accordion) {
            const isOpen = openAccordions[item.accordion];
            const anyActive = item.children.some(c => location.pathname.startsWith(c.to));
            const Icon = item.icon;
            return (
              <div key={item.accordion}>
                <button
                  onClick={() => toggleAccordion(item.accordion)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 w-full mx-2 my-0.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 group
                    ${anyActive && !isOpen ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'}
                    ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'w-[calc(100%-16px)]'}`}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      <ChevronDown
                        size={13}
                        className={`text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="ml-5 my-0.5 border-l border-white/[0.06] pl-3 space-y-0.5">
                    {item.children.map(child => {
                      const active = location.pathname.startsWith(child.to);
                      const CIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150
                            ${active ? 'bg-indigo-500/15 text-indigo-300 font-medium' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'}`}
                        >
                          <CIcon size={14} className="shrink-0" />
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          /* Regular nav item */
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 my-0.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150
                ${active
                  ? 'bg-indigo-500/15 text-indigo-300 font-semibold'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                }
                ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'mx-2 w-[calc(100%-16px)]'}`}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1 h-4 rounded-full bg-indigo-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-4 pt-2 border-t border-white/[0.06] shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-sm text-white/35 hover:text-white hover:bg-white/[0.06] transition-all duration-150 ${collapsed ? 'justify-center w-10 h-10 mx-auto' : ''}`}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 h-screen bg-[#0f1117] border-r border-white/[0.05] z-30 transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
      >
        <Content />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <aside className="fixed top-0 left-0 h-screen w-[240px] bg-[#0f1117] border-r border-white/[0.05] z-50 md:hidden flex flex-col"
            style={{ animation: 'slideInLeft 0.22s ease-out both' }}
          >
            <Content />
          </aside>
          <style>{`@keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>
        </>
      )}
    </>
  );
}

/* ── Header ─────────────────────────────────────────────────────── */
function Header({ collapsed, onMenuClick }) {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [searchOpen, setSearchOpen]       = useState(false);

  const userMenuRef = useRef(null);
  const notifRef    = useRef(null);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const markAllRead = () => {
    api.put('/admin/notifications/read-all')
      .then(() => {
        setUnreadCount(0);
        setNotifications(p => p.map(n => ({ ...n, read: true })));
      })
      .catch(() => {});
  };

  const handleReadNotif = (n) => {
    if (!n.read) {
      api.put(`/admin/notifications/${n._id}/read`)
        .then(() => {
          setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x));
          setUnreadCount(c => Math.max(0, c - 1));
        }).catch(() => {});
    }
    setNotifOpen(false);
    navigate(n.link || '/admin/reviews');
  };

  /* Breadcrumb */
  const crumb = (() => {
    const p = location.pathname;
    if (p === '/admin') return 'Dashboard';
    const parts = p.replace('/admin/', '').split('/');
    return parts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' › ');
  })();

  const sidebarW = collapsed ? 68 : 240;

  const iconBtn = 'w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-150';

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center gap-3 px-4 md:px-6 h-[60px] bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-100 dark:border-gray-800 transition-all duration-250"
      style={{ left: `${sidebarW}px` }}
    >
      {/* Mobile hamburger */}
      <button onClick={onMenuClick} className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="hidden sm:flex items-center text-sm">
        <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">{crumb}</span>
      </div>

      <div className="flex-1" />

      {/* Search (mobile icon + desktop bar) */}
      {searchOpen ? (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 min-w-[200px]">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Quick search..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            onBlur={() => setSearchOpen(false)}
          />
          <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
        </div>
      ) : (
        <>
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 w-48 lg:w-64 cursor-text" onClick={() => setSearchOpen(true)}>
            <Search size={13} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-400 dark:text-gray-500 select-none">Quick search...</span>
          </div>
          <button onClick={() => setSearchOpen(true)} className={`sm:hidden ${iconBtn}`}>
            <Search size={15} />
          </button>
        </>
      )}

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => setNotifOpen(p => !p)} className={`${iconBtn} relative`}>
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
            style={{ animation: 'fadeDown 0.15s ease-out both' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto admin-scroll">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">No notifications</p>
                </div>
              ) : notifications.map(n => (
                <button
                  key={n._id}
                  onClick={() => handleReadNotif(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-indigo-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button onClick={toggleMode} className={iconBtn} title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
        {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* User avatar */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(p => !p)}
          className="flex items-center gap-2 pl-1 pr-2 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="hidden sm:block text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
            {user?.name || 'Admin'}
          </span>
          <ChevronDown size={12} className="hidden sm:block text-gray-400" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
            style={{ animation: 'fadeDown 0.15s ease-out both' }}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <button
                onClick={() => { setUserMenuOpen(false); logout(); navigate('/login'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes fadeDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </header>
  );
}

/* ── Shell ──────────────────────────────────────────────────────── */
function AdminShell() {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const sidebarW = collapsed ? 68 : 240;

  return (
    <div className="admin-root min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(p => !p)}
        onClose={() => setMobileOpen(false)}
        mobileOpen={mobileOpen}
      />
      <Header
        collapsed={collapsed}
        onMenuClick={() => setMobileOpen(p => !p)}
      />
      <main
        className="transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: `${sidebarW}px`, paddingTop: '60px' }}
      >
        <div className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-60px)] page-enter">
          <Outlet />
        </div>
      </main>
      <Toast />
    </div>
  );
}

/* ── Layout entry point ─────────────────────────────────────────── */
export default function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminShell />
    </AdminThemeProvider>
  );
}

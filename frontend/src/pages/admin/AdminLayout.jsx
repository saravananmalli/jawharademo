import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2, Package, Tag, Award, ShoppingBag,
  Users, Star, Image, Ticket, Smartphone, Monitor, PlayCircle,
  Layers, Settings, LogOut, Diamond, Bell, Sun, Moon, Menu,
  ChevronDown, ChevronLeft, ChevronRight, CheckCheck, Search,
  X, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AdminThemeProvider, useAdminTheme } from './AdminThemeContext';
import { Toast } from '../../components/admin/ui/Toast';
import '../../styles/admin/admin-tailwind.css';

const NAV = [
  { section: 'Main' },
  { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard',         end: true },
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
  { to: '/admin/settings',   icon: Settings,        label: 'Settings' },
];

/* ── Sidebar Content ─────────────────────────────────────────────── */
function SidebarContent({ collapsed, onClose, onToggle }) {
  const location  = useLocation();
  const { logout } = useAuth();
  const navigate  = useNavigate();

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

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[60px] border-b border-white/[0.07] shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
          <Diamond size={15} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-white tracking-[0.18em] truncate leading-tight">JAWHARA</p>
            <p className="text-[9px] text-white/30 tracking-[0.15em] uppercase leading-tight mt-0.5">Admin Panel</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden md:flex ml-auto w-7 h-7 items-center justify-center rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.07] transition-all shrink-0"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 admin-scroll px-2">
        {NAV.map((item, idx) => {
          /* Section divider */
          if (item.section) {
            if (collapsed) return <div key={idx} className="my-2 mx-1 h-px bg-white/[0.06]" />;
            return (
              <p key={idx} className={`px-2 pb-1.5 text-[10px] font-bold text-white/25 uppercase tracking-[0.14em] ${idx === 0 ? 'pt-1' : 'pt-4'}`}>
                {item.section}
              </p>
            );
          }

          /* Accordion group */
          if (item.accordion) {
            const isOpen     = openAccordions[item.accordion];
            const anyActive  = item.children.some(c => location.pathname.startsWith(c.to));
            const Icon       = item.icon;
            return (
              <div key={item.accordion} className="mb-0.5">
                <button
                  onClick={() => toggleAccordion(item.accordion)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150
                    ${anyActive && !isOpen ? 'bg-white/[0.08] text-white' : 'text-white/45 hover:text-white hover:bg-white/[0.05]'}
                    ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={15} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown size={12} className={`text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="ml-4 mt-0.5 border-l border-white/[0.07] pl-3 space-y-0.5 pb-1">
                    {item.children.map(child => {
                      const active = location.pathname.startsWith(child.to);
                      const CIcon  = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] transition-all duration-150
                            ${active
                              ? 'bg-indigo-500/[0.18] text-indigo-300 font-semibold'
                              : 'text-white/38 hover:text-white/75 hover:bg-white/[0.04]'}`}
                        >
                          <CIcon size={13} className="shrink-0" />
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
          const Icon   = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 mb-0.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150
                ${active
                  ? 'bg-indigo-500/[0.18] text-indigo-300'
                  : 'text-white/45 hover:text-white hover:bg-white/[0.05]'}
                ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon size={15} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-3 pt-2 border-t border-white/[0.06] shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-[13px] text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

/* ── Sidebar wrapper ─────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle, onClose, mobileOpen }) {
  const sidebarClasses = 'flex flex-col h-screen bg-[#0f1117] border-r border-white/[0.08]';

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 z-30 overflow-hidden ${sidebarClasses} transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'w-[64px]' : 'w-[232px]'}`}
      >
        <SidebarContent collapsed={collapsed} onClose={() => {}} onToggle={onToggle} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden" onClick={onClose} />
          <aside
            className={`fixed top-0 left-0 z-50 w-[232px] md:hidden ${sidebarClasses}`}
            style={{ animation: 'slideInLeft 0.22s ease-out both' }}
          >
            <SidebarContent collapsed={false} onClose={onClose} onToggle={onToggle} />
          </aside>
          <style>{`@keyframes slideInLeft { from { transform:translateX(-100%) } to { transform:translateX(0) } }`}</style>
        </>
      )}
    </>
  );
}

/* ── Header ─────────────────────────────────────────────────────── */
function Header({ sidebarW, onMenuClick }) {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useAdminTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [notifOpen,    setNotifOpen]      = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  const userMenuRef = useRef(null);
  const notifRef    = useRef(null);
  const searchRef   = useRef(null);

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
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  const markAllRead = () => {
    api.put('/admin/notifications/read-all')
      .then(() => { setUnreadCount(0); setNotifications(p => p.map(n => ({ ...n, read: true }))); })
      .catch(() => {});
  };

  /* Page title from URL */
  const pageTitle = (() => {
    const p = location.pathname;
    if (p === '/admin') return 'Dashboard';
    const parts = p.replace('/admin/', '').split('/');
    return parts.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' / ');
  })();

  /* Icon button style */
  const iconBtn = `w-8 h-8 flex items-center justify-center rounded-lg
    text-gray-500 dark:text-gray-400
    hover:text-gray-800 dark:hover:text-gray-100
    hover:bg-gray-100 dark:hover:bg-gray-700
    border border-gray-200 dark:border-gray-600
    transition-all duration-150`;

  return (
    <header
      className="fixed top-0 right-0 z-20 h-[60px] flex items-center gap-3 px-5 bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 transition-[left] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ left: `${sidebarW}px`, backgroundColor: mode === 'dark' ? '#161b22' : '#ffffff' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Page title (desktop) */}
      <span className="hidden md:block text-sm font-semibold text-gray-600 dark:text-gray-300">
        {pageTitle}
      </span>

      <div className="flex-1" />

      {/* Search */}
      <div
        ref={searchRef}
        className={`hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border transition-all duration-150 cursor-text
          ${searchFocused
            ? 'w-56 border-indigo-400 bg-white dark:bg-gray-700 ring-2 ring-indigo-500/20'
            : 'w-44 lg:w-52 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60'}`}
        onClick={() => searchRef.current?.querySelector('input')?.focus()}
      >
        <Search size={13} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 text-[13px] bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => setNotifOpen(p => !p)} className={`${iconBtn} relative`}>
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            style={{ animation: 'dropDown 0.15s ease-out both' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto admin-scroll">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={22} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">No notifications</p>
                </div>
              ) : notifications.map(n => (
                <button
                  key={n._id}
                  onClick={() => {
                    if (!n.read) {
                      api.put(`/admin/notifications/${n._id}/read`)
                        .then(() => {
                          setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x));
                          setUnreadCount(c => Math.max(0, c - 1));
                        }).catch(() => {});
                    }
                    setNotifOpen(false);
                    navigate(n.link || '/admin/reviews');
                  }}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-indigo-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug ${n.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
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
      <button onClick={toggleMode} className={iconBtn} title={mode === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
        {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* User menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(p => !p)}
          className="flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="hidden sm:block text-[13px] font-medium text-gray-700 dark:text-gray-200 max-w-[72px] truncate">
            {user?.name?.split(' ')[0] || 'Admin'}
          </span>
          <ChevronDown size={12} className="hidden sm:block text-gray-400" />
        </button>

        {userMenuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            style={{ animation: 'dropDown 0.15s ease-out both' }}
          >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <button
                onClick={() => { setUserMenuOpen(false); logout(); navigate('/login'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes dropDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </header>
  );
}

/* ── Shell ──────────────────────────────────────────────────────── */
function AdminShell() {
  const [collapsed,   setCollapsed]  = useState(false);
  const [mobileOpen,  setMobileOpen] = useState(false);
  const sidebarW = collapsed ? 64 : 232;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(p => !p)}
        onClose={() => setMobileOpen(false)}
        mobileOpen={mobileOpen}
      />
      <Header
        sidebarW={sidebarW}
        onMenuClick={() => setMobileOpen(p => !p)}
      />
      <main
        className="transition-[margin-left] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: `${sidebarW}px`, paddingTop: '60px' }}
      >
        <div className="p-5 md:p-6 lg:p-8 min-h-[calc(100vh-60px)] page-enter">
          <Outlet />
        </div>
      </main>
      <Toast />
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminShell />
    </AdminThemeProvider>
  );
}

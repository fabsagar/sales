import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
    Bell, LogOut, Menu, X, ChevronRight, Building2, UserCog,
    TrendingUp, PlusCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { notificationsApi } from '../lib/api.js';
import clsx from '../lib/clsx.js';

const NAV_ITEMS = {
    admin: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/orders', icon: ShoppingCart, label: 'Orders' },
        { to: '/retailers', icon: Building2, label: 'Shops' },
        { to: '/reports', icon: TrendingUp, label: 'Reports' },
        { to: '/users', icon: UserCog, label: 'Users' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
    ],
    salesperson: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/products/gallery', icon: Package, label: 'Product Gallery' },
        { to: '/orders', icon: ShoppingCart, label: 'My Orders' },
        { to: '/orders/new', icon: PlusCircle, label: 'New Order' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
    ],
    retailer: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/orders', icon: ShoppingCart, label: 'My Orders' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
    ],
};

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const pollRef = useRef(null);

    const navItems = NAV_ITEMS[user?.role] || [];

    // Polling notifications every 8 seconds
    useEffect(() => {
        const poll = async () => {
            try {
                const data = await notificationsApi.list({ unread: 'true', limit: 1 });
                setUnreadCount(data.unread_count || 0);
            } catch { }
        };
        poll();
        pollRef.current = setInterval(poll, 8000);
        return () => clearInterval(pollRef.current);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const roleColors = {
        admin: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
        salesperson: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        retailer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    };

    return (
        <div className="flex h-screen overflow-hidden bg-surface-900">
            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                'fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col',
                'bg-surface-950 border-r border-surface-700/50',
                'transition-transform duration-300 lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="flex items-center justify-between p-5 border-b border-surface-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/50">
                            <BarChart3 size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-sm leading-none">SalesPro</h1>
                            <p className="text-slate-500 text-xs mt-0.5">Management</p>
                        </div>
                    </div>
                    <button className="lg:hidden p-1.5 rounded-lg hover:bg-surface-700 text-slate-400" onClick={() => setSidebarOpen(false)}>
                        <X size={16} />
                    </button>
                </div>

                {/* User info */}
                <div className="p-4 border-b border-surface-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                            <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize', roleColors[user?.role])}>
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
                        >
                            <div className="relative">
                                <Icon size={18} />
                                {label === 'Notifications' && unreadCount > 0 && (
                                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </div>
                            <span className="flex-1">{label}</span>
                            <ChevronRight size={14} className="opacity-30" />
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-surface-700/50">
                    <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-white hover:bg-red-600/20">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="bg-surface-950/80 backdrop-blur-sm border-b border-surface-700/50 px-4 h-14 flex items-center justify-between flex-shrink-0">
                    <button
                        className="lg:hidden p-2 rounded-xl hover:bg-surface-700 text-slate-400 hover:text-white transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-3 ml-auto">
                        <NavLink to="/notifications" className="relative btn-icon">
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </NavLink>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TrendingUp, ShoppingCart, Package, Users, Clock, CheckCircle,
    XCircle, AlertTriangle, DollarSign, ArrowUpRight, PlusCircle
} from 'lucide-react';
import { reportsApi, ordersApi } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatCurrency, formatDate } from '../lib/format.js';

function StatCard({ icon: Icon, label, value, sub, color = 'primary', trend }) {
    const colors = {
        primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                {trend !== undefined && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <ArrowUpRight size={12} className={trend < 0 ? 'rotate-90' : ''} />
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div className="mt-3">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-slate-400 mt-0.5">{label}</p>
                {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        pending: <span className="badge-pending">Pending</span>,
        approved: <span className="badge-approved">Approved</span>,
        rejected: <span className="badge-rejected">Rejected</span>,
    };
    return map[status] || <span>{status}</span>;
}

export default function DashboardPage() {
    const { user, activeRole } = useAuth();
    const [summary, setSummary] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const ordersData = await ordersApi.list({ limit: 5 });
                setRecentOrders(ordersData.orders || []);
                if (activeRole === 'admin') {
                    const summaryData = await reportsApi.summary();
                    setSummary(summaryData.summary);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="spinner w-8 h-8 border-primary-500" />
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Welcome back, <span className="gradient-text">{user.name}</span> 👋
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Here's what's happening with your sales today.</p>
                </div>
                {['admin', 'salesperson'].includes(activeRole) && (
                    <Link to="/orders/new" className="btn-primary">
                        <PlusCircle size={16} /> New Order
                    </Link>
                )}
            </div>

            {/* Admin stats */}
            {activeRole === 'admin' && summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(summary.total_revenue)} color="primary" />
                    <StatCard icon={TrendingUp} label="Total Profit" value={formatCurrency(summary.total_profit)} color="emerald" />
                    <StatCard icon={ShoppingCart} label="Total Orders" value={summary.total_orders} sub={`${summary.pending_orders} pending`} color="blue" />
                    <StatCard icon={Package} label="Products" value={summary.total_products} sub={`${summary.low_stock_products} low stock`} color="amber" />
                </div>
            )}

            {/* Salesperson quick stats */}
            {activeRole === 'salesperson' && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard icon={ShoppingCart} label="My Orders" value={recentOrders.length} color="primary" />
                    <StatCard icon={CheckCircle} label="Success" value={recentOrders.filter(o => o.status === 'approved').length} color="emerald" />
                    <StatCard icon={XCircle} label="Rejected" value={recentOrders.filter(o => o.status === 'rejected').length} color="red" />
                </div>
            )}

            {/* Recent Orders */}
            <div className="section-card">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-white">Recent Orders</h2>
                    <Link to="/orders" className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
                        View all <ArrowUpRight size={14} />
                    </Link>
                </div>
                {recentOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No orders yet.</p>
                        {['admin', 'salesperson'].includes(activeRole) && (
                            <Link to="/orders/new" className="btn-primary mt-4 inline-flex">Create first order</Link>
                        )}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Shop</th>
                                    {activeRole === 'admin' && <th>Salesperson</th>}
                                    <th>Amount</th>
                                    {activeRole === 'admin' && <th>Profit</th>}
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td><Link to={`/orders/${order.id}`} className="text-primary-400 hover:text-primary-300 font-medium">#{order.id}</Link></td>
                                        <td>{order.retailer_name}</td>
                                        {activeRole === 'admin' && <td>{order.salesperson_name}</td>}
                                        <td className="font-medium text-white">{formatCurrency(order.total_amount)}</td>
                                        {activeRole === 'admin' && <td className="text-emerald-400">{formatCurrency(order.total_profit)}</td>}
                                        <td><StatusBadge status={order.status} /></td>
                                        <td className="text-slate-500">{formatDate(order.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

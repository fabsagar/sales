import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Loader2, ShoppingCart } from 'lucide-react';
import { ordersApi } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatCurrency, formatDateTime } from '../lib/format.js';
import toast from 'react-hot-toast';

function StatusBadge({ status }) {
    if (status === 'pending') return <span className="badge-pending">Pending</span>;
    if (status === 'approved') return <span className="badge-approved">Approved</span>;
    return <span className="badge-rejected">Rejected</span>;
}

export default function OrdersPage() {
    const { user, activeRole } = useAuth();
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(1);
    const [updating, setUpdating] = useState(null);
    const [exporting, setExporting] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (filter) params.status = filter;
            const data = await ordersApi.list(params);
            setOrders(data.orders || []);
            setPagination(data.pagination || {});
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    }, [filter, page]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleStatusChange = async (orderId, status) => {
        setUpdating(orderId);
        try {
            await ordersApi.updateStatus(orderId, status);
            toast.success(`Order #${orderId} ${status}`);
            fetchOrders();
        } catch (err) { toast.error(err.message); }
        finally { setUpdating(null); }
    };

    const handleExport = async () => {
        setExporting(true);
        try { await ordersApi.export(); toast.success('CSV downloaded'); }
        catch (err) { toast.error(err.message); }
        finally { setExporting(false); }
    };

    const isAdmin = activeRole === 'admin';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Orders</h1>
                    <p className="text-slate-400 text-sm mt-1">{pagination.total || 0} total orders</p>
                </div>
                {isAdmin && (
                    <button onClick={handleExport} disabled={exporting} className="btn-secondary">
                        {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        Export CSV
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                {['', 'pending', 'approved', 'rejected'].map(s => (
                    <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === s ? 'bg-primary-600 text-white' : 'bg-surface-800 text-slate-400 hover:text-white hover:bg-surface-700'}`}>
                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-primary-500" /></div>
            ) : orders.length === 0 ? (
                <div className="section-card text-center py-16">
                    <ShoppingCart size={48} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 font-medium">No orders found</p>
                </div>
            ) : (
                <>
                    <div className="table-wrap section-card p-0">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Shop</th>
                                    {isAdmin && <th>Salesperson</th>}
                                    <th>Amount</th>
                                    {isAdmin && <th>Profit</th>}
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td className="font-mono text-slate-400">#{order.id}</td>
                                        <td className="font-medium text-white">{order.retailer_name}</td>
                                        {isAdmin && <td>{order.salesperson_name}</td>}
                                        <td className="font-semibold">{formatCurrency(order.total_amount)}</td>
                                        {isAdmin && <td className="text-emerald-400">{formatCurrency(order.total_profit)}</td>}
                                        <td><StatusBadge status={order.status} /></td>
                                        <td className="text-slate-500 text-xs">{formatDateTime(order.created_at)}</td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <Link to={`/orders/${order.id}`} className="btn-icon btn-sm" title="View">
                                                    <Eye size={13} />
                                                </Link>
                                                {isAdmin && order.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(order.id, 'approved')}
                                                            disabled={updating === order.id}
                                                            className="btn-success btn-sm" title="Approve"
                                                        >
                                                            {updating === order.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(order.id, 'rejected')}
                                                            disabled={updating === order.id}
                                                            className="btn-danger btn-sm" title="Reject"
                                                        >
                                                            <XCircle size={13} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${p === page ? 'bg-primary-600 text-white' : 'bg-surface-800 text-slate-400 hover:bg-surface-700'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

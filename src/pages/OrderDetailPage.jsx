import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, Printer, CheckCircle, XCircle, Package, Loader2, FileText } from 'lucide-react';
import { ordersApi } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatCurrency, formatDateTime } from '../lib/format.js';
import InvoiceTemplate from '../components/InvoiceTemplate.jsx';
import toast from 'react-hot-toast';

function StatusBadge({ status }) {
    if (status === 'pending') return <span className="badge-pending text-sm px-3 py-1">⏳ Pending</span>;
    if (status === 'approved') return <span className="badge-approved text-sm px-3 py-1">✅ Approved</span>;
    return <span className="badge-rejected text-sm px-3 py-1">❌ Rejected</span>;
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, activeRole } = useAuth();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Invoice-Order-${id}`,
        pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `,
    });

    useEffect(() => {
        ordersApi.get(id)
            .then(data => { setOrder(data.order); setItems(data.items || []); })
            .catch(err => { toast.error(err.message); navigate('/orders'); })
            .finally(() => setLoading(false));
    }, [id]);

    const handleStatus = async (status) => {
        setUpdating(true);
        try {
            await ordersApi.updateStatus(id, status);
            setOrder(o => ({ ...o, status }));
            toast.success(`Order ${status}`);
        } catch (err) { toast.error(err.message); }
        finally { setUpdating(false); }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-primary-500" /></div>;
    if (!order) return null;

    const isAdmin = activeRole === 'admin';

    return (
        <div className="animate-fade-in max-w-5xl">
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/orders')} className="btn-icon">
                        <ArrowLeft size={17} />
                    </button>
                    <div>
                        <h1 className="page-title">Order #{String(id).padStart(5, '0')}</h1>
                        <p className="text-slate-400 text-sm mt-1">{formatDateTime(order.created_at)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <button onClick={handlePrint} className="btn-secondary no-print">
                        <Printer size={15} /> Print Invoice
                    </button>
                </div>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="section-card">
                    <p className="text-xs text-slate-500 mb-1">Shop</p>
                    <p className="font-bold text-white">{order.retailer_name}</p>
                    {order.retailer_email && <p className="text-xs text-slate-400 mt-1">{order.retailer_email}</p>}
                    {order.retailer_phone && <p className="text-xs text-slate-400">{order.retailer_phone}</p>}
                    {order.retailer_address && <p className="text-xs text-slate-500 mt-1">{order.retailer_address}</p>}
                </div>
                <div className="section-card">
                    <p className="text-xs text-slate-500 mb-1">Salesperson</p>
                    <p className="font-bold text-white">{order.salesperson_name}</p>
                    {order.notes && <p className="text-xs text-slate-400 mt-2 italic">"{order.notes}"</p>}
                </div>
                <div className="section-card">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Total Revenue</span>
                            <span className="font-bold text-white text-lg">{formatCurrency(order.total_amount)}</span>
                        </div>
                        {isAdmin && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Total Profit</span>
                                <span className="font-bold text-emerald-400 text-lg">{formatCurrency(order.total_profit)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-surface-700/50">
                            <span className="text-xs text-slate-400">Items</span>
                            <span className="font-semibold text-slate-300">{items.length} products</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items Table */}
            <div className="section-card mb-6">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Package size={17} /> Order Items
                </h2>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th className="text-right">Qty</th>
                                {isAdmin && <th className="text-right">Purchase Price</th>}
                                <th className="text-right">Selling Price</th>
                                <th className="text-right">Line Total</th>
                                {isAdmin && <th className="text-right">Profit</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const lineTotal = item.selling_price * item.quantity;
                                const lineProfit = (item.selling_price - item.purchase_price) * item.quantity;
                                return (
                                    <tr key={item.id}>
                                        <td className="font-medium text-white">{item.product_name}</td>
                                        <td>{item.category}</td>
                                        <td className="text-right">{item.quantity}</td>
                                        {isAdmin && <td className="text-right text-slate-400">{formatCurrency(item.purchase_price)}</td>}
                                        <td className="text-right text-primary-400 font-medium">{formatCurrency(item.selling_price)}</td>
                                        <td className="text-right font-semibold text-white">{formatCurrency(lineTotal)}</td>
                                        {isAdmin && <td className="text-right text-emerald-400">{formatCurrency(lineProfit)}</td>}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-surface-600">
                                <td colSpan={isAdmin ? "4" : "3"} className="px-4 py-3 text-right font-bold text-white">Totals</td>
                                <td className="px-4 py-3 text-right font-bold text-white text-base">{formatCurrency(order.total_amount)}</td>
                                {isAdmin && <td className="px-4 py-3 text-right font-bold text-emerald-400 text-base">{formatCurrency(order.total_profit)}</td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && order.status === 'pending' && (
                <div className="section-card no-print">
                    <h2 className="font-semibold text-white mb-4">Order Actions</h2>
                    <div className="flex gap-3">
                        <button onClick={() => handleStatus('approved')} disabled={updating} className="btn-success flex-1 py-3">
                            {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Approve Order
                        </button>
                        <button onClick={() => handleStatus('rejected')} disabled={updating} className="btn-danger flex-1 py-3">
                            <XCircle size={16} /> Reject Order
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden print area */}
            <div className="hidden">
                <InvoiceTemplate ref={printRef} order={order} items={items} />
            </div>
        </div>
    );
}

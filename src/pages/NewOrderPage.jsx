import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingCart, Search, Loader2, ChevronDown, Building2 } from 'lucide-react';
import { productsApi, retailersApi, ordersApi } from '../lib/api.js';
import { formatCurrency } from '../lib/format.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function NewOrderPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [retailers, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedShop, setSelectedShop] = useState('');
    const [search, setSearch] = useState('');
    const [orderItems, setOrderItems] = useState([]); // [{product, quantity, selling_price}]
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            retailersApi.list(),
            productsApi.list({ limit: 100 }),
        ]).then(([r, p]) => {
            const fetchedShops = r.retailers || [];
            const fetchedProducts = p.products || [];
            setShops(fetchedShops);
            setProducts(fetchedProducts);

            // Handle pre-filled products from Gallery
            const selected = location.state?.selectedProducts;
            const preShop = location.state?.selectedShop;

            if (preShop) setSelectedShop(preShop.toString());

            if (selected && fetchedProducts.length > 0) {
                const items = Object.entries(selected).map(([id, data]) => {
                    const product = fetchedProducts.find(p => p.id === parseInt(id));
                    const quantity = typeof data === 'object' ? data.qty : data;
                    if (!product || quantity <= 0) return null;

                    const selling_price = typeof data === 'object' ? (data.price || '') : '';
                    return { product, quantity, selling_price };
                }).filter(Boolean);

                if (items.length > 0) {
                    setOrderItems(items);
                    toast.success(`Imported ${items.length} items from gallery`);
                }
            }
        }).catch(err => toast.error(err.message))
            .finally(() => setLoading(false));
    }, [location.state, productsApi, retailersApi]);
    // Note: removed unnecessary log/comment from previous failed attempt

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    const updatePrice = (index, price) => {
        const newItems = [...orderItems];
        newItems[index].selling_price = price;
        setOrderItems(newItems);
    };

    const addItem = (product) => {
        const existing = orderItems.find(i => i.product.id === product.id);
        if (existing) {
            setOrderItems(items => items.map(i =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setOrderItems(items => [...items, {
                product,
                quantity: 1,
                selling_price: '',
            }]);
        }
        toast.success(`${product.name} added`, { duration: 1500 });
    };

    const updateItem = (productId, field, value) => {
        setOrderItems(items => items.map(i =>
            i.product.id === productId ? { ...i, [field]: value } : i
        ));
    };

    const removeItem = (productId) => {
        setOrderItems(items => items.filter(i => i.product.id !== productId));
    };

    const totals = orderItems.reduce((acc, item) => {
        const sp = parseFloat(item.selling_price) || 0;
        const pp = item.product.purchase_price || 0;
        const qty = parseInt(item.quantity) || 0;
        acc.amount += sp * qty;
        acc.profit += (sp - pp) * qty;
        acc.items += qty;
        return acc;
    }, { amount: 0, profit: 0, items: 0 });

    const isAdmin = useAuth().user.role === 'admin';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedShop) { toast.error('Please select a shop'); return; }
        if (orderItems.length === 0) { toast.error('Please add at least one product'); return; }

        // Validate quantities and prices
        for (const item of orderItems) {
            if (!item.quantity || item.quantity < 1) { toast.error(`Invalid quantity for ${item.product.name}`); return; }
            if (!item.selling_price || item.selling_price < 0) { toast.error(`Invalid price for ${item.product.name}`); return; }
            if (!isAdmin && parseFloat(item.selling_price) < item.product.purchase_price) {
                toast.error(`Price for ${item.product.name} is not correct`);
                return;
            }
            if (item.quantity > item.product.stock_quantity) { toast.error(`Insufficient stock for ${item.product.name}`); return; }
        }

        setSubmitting(true);
        try {
            const payload = {
                retailer_id: parseInt(selectedShop),
                notes,
                items: orderItems.map(i => ({
                    product_id: i.product.id,
                    quantity: parseInt(i.quantity),
                    selling_price: parseFloat(i.selling_price),
                })),
            };
            const data = await ordersApi.create(payload);
            toast.success('Order submitted successfully!');
            navigate(`/orders/${data.orderId}`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-primary-500" /></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Create New Order</h1>
                    <p className="text-slate-400 text-sm mt-1">Select shop and add products</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Left: Products */}
                    <div className="xl:col-span-3 space-y-4">
                        {/* Shop select */}
                        <div className="section-card">
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                <Building2 size={13} className="inline mr-1" /> Select Shop *
                            </label>
                            <select
                                className="input"
                                value={selectedShop}
                                onChange={e => setSelectedShop(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Shop --</option>
                                {retailers.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} {r.phone ? `(${r.phone})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        {/* Product search */}
                        <div className="section-card">
                            <h2 className="font-semibold text-white text-sm mb-3">Add Products</h2>
                            <div className="relative mb-3">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input className="input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {filtered.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-6">No products found</p>
                                ) : filtered.map(product => (
                                    <div key={product.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                    ${product.stock_quantity < 1
                                            ? 'border-surface-700/30 opacity-50 cursor-not-allowed'
                                            : 'border-surface-700 hover:border-primary-500/50 hover:bg-surface-800/50'
                                        }`}
                                        onClick={() => product.stock_quantity > 0 && addItem(product)}
                                    >
                                        <div className="w-16 h-16 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0 text-slate-500 overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ShoppingCart size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-semibold text-white truncate">{product.name}</p>
                                            <p className="text-xs text-slate-500">{product.category} · Stock: {product.stock_quantity}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {isAdmin && <p className="text-base font-bold text-primary-400">{formatCurrency(product.default_selling_price)}</p>}
                                            {isAdmin && <p className="text-[10px] text-slate-500">Cost: {formatCurrency(product.purchase_price)}</p>}
                                        </div>
                                        <button type="button" className="btn-primary btn-sm flex-shrink-0 px-2"
                                            onClick={e => { e.stopPropagation(); product.stock_quantity > 0 && addItem(product); }}
                                            disabled={product.stock_quantity < 1}
                                        >
                                            <Plus size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Cart */}
                    <div className="xl:col-span-2">
                        <div className="section-card sticky top-0">
                            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <ShoppingCart size={17} />
                                Order Cart
                                {orderItems.length > 0 && (
                                    <span className="ml-auto bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">{orderItems.length}</span>
                                )}
                            </h2>

                            {orderItems.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No products added</p>
                                </div>
                            ) : (
                                <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                                    {orderItems.map(item => {
                                        const sp = parseFloat(item.selling_price) || 0;
                                        const qty = parseInt(item.quantity) || 0;
                                        const lineTotal = sp * qty;
                                        const lineProfit = (sp - item.product.purchase_price) * qty;
                                        return (
                                            <div key={item.product.id} className="bg-surface-800/50 rounded-xl p-3 border border-surface-700/50">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="text-sm font-medium text-white leading-tight truncate flex-1">{item.product.name}</p>
                                                    <button type="button" onClick={() => removeItem(item.product.id)} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] text-slate-500">Quantity</label>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <button type="button" onClick={() => {
                                                                if (qty <= 1) { removeItem(item.product.id); return; }
                                                                updateItem(item.product.id, 'quantity', qty - 1);
                                                            }} className="w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-600 transition-colors">
                                                                <Minus size={12} />
                                                            </button>
                                                            <input type="number" min="1" max={item.product.stock_quantity} value={item.quantity}
                                                                onChange={e => updateItem(item.product.id, 'quantity', parseInt(e.target.value) || 1)}
                                                                className="input py-1 px-2 text-center w-12 text-sm"
                                                            />
                                                            <button type="button" onClick={() => updateItem(item.product.id, 'quantity', qty + 1)}
                                                                disabled={qty >= item.product.stock_quantity}
                                                                className="w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-600 transition-colors disabled:opacity-30">
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-500">Selling Price (₹)</label>
                                                        <input type="number" min="0" step="0.01" value={item.selling_price}
                                                            onChange={e => updateItem(item.product.id, 'selling_price', e.target.value)}
                                                            className={`input py-1 px-2 text-sm mt-1 ${!isAdmin && item.selling_price && parseFloat(item.selling_price) < item.product.purchase_price ? 'border-red-500 text-red-500 font-bold animate-pulse' : ''}`}
                                                        />
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex justify-between mt-2 text-xs">
                                                        <span className="text-slate-500">Total: <span className="text-white font-medium">{formatCurrency(lineTotal)}</span></span>
                                                        <span className="text-emerald-400">Profit: {formatCurrency(lineProfit)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Notes */}
                            <div className="mt-3">
                                <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
                                <textarea className="input resize-none text-sm" rows={2} placeholder="Order notes..." value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>

                            {/* Totals */}
                            {orderItems.length > 0 && (
                                <div className="mt-4 p-4 bg-surface-800/60 rounded-xl border border-surface-700/50 space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-slate-400">Items</span><span className="font-medium text-white">{totals.items}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-400">Revenue</span><span className="font-semibold text-white">{formatCurrency(totals.amount)}</span></div>
                                    {isAdmin && (
                                        <>
                                            <div className="flex justify-between text-sm pt-2 border-t border-surface-700/50"><span className="text-slate-400">Profit</span><span className="font-bold text-emerald-400">{formatCurrency(totals.profit)}</span></div>
                                        </>
                                    )}
                                </div>
                            )}

                            <button type="submit" disabled={submitting || orderItems.length === 0 || !selectedShop} className="btn-primary w-full mt-4 py-3">
                                {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : 'Submit Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

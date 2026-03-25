import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, Package, X, Upload } from 'lucide-react';
import { productsApi, uploadImage } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatCurrency } from '../lib/format.js';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', category: '', purchase_price: '', default_selling_price: '', stock_quantity: '', image_url: '' };

function ProductModal({ product, onClose, onSaved, existingProducts = [] }) {
    const [form, setForm] = useState(product ? {
        name: product.name, description: product.description || '', category: product.category || '',
        purchase_price: product.purchase_price, default_selling_price: product.default_selling_price || '',
        stock_quantity: '', // Default empty for new batch
        image_url: product.image_url || '',
    } : EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(product?.image_url || null);
    const [uploading, setUploading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(product?.id || null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const fileInputRef = useRef(null);
    const suggestionRef = useRef(null);

    // Handle name change for autocomplete
    const handleNameChange = (e) => {
        const value = e.target.value;
        setForm(f => ({ ...f, name: value }));
        setSelectedProductId(null); // Reset if user types manually

        if (value.trim().length > 1 && !product) {
            const matches = existingProducts.filter(p => 
                p.name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
            setSuggestions(matches);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectProduct = (p) => {
        setForm({
            name: p.name,
            description: p.description || '',
            category: p.category || '',
            purchase_price: '', // Let user enter new batch price
            default_selling_price: p.default_selling_price || '',
            stock_quantity: '', // Let user enter new batch quantity
            image_url: p.image_url || '',
        });
        setImagePreview(p.image_url);
        setSelectedProductId(p.id);
        setSuggestions([]);
        setShowSuggestions(false);
        toast.success(`Selected existing product: ${p.name}`);
    };

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const url = await uploadImage(file);
            setForm(f => ({ ...f, image_url: url }));
            toast.success('Image uploaded');
        } catch (err) {
            toast.error(err.message || 'Upload failed');
            setImagePreview(null);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.purchase_price || !form.stock_quantity) {
            toast.error('Name, quantity and purchase price are required'); return;
        }
        setSaving(true);
        try {
            const data = {
                ...form,
                purchase_price: +form.purchase_price,
                default_selling_price: form.default_selling_price !== '' ? +form.default_selling_price : null,
                stock_quantity: +form.stock_quantity || 0,
                quantity: +form.stock_quantity || 0, // for addStock endpoint
            };

            if (selectedProductId && !product) {
                // Add stock to existing
                await productsApi.addStock(selectedProductId, {
                    quantity: data.stock_quantity,
                    purchase_price: data.purchase_price
                });
                toast.success('Stock added to existing product');
            } else if (product) {
                // Edit existing product details (not batch addition)
                await productsApi.update(product.id, data);
                toast.success('Product details updated');
            } else {
                // Create brand new product
                await productsApi.create(data);
                toast.success('New product created');
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const profit = form.default_selling_price && form.purchase_price
        ? ((+form.default_selling_price - +form.purchase_price) / +form.purchase_price * 100).toFixed(1)
        : null;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-lg">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">
                        {product ? 'Edit Product Details' : selectedProductId ? 'Add Stock to Existing' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 relative">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Name *</label>
                            <input 
                                name="name" 
                                className="input" 
                                value={form.name} 
                                onChange={handleNameChange} 
                                placeholder="e.g. Premium Laptop" 
                                required 
                                autoComplete="off"
                                disabled={!!product}
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div ref={suggestionRef} className="absolute z-50 left-0 right-0 mt-1 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl overflow-hidden animate-slide-up">
                                    {suggestions.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => selectProduct(p)}
                                            className="w-full px-4 py-3 text-left hover:bg-surface-700 flex items-center gap-3 transition-colors border-b border-surface-700/50 last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded bg-surface-600 flex items-center justify-center flex-shrink-0">
                                                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded" /> : <Package size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{p.name}</p>
                                                <p className="text-[10px] text-slate-500">{p.category || 'No category'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                            <input name="category" className="input" value={form.category} onChange={handleChange} placeholder="Electronics" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                {selectedProductId || product ? 'Add Stock Balance' : 'Initial Stock Quantity'} *
                            </label>
                            <input name="stock_quantity" type="number" min="1" className="input" value={form.stock_quantity} onChange={handleChange} placeholder="0" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Purchase Price (₹) *</label>
                            <input name="purchase_price" type="number" min="0" step="0.01" className="input" value={form.purchase_price} onChange={handleChange} placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                Default Selling Price (₹)
                                {profit && <span className="ml-2 text-emerald-400">({profit}% margin)</span>}
                            </label>
                            <input name="default_selling_price" type="number" min="0" step="0.01" className="input" value={form.default_selling_price} onChange={handleChange} placeholder="0.00" />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                            <textarea name="description" className="input resize-none text-sm" rows={2} value={form.description} onChange={handleChange} placeholder="Product description..." />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Image</label>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            {imagePreview ? (
                                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-surface-800 border border-surface-700">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 size={18} className="animate-spin text-white" />
                                        </div>
                                    )}
                                    {!uploading && (
                                        <button
                                            type="button"
                                            onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image_url: '' })); }}
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-surface-600 rounded-xl text-slate-500 hover:border-primary-500 hover:text-primary-400 transition-colors"
                                >
                                    <Upload size={18} />
                                    <span className="text-[10px]">Click to upload product image</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary flex-1">
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (selectedProductId || product ? 'Save Stock / Update' : 'Create Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BulkEntryModal({ onClose, onSaved }) {
    const [rows, setRows] = useState([
        { id: 1, name: '', category: '', purchase_price: '', default_selling_price: '', stock_quantity: '' },
        { id: 2, name: '', category: '', purchase_price: '', default_selling_price: '', stock_quantity: '' },
        { id: 3, name: '', category: '', purchase_price: '', default_selling_price: '', stock_quantity: '' },
    ]);
    const [saving, setSaving] = useState(false);

    const addRow = () => {
        setRows([...rows, { 
            id: Date.now(), 
            name: '', 
            category: rows.length > 0 ? rows[rows.length-1].category : '', 
            purchase_price: '', 
            default_selling_price: '', 
            stock_quantity: '' 
        }]);
    };

    const removeRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const handleChange = (id, field, value) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validRows = rows.filter(r => r.name.trim() !== '');
        if (validRows.length === 0) {
            toast.error('Please add at least one product name');
            return;
        }

        // Validate all valid rows
        for (const r of validRows) {
            if (!r.purchase_price || !r.stock_quantity) {
                toast.error(`Please complete row for ${r.name}`);
                return;
            }
        }

        setSaving(true);
        let successCount = 0;
        let failCount = 0;

        for (const r of validRows) {
            try {
                const data = {
                    name: r.name,
                    category: r.category,
                    purchase_price: +r.purchase_price,
                    default_selling_price: r.default_selling_price !== '' ? +r.default_selling_price : null,
                    stock_quantity: +r.stock_quantity,
                };
                await productsApi.create(data);
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`Failed to add ${r.name}:`, err);
            }
        }

        if (successCount > 0) toast.success(`Successfully added ${successCount} products`);
        if (failCount > 0) toast.error(`Failed to add ${failCount} products`);

        if (successCount > 0) {
            onSaved();
            onClose();
        }
        setSaving(false);
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
            <div className="modal-box max-w-4xl max-h-[90vh] flex flex-col p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Bulk Product Entry
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">Enter multiple products manually. Only rows with names will be saved.</p>
                    </div>
                    <button onClick={onClose} disabled={saving} className="btn-icon"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-thin">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="sticky top-0 bg-surface-900 z-10">
                            <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-surface-700">
                                <th className="pb-4 px-2 font-bold">Product Name *</th>
                                <th className="pb-4 px-2 font-bold">Category</th>
                                <th className="pb-4 px-2 font-bold w-24">Stock *</th>
                                <th className="pb-4 px-2 font-bold w-32">Buy Price (₹) *</th>
                                <th className="pb-4 px-2 font-bold w-32">Sell Price (₹)</th>
                                <th className="pb-4 px-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-800">
                            {rows.map((row) => (
                                <tr key={row.id} className="group hover:bg-surface-800/20 transition-colors">
                                    <td className="py-3 px-1">
                                        <input
                                            className="bg-surface-800/50 border border-surface-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary-500 w-full placeholder:text-slate-700 outline-none"
                                            placeholder="e.g. Item A"
                                            value={row.name}
                                            onChange={(e) => handleChange(row.id, 'name', e.target.value)}
                                        />
                                    </td>
                                    <td className="py-3 px-1">
                                        <input
                                            className="bg-surface-800/50 border border-surface-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary-500 w-full placeholder:text-slate-700 outline-none"
                                            placeholder="Gadgets"
                                            value={row.category}
                                            onChange={(e) => handleChange(row.id, 'category', e.target.value)}
                                        />
                                    </td>
                                    <td className="py-3 px-1">
                                        <input
                                            type="number"
                                            className="bg-surface-800/50 border border-surface-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary-500 w-full placeholder:text-slate-700 outline-none"
                                            placeholder="0"
                                            value={row.stock_quantity}
                                            onChange={(e) => handleChange(row.id, 'stock_quantity', e.target.value)}
                                        />
                                    </td>
                                    <td className="py-3 px-1">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="bg-surface-800/50 border border-surface-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary-500 w-full placeholder:text-slate-700 outline-none"
                                            placeholder="0.00"
                                            value={row.purchase_price}
                                            onChange={(e) => handleChange(row.id, 'purchase_price', e.target.value)}
                                        />
                                    </td>
                                    <td className="py-3 px-1">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="bg-surface-800/50 border border-surface-700/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary-500 w-full placeholder:text-slate-700 outline-none"
                                            placeholder="0.00"
                                            value={row.default_selling_price}
                                            onChange={(e) => handleChange(row.id, 'default_selling_price', e.target.value)}
                                        />
                                    </td>
                                    <td className="py-3 px-1 text-right">
                                        <button 
                                            onClick={() => removeRow(row.id)}
                                            className="text-slate-600 hover:text-red-400 p-2 transition-colors disabled:opacity-0"
                                            title="Remove Row"
                                            disabled={rows.length === 1}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <button 
                        onClick={addRow}
                        className="mt-6 flex items-center gap-2 text-primary-500 hover:text-primary-400 text-sm font-bold bg-primary-500/5 px-4 py-3 rounded-xl border border-dashed border-primary-500/20 hover:border-primary-500/40 transition-all w-full justify-center group"
                    >
                        <Plus size={18} className="group-hover:scale-125 transition-transform" /> 
                        Click to add another item row
                    </button>
                </div>

                <div className="flex gap-4 pt-6 border-t border-surface-700/50">
                    <button onClick={onClose} disabled={saving} className="btn-secondary h-12 flex-1">Discard Changes</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={saving} 
                        className="btn-primary h-12 flex-2 bg-gradient-to-r from-primary-600 to-primary-500"
                    >
                        {saving ? <><Loader2 size={18} className="animate-spin" /> Batch creating products...</> : `Confirm & Create All Products`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    const { user, activeRole } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // null | 'create' | 'bulk' | product object
    const [deleting, setDeleting] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await productsApi.list({ search, limit: 50 });
            setProducts(data.products || []);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleDelete = async (product) => {
        if (!confirm(`Delete "${product.name}"?`)) return;
        setDeleting(product.id);
        try {
            await productsApi.delete(product.id);
            toast.success('Product deleted');
            fetchProducts();
        } catch (err) { toast.error(err.message); }
        finally { setDeleting(null); }
    };

    const isAdmin = activeRole === 'admin';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="text-slate-400 text-sm mt-1">{products.length} products in inventory</p>
                </div>
                {isAdmin && (
                    <div className="flex gap-3">
                        <button onClick={() => setModal('bulk')} className="btn-secondary hidden sm:flex items-center gap-2">
                            <Plus size={16} /> Bulk Add
                        </button>
                        <button onClick={() => setModal('create')} className="btn-primary">
                            <Plus size={16} /> Add Product
                        </button>
                    </div>
                )}
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    className="input pl-9"
                    placeholder="Search products..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-primary-500" /></div>
            ) : products.length === 0 ? (
                <div className="section-card text-center py-16">
                    <Package size={48} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 font-medium">No products found</p>
                    {isAdmin && <button onClick={() => setModal('create')} className="btn-primary mt-4">Add First Product</button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.map(product => {
                        const showPricing = isAdmin;
                        const margin = showPricing && product.purchase_price && product.default_selling_price
                            ? ((product.default_selling_price - product.purchase_price) / product.purchase_price * 100).toFixed(1)
                            : null;
                        return (
                            <div key={product.id} className="glass-card p-5 hover:scale-[1.01] transition-all duration-200 group">
                                <div className="flex items-start gap-3">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-xl object-cover bg-surface-700 flex-shrink-0" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-surface-700/50 flex items-center justify-center flex-shrink-0">
                                            <Package size={22} className="text-slate-500" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white text-sm truncate">{product.name}</h3>
                                        {product.category && <span className="text-[10px] text-slate-500 bg-surface-700/50 px-1.5 py-0.5 rounded-md">{product.category}</span>}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setModal(product)} className="btn-icon btn-sm"><Edit2 size={13} /></button>
                                            <button onClick={() => handleDelete(product)} disabled={deleting === product.id} className="btn-icon btn-sm text-red-400 hover:text-white hover:bg-red-600">
                                                {deleting === product.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {product.description && (
                                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">{product.description}</p>
                                )}

                                {showPricing && (
                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-500">Purchase</p>
                                            <p className="text-sm font-semibold text-white">{formatCurrency(product.purchase_price)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-500">Selling</p>
                                            <p className="text-sm font-semibold text-primary-400">
                                                {product.default_selling_price ? formatCurrency(product.default_selling_price) : '—'}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-500">Margin</p>
                                            <p className="text-sm font-semibold text-emerald-400">{margin ? `${margin}%` : '—'}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-surface-700/50 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Stock</span>
                                    <span className={`text-sm font-bold ${product.stock_quantity < 10 ? 'text-red-400' : 'text-white'}`}>
                                        {product.stock_quantity} units
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modal && (modal !== 'bulk') && (
                <ProductModal
                    product={modal === 'create' ? null : modal}
                    existingProducts={products}
                    onClose={() => setModal(null)}
                    onSaved={fetchProducts}
                />
            )}

            {modal === 'bulk' && (
                <BulkEntryModal
                    onClose={() => setModal(null)}
                    onSaved={fetchProducts}
                />
            )}
        </div>
    );
}

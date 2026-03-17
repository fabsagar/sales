import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, Package, X, Upload } from 'lucide-react';
import { productsApi, uploadImage } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatCurrency } from '../lib/format.js';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', category: '', purchase_price: '', default_selling_price: '', stock_quantity: '', image_url: '' };

function ProductModal({ product, onClose, onSaved }) {
    const [form, setForm] = useState(product ? {
        name: product.name, description: product.description || '', category: product.category || '',
        purchase_price: product.purchase_price, default_selling_price: product.default_selling_price || '',
        stock_quantity: product.stock_quantity, image_url: product.image_url || '',
    } : EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(product?.image_url || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB');
            return;
        }
        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);

        // Upload to R2
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
        if (!form.name || !form.purchase_price) {
            toast.error('Product name and purchase price are required'); return;
        }
        setSaving(true);
        try {
            const data = {
                ...form,
                purchase_price: +form.purchase_price,
                default_selling_price: form.default_selling_price !== '' ? +form.default_selling_price : null,
                stock_quantity: +form.stock_quantity || 0,
                category: form.category || '',
            };
            if (product) {
                await productsApi.update(product.id, data);
                toast.success('Product updated');
            } else {
                await productsApi.create(data);
                toast.success('Product created');
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

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">{product ? 'Edit Product' : 'Add Product'}</h2>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Name *</label>
                            <input name="name" className="input" value={form.name} onChange={handleChange} placeholder="e.g. Premium Laptop" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                            <input name="category" className="input" value={form.category} onChange={handleChange} placeholder="Electronics (optional)" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Stock Quantity</label>
                            <input name="stock_quantity" type="number" min="0" className="input" value={form.stock_quantity} onChange={handleChange} placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Purchase Price (₹) *</label>
                            <input name="purchase_price" type="number" min="0" step="0.01" className="input" value={form.purchase_price} onChange={handleChange} placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                Selling Price (₹)
                                {profit && <span className="ml-2 text-emerald-400">({profit}% margin)</span>}
                            </label>
                            <input name="default_selling_price" type="number" min="0" step="0.01" className="input" value={form.default_selling_price} onChange={handleChange} placeholder="0.00 (optional)" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                            <textarea name="description" className="input resize-none" rows={2} value={form.description} onChange={handleChange} placeholder="Product description..." />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Image</label>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            {imagePreview ? (
                                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-surface-800 border border-surface-700">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 size={24} className="animate-spin text-white" />
                                        </div>
                                    )}
                                    {!uploading && (
                                        <button
                                            type="button"
                                            onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image_url: '' })); }}
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-surface-600 rounded-xl text-slate-500 hover:border-primary-500 hover:text-primary-400 transition-colors"
                                >
                                    <Upload size={22} />
                                    <span className="text-xs">Click to upload image (max 2MB)</span>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary flex-1">
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (product ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    const { user, activeRole } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // null | 'create' | product object
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
                    <button onClick={() => setModal('create')} className="btn-primary">
                        <Plus size={16} /> Add Product
                    </button>
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

            {modal && (
                <ProductModal
                    product={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={fetchProducts}
                />
            )}
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Loader2, Building2, Search, X } from 'lucide-react';
import { retailersApi } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatDate } from '../lib/format.js';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' };

function RetailerModal({ retailer, onClose, onSaved }) {
    const [form, setForm] = useState(retailer ? {
        name: retailer.name, email: retailer.email || '',
        phone: retailer.phone || '', address: retailer.address || '',
    } : EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name) { toast.error('Name is required'); return; }
        setSaving(true);
        try {
            if (retailer) {
                await retailersApi.update(retailer.id, form);
                toast.success('Retailer updated');
            } else {
                await retailersApi.create(form);
                toast.success('Retailer added');
            }
            onSaved();
            onClose();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">{retailer ? 'Edit Retailer' : 'Add Retailer'}</h2>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Retailer Name *</label>
                        <input className="input" placeholder="Business name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                        <input type="email" className="input" placeholder="contact@retailer.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
                        <input className="input" placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Address</label>
                        <textarea className="input resize-none" rows={2} placeholder="Full address..." value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary flex-1">
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (retailer ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function RetailersPage() {
    const { user } = useAuth();
    const [retailers, setRetailers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const isAdmin = user.role === 'admin';

    const fetchRetailers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await retailersApi.list({ search });
            setRetailers(data.retailers || []);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchRetailers(); }, [fetchRetailers]);

    const handleDelete = async (retailer) => {
        if (!confirm(`Delete retailer "${retailer.name}"?`)) return;
        setDeleting(retailer.id);
        try {
            await retailersApi.delete(retailer.id);
            toast.success('Retailer deleted');
            fetchRetailers();
        } catch (err) { toast.error(err.message); }
        finally { setDeleting(null); }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Retailers</h1>
                    <p className="text-slate-400 text-sm mt-1">{retailers.length} registered retailers</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setModal('create')} className="btn-primary">
                        <Plus size={16} /> Add Retailer
                    </button>
                )}
            </div>

            <div className="relative mb-6 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className="input pl-9" placeholder="Search retailers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-primary-500" /></div>
            ) : retailers.length === 0 ? (
                <div className="section-card text-center py-16">
                    <Building2 size={48} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 font-medium">No retailers found</p>
                    {isAdmin && <button onClick={() => setModal('create')} className="btn-primary mt-4">Add First Retailer</button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {retailers.map(retailer => (
                        <div key={retailer.id} className="glass-card p-5 hover:scale-[1.01] transition-all duration-200 group">
                            <div className="flex items-start justify-between gap-3">
                                <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Building2 size={18} className="text-emerald-400" />
                                </div>
                                {isAdmin && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setModal(retailer)} className="btn-icon btn-sm"><Edit2 size={13} /></button>
                                        <button onClick={() => handleDelete(retailer)} disabled={deleting === retailer.id} className="btn-icon btn-sm text-red-400 hover:text-white hover:bg-red-600">
                                            {deleting === retailer.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="mt-3">
                                <h3 className="font-bold text-white">{retailer.name}</h3>
                                {retailer.email && <p className="text-sm text-slate-400 mt-1">📧 {retailer.email}</p>}
                                {retailer.phone && <p className="text-sm text-slate-400">📱 {retailer.phone}</p>}
                                {retailer.address && <p className="text-xs text-slate-500 mt-2 line-clamp-2">📍 {retailer.address}</p>}
                                <p className="text-xs text-slate-600 mt-3">Added {formatDate(retailer.created_at)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <RetailerModal
                    retailer={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={fetchRetailers}
                />
            )}
        </div>
    );
}

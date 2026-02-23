import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Loader2, Users, X, Shield, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatDate } from '../lib/format.js';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
    admin: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    salesperson: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    retailer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

function UserModal({ user, onClose, onSaved }) {
    const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '', role: user?.role || 'salesperson' });
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
        if (!user && !form.password) { toast.error('Password is required for new users'); return; }
        setSaving(true);
        try {
            const payload = { name: form.name, email: form.email, role: form.role };
            if (!user) payload.password = form.password;
            await api.post('/register', payload);
            toast.success(`User ${user ? 'updated' : 'created'}`);
            onSaved();
            onClose();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">{user ? 'Edit User' : 'Add User'}</h2>
                    <button onClick={onClose} className="btn-icon"><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name *</label>
                        <input className="input" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Email *</label>
                        <input type="email" className="input" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Role *</label>
                        <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="salesperson">Salesperson</option>
                            <option value="admin">Admin</option>
                            <option value="retailer">Retailer</option>
                        </select>
                    </div>
                    {!user && (
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password *</label>
                            <div className="relative">
                                <input type={showPw ? 'text' : 'password'} className="input pr-11" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary flex-1">
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);

    // Admin can view users by fetching from the summary endpoints indirectly
    // For a full user list we'd add a GET /api/users endpoint. Using register-only approach now.
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            // We'll use a basic implementation — in production add GET /api/users endpoint
            const data = await api.get('/users').catch(() => ({ users: [] }));
            setUsers(data.users || []);
        } catch { setUsers([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex items-center gap-3"><Users size={24} /> Users</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage system access</p>
                </div>
                <button onClick={() => setModal('create')} className="btn-primary">
                    <Plus size={16} /> Add User
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-primary-500" /></div>
            ) : (
                <div className="section-card">
                    <div className="flex items-center gap-3 p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                        <Shield size={18} className="text-amber-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-amber-300">User Management</p>
                            <p className="text-xs text-amber-400/80 mt-0.5">
                                Use the "Add User" button to create new salesperson, admin, or retailer accounts.
                                For a full user list, add a <code className="bg-surface-700 px-1 rounded">GET /api/users</code> endpoint to the Worker.
                            </p>
                        </div>
                    </div>
                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={40} className="mx-auto mb-3 text-slate-600" />
                            <p className="text-slate-400">No users loaded</p>
                            <p className="text-slate-500 text-sm mt-1">Add users via the button above.</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th></tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="font-medium text-white">{u.name}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`badge capitalize ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
                                            <td><span className={`badge ${u.is_active ? 'badge-approved' : 'badge-rejected'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td className="text-slate-500">{formatDate(u.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {modal && (
                <UserModal
                    user={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={fetchUsers}
                />
            )}
        </div>
    );
}

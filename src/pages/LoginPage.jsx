import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();
        if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const demoAccounts = [
        { role: 'Admin', email: 'admin@sales.com', password: 'password' },
        { role: 'Salesperson', email: 'john@sales.com', password: 'password' },
    ];

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-2xl shadow-primary-900/50 mb-4">
                        <BarChart3 size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">SalesPro</h1>
                    <p className="text-slate-400 mt-2">Sales Management System</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                            <input
                                type="email" required autoComplete="email"
                                className="input"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                                    className="input pr-11"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-6 pt-6 border-t border-surface-700/50">
                        <p className="text-xs text-slate-500 text-center mb-3">Demo accounts (password: <code className="text-primary-400">password</code>)</p>
                        <div className="grid grid-cols-2 gap-2">
                            {demoAccounts.map(acc => (
                                <button key={acc.role} onClick={() => setForm({ email: acc.email, password: acc.password })}
                                    className="p-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-surface-600 text-left transition-all hover:scale-[1.02]">
                                    <p className="text-xs font-semibold text-primary-400">{acc.role}</p>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{acc.email}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

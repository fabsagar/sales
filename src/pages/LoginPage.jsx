import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const user = await login(credentialResponse.credential);
            toast.success(`Welcome back, ${user.name}!`);
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Login failed. You may not be authorized.');
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-3xl font-bold text-white">{import.meta.env.VITE_APP_NAME || 'SalesFirst'}</h1>
                    <p className="text-slate-400 mt-2">Sales Management System</p>
                </div>

                {/* Card */}
                <div className="glass-card p-10 flex flex-col items-center">
                    <h2 className="text-xl font-semibold text-white mb-8">Secure Corporate Login</h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-4">
                            <Loader2 size={32} className="text-primary-500 animate-spin" />
                            <p className="text-slate-400">Verifying identity...</p>
                        </div>
                    ) : (
                        <div className="w-full flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error('Google Sign-In Failed')}
                                useOneTap
                                theme="filled_black"
                                shape="pill"
                                size="large"
                            />
                        </div>
                    )}

                    <p className="text-xs text-slate-500 mt-8 text-center px-4">
                        Access is restricted to authorized company email addresses only.
                    </p>
                </div>
            </div>
        </div>
    );
}

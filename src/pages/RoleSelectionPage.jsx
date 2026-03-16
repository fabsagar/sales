import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShoppingBag, BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function RoleSelectionPage() {
    const { user, selectRole } = useAuth();
    const navigate = useNavigate();

    const roles = [
        {
            id: 'admin',
            title: 'Administrator',
            description: 'Full access to reports, inventory, and users management.',
            icon: ShieldCheck,
            color: 'from-violet-500 to-purple-600',
            shadow: 'shadow-purple-900/40'
        },
        {
            id: 'salesperson',
            title: 'Sales Executive',
            description: 'Access to products, gallery, and order placement.',
            icon: ShoppingBag,
            color: 'from-blue-500 to-indigo-600',
            shadow: 'shadow-blue-900/40'
        }
    ];

    const handleSelect = (roleId) => {
        selectRole(roleId);
        toast.success(`Switching to ${roleId === 'admin' ? 'Admin' : 'Sales'} view`);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-4xl relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-2xl shadow-primary-900/50 mb-6">
                        <BarChart3 size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Choose Your Experience</h1>
                    <p className="text-slate-400 text-lg max-w-lg mx-auto">
                        Welcome, <span className="text-white font-semibold">{user?.name}</span>. Please select the workspace you want to access today.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {roles.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className="group relative text-left"
                        >
                            <div className={`absolute -inset-0.5 bg-gradient-to-br ${item.color} rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-500`} />
                            
                            <div className="relative glass-card p-8 h-full flex flex-col items-start border border-surface-700/50 hover:border-surface-600 transition-all duration-300">
                                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon size={28} />
                                </div>
                                
                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors">
                                    {item.title}
                                </h3>
                                
                                <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                                    {item.description}
                                </p>
                                
                                <div className="flex items-center gap-2 text-primary-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                    Enter Workspace <ArrowRight size={18} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-slate-500 hover:text-white transition-colors text-sm underline underline-offset-4"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}

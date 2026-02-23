import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { notificationsApi } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
    info: { dot: 'bg-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    success: { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    warning: { dot: 'bg-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    error: { dot: 'bg-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchNotifications = async () => {
        try {
            const data = await notificationsApi.list({ limit: 50 });
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const handleMarkRead = async (id) => {
        try {
            await notificationsApi.markRead(id);
            setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch (err) { toast.error(err.message); }
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await notificationsApi.markAllRead();
            setNotifications(ns => ns.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (err) { toast.error(err.message); }
        finally { setMarkingAll(false); }
    };

    return (
        <div className="animate-fade-in max-w-3xl">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <Bell size={24} />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                        )}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">{notifications.length} total notifications</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} disabled={markingAll} className="btn-secondary">
                        {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                        Mark all read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="spinner w-8 h-8 border-primary-500" /></div>
            ) : notifications.length === 0 ? (
                <div className="section-card text-center py-16">
                    <Bell size={48} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 font-medium">No notifications yet</p>
                    <p className="text-slate-500 text-sm mt-1">You'll see order updates and alerts here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(notif => {
                        const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
                        return (
                            <div key={notif.id}
                                className={`glass-card p-4 transition-all duration-200 ${!notif.is_read ? 'border-primary-500/30' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.is_read ? 'bg-surface-600' : style.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className={`text-sm font-semibold ${notif.is_read ? 'text-slate-400' : 'text-white'}`}>{notif.title}</p>
                                            {!notif.is_read && (
                                                <button onClick={() => handleMarkRead(notif.id)} className="btn-icon btn-sm flex-shrink-0" title="Mark as read">
                                                    <Check size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <p className={`text-sm mt-0.5 ${notif.is_read ? 'text-slate-500' : 'text-slate-300'}`}>{notif.message}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-xs text-slate-500">{formatDateTime(notif.created_at)}</span>
                                            {notif.related_order_id && (
                                                <a href={`/orders/${notif.related_order_id}`} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                                                    View Order #{notif.related_order_id} →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

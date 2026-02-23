import { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
    AreaChart, Area,
} from 'recharts';
import { TrendingUp, Download, Loader2 } from 'lucide-react';
import { reportsApi, ordersApi } from '../lib/api.js';
import { formatCurrency, formatNumber } from '../lib/format.js';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface-800 border border-surface-600 rounded-xl p-3 shadow-xl">
            <p className="text-xs text-slate-400 mb-2">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-400">{p.name}:</span>
                    <span className="font-semibold text-white">
                        {p.name === 'Orders' ? formatNumber(p.value) : formatCurrency(p.value)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ChartCard({ title, children, loading }) {
    return (
        <div className="section-card">
            <h3 className="font-semibold text-white mb-4">{title}</h3>
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="spinner w-7 h-7 border-primary-500" />
                </div>
            ) : children}
        </div>
    );
}

export default function ReportsPage() {
    const [daily, setDaily] = useState([]);
    const [monthly, setMonthly] = useState([]);
    const [yearly, setYearly] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [bySalesperson, setBySalesperson] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        Promise.all([
            reportsApi.daily({ days: 30 }),
            reportsApi.monthly({ months: 12 }),
            reportsApi.yearly(),
            reportsApi.topProducts({ limit: 8 }),
            reportsApi.bySalesperson(),
        ]).then(([d, m, y, tp, sp]) => {
            setDaily(d.data.map(r => ({ ...r, profit: parseFloat(r.profit) || 0, revenue: parseFloat(r.revenue) || 0, order_count: parseInt(r.order_count) || 0 })));
            setMonthly(m.data.map(r => ({ ...r, profit: parseFloat(r.profit) || 0, revenue: parseFloat(r.revenue) || 0, order_count: parseInt(r.order_count) || 0 })));
            setYearly(y.data.map(r => ({ ...r, profit: parseFloat(r.profit) || 0, revenue: parseFloat(r.revenue) || 0 })));
            setTopProducts(tp.data.slice(0, 8).map(r => ({ ...r, total_profit: parseFloat(r.total_profit) || 0, total_revenue: parseFloat(r.total_revenue) || 0 })));
            setBySalesperson(sp.data.map(r => ({ ...r, total_profit: parseFloat(r.total_profit) || 0, total_revenue: parseFloat(r.total_revenue) || 0 })));
        }).catch(err => toast.error(err.message))
            .finally(() => setLoading(false));
    }, []);

    const totalProfit = monthly.reduce((s, r) => s + r.profit, 0);
    const totalRevenue = monthly.reduce((s, r) => s + r.revenue, 0);

    const handleExport = async () => {
        setExporting(true);
        try { await ordersApi.export(); toast.success('CSV downloaded'); }
        catch (err) { toast.error(err.message); }
        finally { setExporting(false); }
    };

    const axisProps = {
        tick: { fontSize: 11, fill: '#64748b' },
        tickLine: false,
        axisLine: false,
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="text-slate-400 text-sm mt-1">Comprehensive sales performance insights</p>
                </div>
                <button onClick={handleExport} disabled={exporting} className="btn-secondary">
                    {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export CSV
                </button>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Revenue (12mo)', value: formatCurrency(totalRevenue), color: 'text-primary-400' },
                    { label: 'Total Profit (12mo)', value: formatCurrency(totalProfit), color: 'text-emerald-400' },
                    { label: 'Profit Margin', value: totalRevenue > 0 ? `${(totalProfit / totalRevenue * 100).toFixed(1)}%` : '–', color: 'text-amber-400' },
                    { label: 'Active Salespersons', value: bySalesperson.length, color: 'text-blue-400' },
                ].map(s => (
                    <div key={s.label} className="section-card">
                        <p className="text-xs text-slate-500">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Daily Profit - Area Chart */}
                <ChartCard title="📅 Daily Profit (Last 30 Days)" loading={loading}>
                    {daily.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">No data — approve some orders first</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={daily}>
                                <defs>
                                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" {...axisProps} />
                                <YAxis {...axisProps} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="profit" stroke="#6366f1" fill="url(#profitGrad)" strokeWidth={2} name="Profit" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Monthly Profit - Bar Chart */}
                <ChartCard title="📆 Monthly Revenue vs Profit" loading={loading}>
                    {monthly.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">No data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={monthly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="month" {...axisProps} />
                                <YAxis {...axisProps} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Yearly - Line Chart */}
                <ChartCard title="📈 Yearly Profit Trend" loading={loading}>
                    {yearly.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">No data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={yearly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="year" {...axisProps} />
                                <YAxis {...axisProps} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} name="Profit" />
                                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} name="Revenue" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Top Products - Pie Chart */}
                <ChartCard title="🏆 Top Products by Profit" loading={loading}>
                    {topProducts.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">No data available</p>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={topProducts} dataKey="total_profit" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                                        {topProducts.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => formatCurrency(val)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-1.5 min-w-0 sm:max-w-[160px]">
                                {topProducts.slice(0, 6).map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-2 text-xs">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                        <span className="text-slate-400 truncate">{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ChartCard>

                {/* Sales by Salesperson - Horizontal Bar */}
                <ChartCard title="👥 Sales by Salesperson" loading={loading}>
                    {bySalesperson.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">No data available</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={bySalesperson} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis type="number" {...axisProps} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" {...axisProps} width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total_revenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="total_profit" name="Profit" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Top Products Table */}
                <ChartCard title="📊 Top Products Detail" loading={loading}>
                    {topProducts.length === 0 ? (
                        <p className="text-center text-slate-500 py-10">No data available</p>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th className="text-right">Units Sold</th>
                                        <th className="text-right">Revenue</th>
                                        <th className="text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((p, i) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                                    <span className="font-medium text-white">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-right">{formatNumber(p.total_quantity)}</td>
                                            <td className="text-right text-primary-400">{formatCurrency(p.total_revenue)}</td>
                                            <td className="text-right text-emerald-400 font-semibold">{formatCurrency(p.total_profit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ChartCard>

            </div>
        </div>
    );
}

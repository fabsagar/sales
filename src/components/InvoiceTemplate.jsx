import React, { forwardRef } from 'react';
import { formatCurrency, formatDateTime, formatDate } from '../lib/format.js';

const InvoiceTemplate = forwardRef(function InvoiceTemplate({ order, items }, ref) {
    if (!order) return null;

    const subtotal = items.reduce((sum, i) => sum + i.selling_price * i.quantity, 0);
    const totalProfit = items.reduce((sum, i) => sum + (i.selling_price - i.purchase_price) * i.quantity, 0);

    return (
        <div ref={ref} className="print-page bg-white text-gray-900 p-8 max-w-3xl mx-auto" style={{ fontFamily: 'Arial, sans-serif', minHeight: '297mm' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #6366f1' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#6366f1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1', margin: 0 }}>SalesPro</h1>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Sales Management System</p>
                    <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>support@salespro.app</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>INVOICE</div>
                    <div style={{ fontSize: '14px', color: '#6366f1', fontWeight: '600', marginTop: '4px' }}>#{String(order.id).padStart(5, '0')}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>Date: {formatDate(order.created_at)}</div>
                    <div style={{ marginTop: '6px' }}>
                        <span style={{
                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            background: order.status === 'approved' ? '#d1fae5' : order.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                            color: order.status === 'approved' ? '#065f46' : order.status === 'rejected' ? '#991b1b' : '#92400e',
                        }}>
                            {order.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bill To / From */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Bill To</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>{order.retailer_name}</p>
                    {order.retailer_email && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{order.retailer_email}</p>}
                    {order.retailer_phone && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{order.retailer_phone}</p>}
                    {order.retailer_address && <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{order.retailer_address}</p>}
                </div>
                <div style={{ background: '#f0f0ff', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Salesperson</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>{order.salesperson_name}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>Order Date: {formatDate(order.created_at)}</p>
                    {order.notes && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' }}>"{order.notes}"</p>}
                </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#6366f1', color: 'white' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>Product</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Category</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={item.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                            <td style={{ padding: '10px 12px', fontWeight: '600', color: '#111827' }}>{item.product_name}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6b7280' }}>{item.category || '—'}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{item.quantity}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{formatCurrency(item.selling_price)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{formatCurrency(item.selling_price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                <div style={{ minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>
                        <span>Subtotal</span><span style={{ fontWeight: '600', color: '#111827' }}>{formatCurrency(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', background: '#f0f0ff', marginTop: '8px', borderRadius: '6px', paddingLeft: '12px', paddingRight: '12px' }}>
                        <span style={{ fontWeight: '800', fontSize: '15px', color: '#311782' }}>TOTAL</span>
                        <span style={{ fontWeight: '800', fontSize: '15px', color: '#4338ca' }}>{formatCurrency(subtotal)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Thank you for your business!</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>Generated by SalesPro · {formatDateTime(new Date().toISOString())}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#9ca3af' }}>
                    <p style={{ margin: 0 }}>This is a computer-generated invoice.</p>
                    <p style={{ margin: '2px 0 0' }}>No signature required.</p>
                </div>
            </div>
        </div>
    );
});

export default InvoiceTemplate;

import React, { forwardRef } from 'react';
import { formatCurrency, formatDateTime, formatDate } from '../lib/format.js';

const InvoiceTemplate = forwardRef(function InvoiceTemplate({ order, items }, ref) {
    if (!order) return null;

    const subtotal = items.reduce((sum, i) => sum + i.selling_price * i.quantity, 0);
    
    // Shop details from environment variables
    const shopName = import.meta.env.VITE_SHOP_NAME || 'Your Shop Name';
    const accountNo = import.meta.env.VITE_SHOP_ACCOUNT_NO || 'XXXXXXXXXXXX';
    const ifsc = import.meta.env.VITE_SHOP_IFSC || 'XXXX0000000';

    return (
        <div ref={ref} className="print-page bg-white text-gray-900 p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif', minHeight: '297mm' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>{shopName}</div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>Account No: {accountNo}</div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>IFSC: {ifsc}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <img 
                        src="/qr-code.jpeg" 
                        alt="QR Code" 
                        style={{ width: '80px', height: '80px', marginBottom: '12px', objectFit: 'contain' }} 
                    />
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>Invoice #{String(order.id).padStart(5, '0')}</div>
                    <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>Date: {formatDate(order.created_at)}</div>
                </div>
            </div>

            {/* Bill To */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', maxWidth: '300px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Bill To</p>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>{order.retailer_name}</p>
                    {order.retailer_email && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{order.retailer_email}</p>}
                    {order.retailer_phone && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0' }}>{order.retailer_phone}</p>}
                    {order.retailer_address && <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{order.retailer_address}</p>}
                </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#111827', color: 'white' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>Product</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 12px', color: '#111827' }}>{item.product_name}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{item.quantity}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{formatCurrency(item.selling_price)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>{formatCurrency(item.selling_price * item.quantity)}</td>
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
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, textAlign: 'center' }}>Thank you for your business!</p>
            </div>
        </div>
    );
});

export default InvoiceTemplate;

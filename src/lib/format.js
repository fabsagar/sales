// Format utilities
export function formatCurrency(value, currency = 'INR') {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(num);
}

export function formatDate(dateStr, opts = {}) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        ...opts,
    });
}

export function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function formatNumber(val) {
    return new Intl.NumberFormat('en-IN').format(val);
}

export function isEditWindowOpen(dateStr) {
    if (!dateStr) return false;
    const created = new Date(dateStr + ' Z').getTime();
    const now = Date.now();
    return (now - created) < 24 * 60 * 60 * 1000;
}

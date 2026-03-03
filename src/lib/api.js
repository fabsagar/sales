// =============================================
// API Client - centralized fetch wrapper
// =============================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) localStorage.setItem('auth_token', token);
        else localStorage.removeItem('auth_token');
    }

    getHeaders(extra = {}) {
        const headers = { 'Content-Type': 'application/json', ...extra };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        return headers;
    }

    async request(path, options = {}) {
        const url = `${API_BASE}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: this.getHeaders(options.headers || {}),
        });

        // Handle CSV download
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/csv')) {
            return response;
        }

        const data = await response.json();

        if (!response.ok) {
            const err = new Error(data.error || `Request failed: ${response.status}`);
            err.status = response.status;
            err.data = data;
            throw err;
        }

        return data;
    }

    get(path, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const url = qs ? `${path}?${qs}` : path;
        return this.request(url, { method: 'GET' });
    }

    post(path, body) {
        return this.request(path, { method: 'POST', body: JSON.stringify(body) });
    }

    put(path, body) {
        return this.request(path, { method: 'PUT', body: JSON.stringify(body) });
    }

    delete(path) {
        return this.request(path, { method: 'DELETE' });
    }
}

export const api = new ApiClient();

// =============================================
// Convenience API calls
// =============================================

// Auth
export const authApi = {
    login: (email, password) => api.post('/login', { email, password }),
    register: (data) => api.post('/register', data),
    me: () => api.get('/me'),
};

// Products
export const productsApi = {
    list: (params) => api.get('/products', params),
    get: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    categories: () => api.get('/products/categories'),
};

// Retailers
export const retailersApi = {
    list: (params) => api.get('/retailers', params),
    get: (id) => api.get(`/retailers/${id}`),
    create: (data) => api.post('/retailers', data),
    update: (id, data) => api.put(`/retailers/${id}`, data),
    delete: (id) => api.delete(`/retailers/${id}`),
};

// Orders
export const ordersApi = {
    list: (params) => api.get('/orders', params),
    get: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    export: async () => {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE}/orders/export`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },
};

// Reports
export const reportsApi = {
    summary: () => api.get('/reports/summary'),
    daily: (params) => api.get('/reports/daily', params),
    monthly: (params) => api.get('/reports/monthly', params),
    yearly: () => api.get('/reports/yearly'),
    topProducts: (params) => api.get('/reports/top-products', params),
    bySalesperson: () => api.get('/reports/by-salesperson'),
};

// Notifications
export const notificationsApi = {
    list: (params) => api.get('/notifications', params),
    markRead: (id) => api.put(`/notifications/${id}/read`, {}),
    markAllRead: () => api.put('/notifications/read-all', {}),
};

// Image upload
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
};

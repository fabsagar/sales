import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import NewOrderPage from './pages/NewOrderPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import RetailersPage from './pages/RetailersPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';

function PrivateRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-surface-900">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Loading...</p>
            </div>
        </div>
    );
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/gallery" element={<PrivateRoute roles={['admin', 'salesperson']}><GalleryPage /></PrivateRoute>} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/new" element={<PrivateRoute roles={['admin', 'salesperson']}><NewOrderPage /></PrivateRoute>} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="retailers" element={<RetailersPage />} />
                <Route path="reports" element={<PrivateRoute roles={['admin']}><ReportsPage /></PrivateRoute>} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="users" element={<PrivateRoute roles={['admin']}><UsersPage /></PrivateRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

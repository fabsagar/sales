import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) { setLoading(false); return; }
        api.setToken(token);
        authApi.me()
            .then(data => setUser(data.user))
            .catch(() => { api.setToken(null); })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (credential) => {
        const data = await authApi.googleLogin(credential);
        api.setToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(() => {
        api.setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

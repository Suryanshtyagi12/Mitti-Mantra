import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Restore user from localStorage on first load
        try {
            const saved = localStorage.getItem('mm_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Validate stored token on mount
    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem('mm_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const userData = await apiService.getProfile();
                setUser(userData);
                localStorage.setItem('mm_user', JSON.stringify(userData));
            } catch (error) {
                // Token invalid or expired – clear everything
                localStorage.removeItem('mm_token');
                localStorage.removeItem('mm_user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, []);

    const login = async (username, password) => {
        try {
            const data = await apiService.login(username, password);

            localStorage.setItem('mm_token', data.access_token);
            localStorage.setItem('mm_user', JSON.stringify(data.user));
            setUser(data.user);

            toast.success(`Welcome back, ${data.user.username}! 🌱`);
            navigate('/');
            return { success: true };
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                error.message ||
                'Login failed. Please try again.';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const register = async (email, username, password, full_name) => {
        try {
            const data = await apiService.register(email, username, password, full_name);

            localStorage.setItem('mm_token', data.access_token);
            localStorage.setItem('mm_user', JSON.stringify(data.user));
            setUser(data.user);

            toast.success(`Account created! Welcome, ${data.user.username}! 🌾`);
            navigate('/');
            return { success: true };
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                error.message ||
                'Registration failed. Please try again.';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const logout = () => {
        localStorage.removeItem('mm_token');
        localStorage.removeItem('mm_user');
        setUser(null);
        navigate('/login');
        toast.info('Logged out successfully. See you soon! 👋');
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

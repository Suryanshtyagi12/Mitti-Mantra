import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await apiService.getProfile();
                    setUser(userData);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const data = await apiService.login(username, password);

            // Store token
            localStorage.setItem('token', data.access_token);

            // Set user
            setUser(data.user);

            // Navigate to home
            navigate('/');

            toast.success('Logged in successfully!');

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.detail || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const register = async (email, username, password, full_name) => {
        try {
            const data = await apiService.register(email, username, password, full_name);

            // Store token
            localStorage.setItem('token', data.access_token);

            // Set user
            setUser(data.user);

            // Navigate to home
            navigate('/');

            toast.success('Account created successfully!');

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.detail || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
        toast.info('Logged out successfully');
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

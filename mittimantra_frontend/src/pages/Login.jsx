import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username.trim() || !formData.password.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        setIsLoading(true);
        setError('');
        const result = await login(formData.username, formData.password);
        if (!result.success) {
            setError(result.error || 'Login failed. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div className="auth-page">
            {/* Animated background blobs */}
            <div className="auth-bg">
                <div className="auth-blob auth-blob-1" />
                <div className="auth-blob auth-blob-2" />
                <div className="auth-blob auth-blob-3" />
            </div>

            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Logo */}
                <div className="auth-logo-wrap">
                    <motion.div
                        className="auth-logo-icon"
                        animate={{ rotate: [0, 8, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        🌱
                    </motion.div>
                    <h1 className="auth-brand">Mitti Mantra</h1>
                    <p className="auth-brand-sub">AI-Powered Smart Farming</p>
                </div>

                <div className="auth-card">
                    <div className="auth-card-header">
                        <h2 className="auth-title">{t('auth.login.title') || 'Welcome Back'}</h2>
                        <p className="auth-subtitle">
                            {t('auth.login.subtitle') || 'Sign in to your farming dashboard'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        {/* Error banner */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    className="auth-error-banner"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <span className="auth-error-icon">⚠️</span>
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Username */}
                        <div className="auth-field">
                            <label htmlFor="login-username" className="auth-label">
                                Username or Email
                            </label>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">👤</span>
                                <input
                                    id="login-username"
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`auth-input ${error ? 'auth-input-error' : ''}`}
                                    placeholder="Enter your username or email"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <label htmlFor="login-password" className="auth-label">
                                    Password
                                </label>
                                <Link to="/forgot-password" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#16a34a', textDecoration: 'none' }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`auth-input auth-input-pw ${error ? 'auth-input-error' : ''}`}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-pw-toggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="auth-btn-primary"
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        >
                            {isLoading ? (
                                <span className="auth-btn-loading">
                                    <span className="auth-spinner" />
                                    Signing in…
                                </span>
                            ) : (
                                'Sign In 🚀'
                            )}
                        </motion.button>
                    </form>

                    <div className="auth-card-footer">
                        <p className="auth-footer-text">
                            Don't have an account?{' '}
                            <Link to="/register" className="auth-link">
                                Create one free →
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Feature badges */}
                <div className="auth-badges">
                    {['🌾 Crop AI', '💧 Smart Irrigation', '🔬 Disease Detection'].map((badge) => (
                        <span key={badge} className="auth-badge">
                            {badge}
                        </span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

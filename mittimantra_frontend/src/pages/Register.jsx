import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        full_name: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { register } = useAuth();
    const { t } = useLanguage();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const validate = () => {
        if (!formData.email.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            return 'Please enter a valid email address.';
        if (!formData.username.trim()) return 'Username is required.';
        if (formData.username.length < 3) return 'Username must be at least 3 characters.';
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username))
            return 'Username can only contain letters, numbers and underscores.';
        if (!formData.password) return 'Password is required.';
        if (formData.password.length < 6) return 'Password must be at least 6 characters.';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setIsLoading(true);
        setError('');
        const result = await register(
            formData.email,
            formData.username,
            formData.password,
            formData.full_name || null
        );
        if (!result.success) {
            setError(result.error || 'Registration failed. Please try again.');
        }
        setIsLoading(false);
    };

    const getPasswordStrength = (pw) => {
        if (!pw) return null;
        let score = 0;
        if (pw.length >= 6) score++;
        if (pw.length >= 10) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
        if (score <= 2) return { label: 'Fair', color: '#f97316', width: '50%' };
        if (score <= 3) return { label: 'Good', color: '#eab308', width: '75%' };
        return { label: 'Strong', color: '#22c55e', width: '100%' };
    };

    const strength = getPasswordStrength(formData.password);

    return (
        <div className="auth-page">
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
                        🌾
                    </motion.div>
                    <h1 className="auth-brand">Mitti Mantra</h1>
                    <p className="auth-brand-sub">AI-Powered Smart Farming</p>
                </div>

                <div className="auth-card">
                    <div className="auth-card-header">
                        <h2 className="auth-title">
                            {t('auth.register.title') || 'Create Account'}
                        </h2>
                        <p className="auth-subtitle">
                            {t('auth.register.subtitle') || 'Join thousands of smart farmers'}
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

                        {/* Email */}
                        <div className="auth-field">
                            <label htmlFor="reg-email" className="auth-label">Email Address</label>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">📧</span>
                                <input
                                    id="reg-email" type="email" name="email"
                                    value={formData.email} onChange={handleChange}
                                    className="auth-input" placeholder="you@example.com"
                                    autoComplete="email" autoFocus required
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="auth-field">
                            <label htmlFor="reg-username" className="auth-label">Username</label>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">👤</span>
                                <input
                                    id="reg-username" type="text" name="username"
                                    value={formData.username} onChange={handleChange}
                                    className="auth-input" placeholder="e.g. farmer_raj"
                                    autoComplete="username" minLength={3} required
                                />
                            </div>
                            <p className="auth-hint">Letters, numbers and underscores only</p>
                        </div>

                        {/* Full Name (optional) */}
                        <div className="auth-field">
                            <label htmlFor="reg-fullname" className="auth-label">
                                Full Name <span className="auth-optional">(optional)</span>
                            </label>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">🧑‍🌾</span>
                                <input
                                    id="reg-fullname" type="text" name="full_name"
                                    value={formData.full_name} onChange={handleChange}
                                    className="auth-input" placeholder="Your full name"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="auth-field">
                            <label htmlFor="reg-password" className="auth-label">Password</label>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password} onChange={handleChange}
                                    className="auth-input auth-input-pw"
                                    placeholder="Min. 6 characters"
                                    autoComplete="new-password" minLength={6} required
                                />
                                <button
                                    type="button" className="auth-pw-toggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {/* Password strength meter */}
                            {formData.password && strength && (
                                <div className="auth-strength">
                                    <div className="auth-strength-bar">
                                        <motion.div
                                            className="auth-strength-fill"
                                            style={{ backgroundColor: strength.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: strength.width }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <span className="auth-strength-label" style={{ color: strength.color }}>
                                        {strength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="auth-field">
                            <label htmlFor="reg-confirm" className="auth-label">Confirm Password</label>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">🔐</span>
                                <input
                                    id="reg-confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword} onChange={handleChange}
                                    className={`auth-input auth-input-pw ${
                                        formData.confirmPassword &&
                                        formData.password !== formData.confirmPassword
                                            ? 'auth-input-error'
                                            : ''
                                    }`}
                                    placeholder="Repeat your password"
                                    autoComplete="new-password" required
                                />
                                <button
                                    type="button" className="auth-pw-toggle"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    aria-label="Toggle confirm password visibility"
                                >
                                    {showConfirm ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {formData.confirmPassword &&
                                formData.password !== formData.confirmPassword && (
                                    <p className="auth-field-error">Passwords do not match</p>
                                )}
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit" disabled={isLoading}
                            className="auth-btn-primary"
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        >
                            {isLoading ? (
                                <span className="auth-btn-loading">
                                    <span className="auth-spinner" />
                                    Creating account…
                                </span>
                            ) : (
                                'Create Account 🌱'
                            )}
                        </motion.button>
                    </form>

                    <div className="auth-card-footer">
                        <p className="auth-footer-text">
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">
                                Sign in →
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="auth-badges">
                    {['🔒 Secure', '🆓 Free Forever', '🤖 AI-Powered'].map((badge) => (
                        <span key={badge} className="auth-badge">{badge}</span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Register;

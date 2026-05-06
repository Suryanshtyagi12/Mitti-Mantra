import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaSeedling, FaBars, FaTimes, FaLeaf, FaTint, FaInfoCircle, FaUser, FaSignOutAlt, FaSignInAlt, FaCalendarAlt, FaLanguage } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const navigation = [
    { name: t('nav.home'), path: '/', icon: FaSeedling },
    { name: t('nav.cropRecommendation'), path: '/crop-recommendation', icon: FaSeedling },
    { name: t('nav.diseaseDetection'), path: '/disease-detection', icon: FaLeaf },
    { name: t('nav.irrigation'), path: '/irrigation-scheduler', icon: FaTint },
    { name: t('nav.about'), path: '/about', icon: FaInfoCircle },
  ];

  const isActive = (path) => location.pathname === path;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FaSeedling className="text-3xl text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                Mitti Mantra
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${isActive(item.path)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                  }`}
              >
                <item.icon className="text-base" />
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              title={t('language.label')}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-semibold border-2 border-primary-500 text-primary-700 hover:bg-primary-50 transition-all duration-200 ml-1"
            >
              <FaLanguage className="text-base" />
              <span>{t('language.switch')}</span>
            </button>

            {/* Auth Controls */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 ml-4 border-l pl-4">
                <span className="text-sm text-gray-700 flex items-center space-x-1">
                  <FaUser />
                  <span>{user?.username}</span>
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center space-x-1"
                >
                  <FaSignOutAlt />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4 border-l pl-4">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center space-x-1"
                >
                  <FaSignInAlt />
                  <span>{t('nav.login')}</span>
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="text-xs font-bold border-2 border-primary-500 text-primary-700 px-2 py-1 rounded-md"
            >
              {t('language.switch')}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              {isOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-2 ${isActive(item.path)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                  }`}
              >
                <item.icon className="text-lg" />
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Mobile Auth Controls */}
            <div className="border-t pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-700 flex items-center space-x-2">
                    <FaUser />
                    <span>{user?.username}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <FaSignOutAlt />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FaSignInAlt />
                    <span>{t('nav.login')}</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

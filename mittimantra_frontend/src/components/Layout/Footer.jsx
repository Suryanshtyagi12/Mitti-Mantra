import React from 'react';
import { FaSeedling, FaGithub, FaLinkedin, FaTwitter, FaEnvelope } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <FaSeedling className="text-3xl text-primary-500" />
              <span className="text-2xl font-bold">Mitti Mantra</span>
            </div>
            <p className="text-gray-400 mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <FaGithub className="text-2xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <FaLinkedin className="text-2xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <FaTwitter className="text-2xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <FaEnvelope className="text-2xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('footer.home')}
                </a>
              </li>
              <li>
                <a href="/crop-recommendation" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('footer.cropRec')}
                </a>
              </li>
              <li>
                <a href="/disease-detection" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('footer.diseaseDetect')}
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('footer.dashboard')}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.resources')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('footer.aboutUs')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('footer.documentation')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('footer.faqs')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                  {t('footer.contactSupport')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            {t('footer.rights').replace('{year}', year)}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
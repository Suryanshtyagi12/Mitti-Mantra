import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSeedling, FaLeaf, FaTint, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: FaSeedling,
      title: t('home.features.crop.title'),
      description: t('home.features.crop.desc'),
      link: '/crop-recommendation',
      color: 'bg-green-500',
    },
    {
      icon: FaLeaf,
      title: t('home.features.disease.title'),
      description: t('home.features.disease.desc'),
      link: '/disease-detection',
      color: 'bg-emerald-500',
    },
    {
      icon: FaTint,
      title: t('home.features.irrigation.title'),
      description: t('home.features.irrigation.desc'),
      link: '/irrigation-scheduler',
      color: 'bg-blue-500',
    },
  ];

  const stats = [
    { value: '10,000+', label: t('home.stats.farmers') },
    { value: '50+',     label: t('home.stats.crops') },
    { value: '95%',     label: t('home.stats.accuracy') },
    { value: '24/7',    label: t('home.stats.support') },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <FaSeedling className="text-6xl md:text-8xl" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/crop-recommendation" className="btn-primary bg-white text-primary-700 hover:bg-gray-100">
                {t('home.getStarted')}
                <FaArrowRight className="inline ml-2" />
              </Link>
              <Link to="/about" className="btn-secondary border-white text-white hover:bg-white hover:text-primary-700">
                {t('home.learnMore')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">{t('home.featuresTitle')}</h2>
            <p className="section-subtitle">{t('home.featuresSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={feature.link} className="block h-full">
                  <div className="card h-full hover:scale-105 transition-transform duration-200">
                    <div className={`${feature.color} w-16 h-16 rounded-full flex items-center justify-center mb-4`}>
                      <feature.icon className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <div className="flex items-center text-primary-600 font-semibold">
                      {t('common.tryNow')} <FaArrowRight className="ml-2" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">{t('home.howItWorks')}</h2>
            <p className="section-subtitle">{t('home.howSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-700">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.step1Title')}</h3>
              <p className="text-gray-600">{t('home.step1Desc')}</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-700">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.step2Title')}</h3>
              <p className="text-gray-600">{t('home.step2Desc')}</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-700">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{t('home.step3Title')}</h3>
              <p className="text-gray-600">{t('home.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            {t('home.ctaSubtitle')}
          </p>
          <Link to="/crop-recommendation" className="btn-primary bg-white text-primary-700 hover:bg-gray-100">
            {t('home.ctaBtn')}
            <FaArrowRight className="inline ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
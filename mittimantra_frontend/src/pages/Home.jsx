import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSeedling, FaLeaf, FaTint, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';

const Home = () => {
  const features = [
    {
      icon: FaSeedling,
      title: 'Crop Recommendation',
      description: 'Get AI-powered crop suggestions based on soil conditions, weather, and environmental factors.',
      link: '/crop-recommendation',
      color: 'bg-green-500',
    },
    {
      icon: FaLeaf,
      title: 'Disease Detection',
      description: 'Upload plant images to detect diseases early and get treatment recommendations.',
      link: '/disease-detection',
      color: 'bg-emerald-500',
    },
    {
      icon: FaTint,
      title: 'Smart Irrigation',
      description: 'Optimize water usage with intelligent irrigation scheduling based on crop needs.',
      link: '/irrigation-scheduler',
      color: 'bg-blue-500',
    },
    {
      icon: FaCalendarAlt,
      title: 'Track Farming',
      description: 'Track your crops daily and get personalized AI advice based on weather and growth stage.',
      link: '/track-farming',
      color: 'bg-purple-500',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Farmers Helped' },
    { value: '50+', label: 'Crops Supported' },
    { value: '95%', label: 'Accuracy Rate' },
    { value: '24/7', label: 'AI Support' },
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
              Welcome to Mitti Mantra
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Your AI-Powered Agricultural Companion for Smarter Farming Decisions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/crop-recommendation" className="btn-primary bg-white text-primary-700 hover:bg-gray-100">
                Get Started
                <FaArrowRight className="inline ml-2" />
              </Link>
              <Link to="/about" className="btn-secondary border-white text-white hover:bg-white hover:text-primary-700">
                Learn More
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
            <h2 className="section-title">Our AI-Powered Features</h2>
            <p className="section-subtitle">
              Comprehensive agricultural solutions powered by advanced machine learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                      Try Now <FaArrowRight className="ml-2" />
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
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Three simple steps to smarter farming
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-700">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Input Your Data</h3>
              <p className="text-gray-600">
                Enter soil conditions, upload images, or provide crop details
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-700">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">AI Analysis</h3>
              <p className="text-gray-600">
                Our advanced ML models analyze and process your data instantly
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-700">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Get Recommendations</h3>
              <p className="text-gray-600">
                Receive actionable insights and expert recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Farming?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of farmers already using AI to make better decisions
          </p>
          <Link to="/crop-recommendation" className="btn-primary bg-white text-primary-700 hover:bg-gray-100">
            Get Started Now
            <FaArrowRight className="inline ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
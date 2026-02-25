import React from 'react';
import { motion } from 'framer-motion';
import { FaSeedling, FaRobot, FaUsers, FaChartLine, FaLeaf, FaHeart } from 'react-icons/fa';

const About = () => {
  const features = [
    {
      icon: FaRobot,
      title: 'AI-Powered Insights',
      description: 'Advanced machine learning models trained on extensive agricultural data to provide accurate recommendations.'
    },
    {
      icon: FaLeaf,
      title: 'Disease Detection',
      description: 'Deep learning-based image recognition to identify plant diseases early and suggest treatments.'
    },
    {
      icon: FaChartLine,
      title: 'Data-Driven Decisions',
      description: 'Make informed farming decisions based on real-time data analysis and predictive analytics.'
    },
    {
      icon: FaUsers,
      title: 'Farmer-Centric',
      description: 'Designed specifically for Indian farmers with localized crop recommendations and regional insights.'
    },
  ];

  const team = [
    {
      name: 'Agricultural AI Team',
      role: 'Machine Learning Engineers',
      description: 'Building state-of-the-art ML models for crop and disease prediction'
    },
    {
      name: 'Domain Experts',
      role: 'Agricultural Scientists',
      description: 'Ensuring accuracy and relevance of agricultural recommendations'
    },
    {
      name: 'Development Team',
      role: 'Full-Stack Developers',
      description: 'Creating seamless and user-friendly farming solutions'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <FaSeedling className="text-6xl mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Mitti Mantra
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              Empowering Indian Farmers with AI-Driven Agricultural Intelligence
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Our Mission</h2>
            <p className="section-subtitle max-w-3xl mx-auto">
              To revolutionize Indian agriculture by providing accessible, AI-powered decision support 
              that helps farmers increase yields, reduce losses, and adopt sustainable farming practices.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="card">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Why Mitti Mantra?</h3>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Agriculture is the backbone of India's economy, supporting over 58% of the rural population. 
                    However, farmers face numerous challenges including unpredictable weather, pest infestations, 
                    soil degradation, and lack of timely information.
                  </p>
                  <p>
                    Mitti Mantra bridges this gap by leveraging artificial intelligence and machine learning 
                    to provide farmers with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Personalized crop recommendations based on soil and climate conditions</li>
                    <li>Early disease detection to prevent crop losses</li>
                    <li>Smart irrigation scheduling for water conservation</li>
                    <li>Comprehensive pest management strategies</li>
                    <li>Real-time market insights and seasonal planning</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="card text-center bg-primary-50">
                <div className="text-4xl font-bold text-primary-700 mb-2">95%</div>
                <p className="text-sm text-gray-700">Prediction Accuracy</p>
              </div>
              <div className="card text-center bg-green-50">
                <div className="text-4xl font-bold text-green-700 mb-2">50+</div>
                <p className="text-sm text-gray-700">Crops Supported</p>
              </div>
              <div className="card text-center bg-blue-50">
                <div className="text-4xl font-bold text-blue-700 mb-2">30+</div>
                <p className="text-sm text-gray-700">Diseases Detected</p>
              </div>
              <div className="card text-center bg-orange-50">
                <div className="text-4xl font-bold text-orange-700 mb-2">24/7</div>
                <p className="text-sm text-gray-700">AI Support</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">What We Offer</h2>
            <p className="section-subtitle">
              Comprehensive AI-powered agricultural solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card text-center hover:shadow-xl transition-shadow"
              >
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="text-3xl text-primary-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">Technology Stack</h2>
            <p className="section-subtitle">
              Built with cutting-edge technologies for reliability and performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900">Machine Learning</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  TensorFlow & Keras for deep learning
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  XGBoost for crop recommendation
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  CNN for image recognition
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Scikit-learn for data processing
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900">Backend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  FastAPI for high-performance APIs
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Python for ML integration
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Uvicorn ASGI server
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  RESTful API architecture
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900">Frontend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  React.js for UI components
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Tailwind CSS for styling
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Recharts for data visualization
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Responsive mobile-first design
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">Our Team</h2>
            <p className="section-subtitle">
              Experts dedicated to transforming Indian agriculture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card text-center"
              >
                <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="text-3xl text-primary-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{member.name}</h3>
                <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FaHeart className="text-5xl mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Built with ❤️ for Indian Farmers
            </h2>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
              Our commitment is to make advanced agricultural technology accessible to every farmer, 
              helping them achieve better yields, higher incomes, and sustainable farming practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/crop-recommendation" className="btn-primary bg-white text-primary-700 hover:bg-gray-100">
                Start Using Now
              </a>
              <a href="mailto:support@mittimantra.com" className="btn-secondary border-white text-white hover:bg-white hover:text-primary-700">
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
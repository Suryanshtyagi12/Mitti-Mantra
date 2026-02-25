import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaChartLine, FaSeedling, FaLeaf, FaTint, FaBug, FaInfoCircle } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [cropPatterns, setCropPatterns] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [insightsData, patternsData] = await Promise.all([
        apiService.getFarmerInsights(),
        apiService.getCropPatterns()
      ]);
      setInsights(insightsData);
      setCropPatterns(patternsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac'];

  const stats = [
    {
      icon: FaSeedling,
      title: 'Crop Recommendations',
      value: '0',
      color: 'bg-green-500',
      description: 'Total recommendations made'
    },
    {
      icon: FaLeaf,
      title: 'Diseases Detected',
      value: '0',
      color: 'bg-emerald-500',
      description: 'Plant diseases identified'
    },
    {
      icon: FaTint,
      title: 'Irrigation Schedules',
      value: '0',
      color: 'bg-blue-500',
      description: 'Smart schedules created'
    },
    {
      icon: FaBug,
      title: 'Pest Controls',
      value: '0',
      color: 'bg-orange-500',
      description: 'Treatment recommendations'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center mb-4">
            <FaChartLine className="text-4xl text-primary-600 mr-3" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Farmer Dashboard
              </h1>
              <p className="text-gray-600">
                Track your farming insights and agricultural patterns
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="text-white text-xl" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-gray-900 mb-1">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Crop Patterns Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-6 text-gray-900">Seasonal Crop Patterns</h2>
            {cropPatterns && cropPatterns.patterns ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cropPatterns.patterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="season" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success_rate" fill="#16a34a" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No crop pattern data available</p>
              </div>
            )}
          </motion.div>

          {/* Market Prices Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h2 className="text-xl font-bold mb-6 text-gray-900">Current Market Trends</h2>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Market data will be displayed here</p>
            </div>
          </motion.div>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Seasonal Recommendations */}
          {insights?.seasonal_recommendations && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card bg-primary-50 border-2 border-primary-200"
            >
              <h2 className="text-xl font-bold mb-4 text-primary-900 flex items-center">
                <FaSeedling className="mr-2" />
                Seasonal Recommendations
              </h2>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Current Season</p>
                  <p className="text-lg font-bold text-primary-700">
                    {insights.seasonal_recommendations.current_season}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Recommended Crops</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.seasonal_recommendations.recommended_crops?.map((crop, index) => (
                      <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
                {insights.seasonal_recommendations.market_prices && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Current Market Prices</p>
                    <div className="space-y-2">
                      {Object.entries(insights.seasonal_recommendations.market_prices).map(([crop, price]) => (
                        <div key={crop} className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{crop}</span>
                          <span className="text-sm text-gray-700">{price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Common Diseases */}
          {insights?.common_diseases && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card bg-yellow-50 border-2 border-yellow-200"
            >
              <h2 className="text-xl font-bold mb-4 text-yellow-900 flex items-center">
                <FaLeaf className="mr-2" />
                Seasonal Disease Alerts
              </h2>
              <div className="space-y-3">
                {insights.common_diseases?.map((seasonData, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">{seasonData.season} Season</p>
                    <p className="text-sm text-gray-600 mb-2">Common Diseases:</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {seasonData.diseases?.map((disease, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                          {disease}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Affected: {seasonData.affected_crops?.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Tips Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Irrigation Tips */}
          {insights?.irrigation_tips && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card bg-blue-50 border-2 border-blue-200"
            >
              <h2 className="text-xl font-bold mb-4 text-blue-900 flex items-center">
                <FaTint className="mr-2" />
                Irrigation Tips
              </h2>
              <ul className="space-y-2">
                {insights.irrigation_tips?.map((tip, index) => (
                  <li key={index} className="flex items-start text-sm text-blue-900 bg-white p-3 rounded-lg">
                    <span className="mr-2 text-blue-600 font-bold">💧</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Pest Alerts */}
          {insights?.pest_alerts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="card bg-orange-50 border-2 border-orange-200"
            >
              <h2 className="text-xl font-bold mb-4 text-orange-900 flex items-center">
                <FaBug className="mr-2" />
                Active Pest Alerts
              </h2>
              <div className="space-y-3">
                {insights.pest_alerts?.map((alert, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900">{alert.pest_disease}</p>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        alert.severity === 'High' ? 'bg-red-100 text-red-700' :
                        alert.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Crops: {alert.affected_crops?.join(', ')}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      Regions: {alert.regions?.join(', ')}
                    </p>
                    <p className="text-xs text-orange-700 font-medium">
                      {alert.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200"
        >
          <div className="flex items-start">
            <FaInfoCircle className="text-primary-600 text-2xl mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dashboard Information</h3>
              <p className="text-gray-700 text-sm">
                This dashboard provides real-time insights into your farming activities, seasonal recommendations, 
                and important alerts. Use the various tools to make informed decisions about crop selection, 
                disease management, irrigation, and pest control. Data is updated regularly to ensure you have 
                the most current information.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaTint, FaInfoCircle, FaClock, FaWater } from 'react-icons/fa';
import { apiService } from '../services/api';

const IrrigationScheduler = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    location: '',
    crop: '',
    irrigation_method: 'Not Sure',
    soil_type: '',
    rainfall_pattern: '',
  });


  const irrigationMethods = [
    { value: 'Drip', label: 'Drip' },
    { value: 'Sprinkler', label: 'Sprinkler' },
    { value: 'Flood', label: 'Flood' },
    { value: 'Not Sure', label: 'Not Sure' },
  ];

  const commonCrops = [
    'Rice', 'Wheat', 'Maize', 'Cotton', 'Tomato',
    'Potato', 'Sugarcane', 'Soybean', 'Chickpea', 'Mustard',
    'Onion', 'Groundnut', 'Sunflower', 'Barley'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Validate required fields
      if (!formData.location || formData.location.trim().length < 3) {
        toast.error('Please enter a valid location');
        setLoading(false);
        return;
      }

      if (!formData.crop || formData.crop.trim().length < 2) {
        toast.error('Please enter a crop name');
        setLoading(false);
        return;
      }

      const payload = {
        location: formData.location,
        crop: formData.crop,
        irrigation_method: formData.irrigation_method,
        soil_type: formData.soil_type || 'Typical soil for this region',
        rainfall_pattern: formData.rainfall_pattern || 'Moderate rainfall',
        language: 'en'
      };

      const response = await apiService.getIrrigationSchedule(payload);
      setResult(response);
      toast.success('Irrigation schedule generated successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to get irrigation schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      location: '',
      crop: '',
      irrigation_method: 'Not Sure',
      soil_type: '',
      rainfall_pattern: '',
    });
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <FaTint className="text-5xl text-blue-600" />
          </div>
          <h1 className="section-title">Smart Irrigation Scheduler</h1>
          <p className="section-subtitle">
            Optimize water usage with AI-powered irrigation recommendations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Irrigation Help
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (State/District) *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Punjab, Maharashtra"
                  required
                />
              </div>

              {/* Crop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop *
                </label>
                <input
                  type="text"
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Wheat, Rice, Cotton"
                  list="crop-suggestions"
                  required
                />
                <datalist id="crop-suggestions">
                  {commonCrops.map((crop) => (
                    <option key={crop} value={crop} />
                  ))}
                </datalist>
              </div>

              {/* Irrigation Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Irrigation Method *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {irrigationMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, irrigation_method: method.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${formData.irrigation_method === method.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Soil Type - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soil Type (Optional)
                </label>
                <select
                  name="soil_type"
                  value={formData.soil_type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Soil Type...</option>
                  <option value="Clay">Clay</option>
                  <option value="Sandy">Sandy</option>
                  <option value="Loamy">Loamy</option>
                  <option value="Black">Black</option>
                  <option value="Red">Red</option>
                  <option value="Alluvial">Alluvial</option>
                </select>
              </div>

              {/* Rainfall Pattern - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rainfall Pattern (Optional)
                </label>
                <input
                  type="text"
                  name="rainfall_pattern"
                  value={formData.rainfall_pattern}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Heavy monsoon, Moderate, Low rainfall"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 AI will use regional weather data if not specified
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Calculating...
                    </span>
                  ) : (
                    'Get Schedule'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  Reset
                </button>
              </div>
            </form>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {result ? (
              <div className="space-y-6">
                {/* Main Recommendation */}
                <div className={`card ${result.irrigation_needed ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300' : 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300'}`}>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 flex justify-between items-center">
                    <span>Irrigation Recommendation</span>
                    <button
                      onClick={() => {
                        const text = result.ai_advice || result.reasoning;
                        if (text) {
                          const utterance = new SpeechSynthesisUtterance(text);
                          window.speechSynthesis.speak(utterance);
                        }
                      }}
                      className={`text-sm text-white px-3 py-1 rounded-full hover:opacity-90 transition ${result.irrigation_needed ? 'bg-blue-600' : 'bg-green-600'}`}
                    >
                      🔊 Read Aloud
                    </button>
                  </h2>

                  <div className="space-y-4">
                    {/* Status */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center mb-3">
                        <FaWater className={`text-4xl mr-4 ${result.irrigation_needed ? 'text-blue-600' : 'text-green-600'}`} />
                        <div>
                          <p className="text-sm text-gray-600">Irrigation Status</p>
                          <p className={`text-2xl font-bold ${result.irrigation_needed ? 'text-blue-700' : 'text-green-700'}`}>
                            {result.irrigation_needed ? 'Required' : 'Not Needed'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Water Amount */}
                    {result.irrigation_needed && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Water Amount Required</p>
                        <p className="text-3xl font-bold text-blue-700">
                          {result.water_amount} L/m²
                        </p>
                      </div>
                    )}

                    {/* Schedule */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start">
                        <FaClock className="text-blue-600 mr-3 mt-1 flex-shrink-0 text-xl" />
                        <div>
                          <p className="text-sm text-gray-600 mb-1 font-medium">Schedule</p>
                          <p className="text-gray-900">{result.schedule}</p>
                        </div>
                      </div>
                    </div>

                    {/* Next Irrigation - Handle nested structure */}
                    {(result.next_irrigation || result.rule_based_details?.next_irrigation) && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Next Irrigation</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(result.next_irrigation || result.rule_based_details?.next_irrigation).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    )}

                    {/* AI Advice / Reasoning */}
                    {(result.ai_advice || result.reasoning || result.rule_based_details?.reasoning) && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start">
                          <FaInfoCircle className="text-blue-600 mr-2 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-600 mb-1 font-medium">
                              {result.ai_advice ? "AI Advice" : "Why?"}
                            </p>
                            <div className="text-gray-700 whitespace-pre-wrap">
                              {result.ai_advice || result.reasoning || result.rule_based_details?.reasoning}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips - Handle nested */}
                {((result.tips && result.tips.length > 0) || (result.rule_based_details?.tips && result.rule_based_details.tips.length > 0)) && (
                  <div className="card bg-yellow-50 border-2 border-yellow-200">
                    <h3 className="text-lg font-bold mb-3 text-yellow-900">
                      💡 Irrigation Tips
                    </h3>
                    <ul className="space-y-2">
                      {(result.tips || result.rule_based_details?.tips).map((tip, index) => (
                        <li key={index} className="flex items-start text-sm text-yellow-900">
                          <span className="mr-2">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="card bg-gray-100 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-500">
                  <FaTint className="text-6xl mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Fill in the form to get irrigation schedule</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 card bg-green-50 border-2 border-green-200"
        >
          <h3 className="text-xl font-bold mb-4 text-green-900 flex items-center">
            <FaInfoCircle className="mr-2" />
            Irrigation Best Practices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-green-900">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold mb-2">⏰ Best Time to Irrigate</p>
              <p>Early morning (5-7 AM) or late evening (6-8 PM) to minimize evaporation</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold mb-2">💧 Drip Irrigation</p>
              <p>Save up to 60% water compared to flood irrigation. Highly efficient for most crops</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold mb-2">🌱 Mulching</p>
              <p>Apply organic mulch to reduce evaporation and maintain soil moisture</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold mb-2">📊 Monitor Regularly</p>
              <p>Check soil moisture daily using a meter or the finger test method</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold mb-2">🌤️ Weather Forecast</p>
              <p>Check weather predictions before irrigating. Skip if rain is expected</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold mb-2">⚠️ Avoid Overwatering</p>
              <p>Excess water leads to root diseases and nutrient leaching</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IrrigationScheduler;
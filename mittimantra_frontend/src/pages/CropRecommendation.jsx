import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaSeedling, FaInfoCircle } from 'react-icons/fa';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const CropRecommendation = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('ml'); // 'ml' or 'ai'
  const [formData, setFormData] = useState({
    // ML Model fields
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
    // AI Model fields
    location: '',
    season: 'Kharif',
    priority: 'Medium',
    soilType: '',
  });

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
      let response;

      if (mode === 'ml') {
        // ML Model: requires all NPK and environmental data
        const payload = {
          nitrogen: parseFloat(formData.nitrogen),
          phosphorus: parseFloat(formData.phosphorus),
          potassium: parseFloat(formData.potassium),
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          ph: parseFloat(formData.ph),
          rainfall: parseFloat(formData.rainfall),
        };
        response = await apiService.predictCrop(payload);
      } else {
        // AI Mode: only location is required, rest is optional
        if (!formData.location || formData.location.trim().length < 3) {
          toast.error(t('errors.locationRequired'));
          setLoading(false);
          return;
        }

        const payload = {
          location: formData.location,
          season: formData.season,
          priority: formData.priority,
          soil_type: formData.soilType || 'Typical soil for this region',
          nitrogen: formData.nitrogen ? parseFloat(formData.nitrogen) : 0,
          phosphorus: formData.phosphorus ? parseFloat(formData.phosphorus) : 0,
          potassium: formData.potassium ? parseFloat(formData.potassium) : 0,
          language: language
        };
        response = await apiService.getCropSuggestionAI(payload);
      }

      setResult(response);
      toast.success(t('common.success'));
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || t('errors.apiError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      temperature: '',
      humidity: '',
      ph: '',
      rainfall: '',
      location: '',
      season: 'Kharif',
      priority: 'Medium',
      soilType: '',
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
            <FaSeedling className="text-5xl text-primary-600" />
          </div>
          <h1 className="section-title">{t('cropRecommendation.title')}</h1>
          <p className="section-subtitle">
            {t('cropRecommendation.subtitle')}
          </p>

          {/* Mode Selector */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {t('cropRecommendation.chooseMethod')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* ML Model Option */}
                <button
                  onClick={() => setMode('ml')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${mode === 'ml'
                    ? 'border-primary-600 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary-300'
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`text-3xl mb-2 ${mode === 'ml' ? 'text-primary-600' : 'text-gray-400'}`}>
                      🤖
                    </div>
                    <h4 className={`font-bold mb-1 ${mode === 'ml' ? 'text-primary-700' : 'text-gray-700'}`}>
                      {t('cropRecommendation.mlMode')}
                    </h4>
                    <p className="text-xs text-gray-600 text-center">
                      {t('cropRecommendation.mlModeDesc')}
                    </p>
                  </div>
                </button>

                {/* AI API Option */}
                <button
                  onClick={() => setMode('ai')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${mode === 'ai'
                    ? 'border-green-600 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`text-3xl mb-2 ${mode === 'ai' ? 'text-green-600' : 'text-gray-400'}`}>
                      ✨
                    </div>
                    <h4 className={`font-bold mb-1 ${mode === 'ai' ? 'text-green-700' : 'text-gray-700'}`}>
                      {t('cropRecommendation.aiMode')}
                    </h4>
                    <p className="text-xs text-gray-600 text-center">
                      {t('cropRecommendation.aiModeDesc')}
                    </p>
                  </div>
                </button>
              </div>

              {/* Current Selection Indicator */}
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">
                  Currently using: <span className={`font-semibold ${mode === 'ml' ? 'text-primary-600' : 'text-green-600'}`}>
                    {mode === 'ml' ? 'ML Model' : 'AI API (Groq)'}
                  </span>
                </span>
              </div>
            </div>
          </div>
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
              {mode === 'ml' ? t('cropRecommendation.enterSoilData') : t('cropRecommendation.enterFarmDetails')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'ml' ? (
                // ML Model Inputs - All Required
                <>
                  {/* Nitrogen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.nitrogen')} *
                    </label>
                    <input
                      type="number" name="nitrogen" value={formData.nitrogen} onChange={handleChange}
                      className="input-field" placeholder={t('cropRecommendation.nitrogenPh')}
                      min="0" max="200" step="0.1" required
                    />
                  </div>

                  {/* Phosphorus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.phosphorus')} *
                    </label>
                    <input
                      type="number" name="phosphorus" value={formData.phosphorus} onChange={handleChange}
                      className="input-field" placeholder={t('cropRecommendation.phosphorusPh')}
                      min="0" max="200" step="0.1" required
                    />
                  </div>

                  {/* Potassium */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.potassium')} *
                    </label>
                    <input
                      type="number" name="potassium" value={formData.potassium} onChange={handleChange}
                      className="input-field" placeholder={t('cropRecommendation.potassiumPh')}
                      min="0" max="300" step="0.1" required
                    />
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.temperature')} *
                    </label>
                    <input
                      type="number" name="temperature" value={formData.temperature} onChange={handleChange}
                      className="input-field" placeholder={t('cropRecommendation.temperaturePh')}
                      min="-10" max="60" step="0.1" required
                    />
                  </div>

                  {/* Humidity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.humidity')} *
                    </label>
                    <input
                      type="number" name="humidity" value={formData.humidity} onChange={handleChange}
                      className="input-field" placeholder={t('cropRecommendation.humidityPh')}
                      min="0" max="100" step="0.1" required
                    />
                  </div>

                  {/* pH */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.ph')} *
                    </label>
                    <input
                      type="number" name="ph" value={formData.ph} onChange={handleChange}
                      className="input-field" placeholder={t('cropRecommendation.phPh')}
                      min="3" max="10" step="0.1" required
                    />
                  </div>

                  {/* Rainfall */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.rainfall')} *
                    </label>
                    <input
                      type="number" name="rainfall" value={formData.rainfall} onChange={handleChange}
                      className="input-field" placeholder={t('cropRecommendation.rainfallPh')}
                      min="0" max="500" step="0.1" required
                    />
                  </div>
                </>
              ) : (
                // AI Model Inputs - Only Location Required
                <>
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.location')} *
                    </label>
                    <input
                      type="text" name="location" value={formData.location} onChange={handleChange}
                      className="input-field" placeholder={t('cropRecommendation.locationPlaceholder')} required
                    />
                  </div>

                  {/* Season */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.season')} *
                    </label>
                    <select name="season" value={formData.season} onChange={handleChange} className="input-field" required>
                      <option value="Kharif">{t('cropRecommendation.kharif')}</option>
                      <option value="Rabi">{t('cropRecommendation.rabi')}</option>
                      <option value="Zaid">{t('cropRecommendation.zaid')}</option>
                    </select>
                  </div>

                  {/* Profit Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.profitPriority')} *
                    </label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className="input-field" required>
                      <option value="Low">{t('cropRecommendation.low')}</option>
                      <option value="Medium">{t('cropRecommendation.medium')}</option>
                      <option value="High">{t('cropRecommendation.high')}</option>
                    </select>
                  </div>

                  {/* Soil Type - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('cropRecommendation.soilTypeOptional')}
                    </label>
                    <select name="soilType" value={formData.soilType} onChange={handleChange} className="input-field">
                      <option value="">{t('cropRecommendation.soilTypePlaceholder')}</option>
                      <option value="Clay">{t('cropRecommendation.clay')}</option>
                      <option value="Sandy">{t('cropRecommendation.sandy')}</option>
                      <option value="Loamy">{t('cropRecommendation.loamy')}</option>
                      <option value="Black">{t('cropRecommendation.black')}</option>
                      <option value="Red">{t('cropRecommendation.red')}</option>
                      <option value="Alluvial">{t('cropRecommendation.alluvial')}</option>
                    </select>
                  </div>

                  {/* Optional NPK Section */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('cropRecommendation.optionalNPK')}</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('cropRecommendation.nitrogen')}</label>
                        <input type="number" name="nitrogen" value={formData.nitrogen} onChange={handleChange}
                          className="input-field text-sm" placeholder="0-200" min="0" max="200" step="0.1" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('cropRecommendation.phosphorus')}</label>
                        <input type="number" name="phosphorus" value={formData.phosphorus} onChange={handleChange}
                          className="input-field text-sm" placeholder="0-200" min="0" max="200" step="0.1" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('cropRecommendation.potassium')}</label>
                        <input type="number" name="potassium" value={formData.potassium} onChange={handleChange}
                          className="input-field text-sm" placeholder="0-300" min="0" max="300" step="0.1" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t('cropRecommendation.optionalNPKNote')}</p>
                  </div>
                </>
              )}

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
                      {t('common.analyzing')}
                    </span>
                  ) : (
                    t('cropRecommendation.getRecommendation')
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  {t('common.reset')}
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
              <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300">
                <h2 className="text-2xl font-bold mb-6 text-primary-900 flex justify-between items-center">
                  <span>{t('cropRecommendation.result.title')}</span>
                  <button
                    onClick={() => {
                      const text = result.ai_advice || result.reasoning;
                      if (text) {
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    className="text-sm bg-primary-600 text-white px-3 py-1 rounded-full hover:bg-primary-700 transition"
                  >
                    {t('common.readAloud')}
                  </button>
                </h2>

                <div className="space-y-4">
                  {/* Recommended Crop */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FaSeedling className="text-3xl text-primary-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">{t('cropRecommendation.result.recommendedCrop')}</p>
                        <p className="text-3xl font-bold text-primary-700 capitalize">
                          {result.recommended_crop}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confidence */}
                  {result.confidence && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-2">{t('cropRecommendation.result.confidence')}</p>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                          <div
                            className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${result.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold text-primary-700">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Alternative Crops - Handle both old and new structure */}
                  {((result.ml_details?.alternative_crops) || (result.alternative_crops)) && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-3 font-medium">{t('cropRecommendation.result.alternatives')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(result.ml_details?.alternative_crops || result.alternative_crops).map((crop, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reasoning / AI Advice */}
                  {(result.ai_advice || result.reasoning) && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start">
                        <FaInfoCircle className="text-primary-600 mr-2 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 mb-1 font-medium">
                            {result.ai_advice ? t('cropRecommendation.result.aiAdvice') : t('cropRecommendation.result.whyCrop')}
                          </p>
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {result.ai_advice || result.reasoning}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card bg-gray-100 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-500">
                  <FaSeedling className="text-6xl mx-auto mb-4 opacity-50" />
                  <p className="text-lg">{t('cropRecommendation.empty')}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 card bg-blue-50 border-2 border-blue-200"
        >
          <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center">
            <FaInfoCircle className="mr-2" />
            How to Use This Tool
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-900">
            <div>
              <p className="font-semibold mb-2">📊 Soil Testing:</p>
              <p>Get your soil tested at a local agricultural lab to obtain accurate NPK values and pH levels.</p>
            </div>
            <div>
              <p className="font-semibold mb-2">🌡️ Weather Data:</p>
              <p>Use current temperature, humidity, and seasonal rainfall data from your region.</p>
            </div>
            <div>
              <p className="font-semibold mb-2">✅ Accuracy:</p>
              <p>More accurate inputs lead to better recommendations. Use recent soil test results.</p>
            </div>
            <div>
              <p className="font-semibold mb-2">🌾 Crop Selection:</p>
              <p>Consider the recommended crop along with market demand and your farming experience.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CropRecommendation;
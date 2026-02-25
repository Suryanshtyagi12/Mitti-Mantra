import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaLeaf, FaUpload, FaCamera, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { apiService } from '../services/api';

const DiseaseDetection = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('ml'); // 'ml' or 'ai'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);

    try {
      let response;
      if (mode === 'ml') {
        // Use ML model endpoint
        response = await apiService.predictDisease(selectedImage);
      } else {
        // Use AI API endpoint (Gemini Vision)
        response = await apiService.detectDiseaseAI(selectedImage, 'en');
      }

      setResult(response);
      toast.success('Disease detected successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to detect disease');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'very high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      case 'none':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
            <FaLeaf className="text-5xl text-green-600" />
          </div>
          <h1 className="section-title">Plant Disease Detection</h1>
          <p className="section-subtitle">
            Upload a leaf image to detect diseases and get treatment recommendations
          </p>

          {/* Mode Selector */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Choose Detection Method
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
                      🧠
                    </div>
                    <h4 className={`font-bold mb-1 ${mode === 'ml' ? 'text-primary-700' : 'text-gray-700'}`}>
                      CNN Model
                    </h4>
                    <p className="text-xs text-gray-600 text-center">
                      Fast image classification using trained deep learning model
                    </p>
                  </div>
                </button>

                {/* AI API Option */}
                <button
                  onClick={() => setMode('ai')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${mode === 'ai'
                      ? 'border-purple-600 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`text-3xl mb-2 ${mode === 'ai' ? 'text-purple-600' : 'text-gray-400'}`}>
                      🔮
                    </div>
                    <h4 className={`font-bold mb-1 ${mode === 'ai' ? 'text-purple-700' : 'text-gray-700'}`}>
                      AI Vision (Gemini)
                    </h4>
                    <p className="text-xs text-gray-600 text-center">
                      Detailed analysis and treatment recommendations using Gemini Vision
                    </p>
                  </div>
                </button>
              </div>

              {/* Current Selection Indicator */}
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">
                  Currently using: <span className={`font-semibold ${mode === 'ml' ? 'text-primary-600' : 'text-purple-600'}`}>
                    {mode === 'ml' ? 'CNN Model' : 'AI Vision (Gemini)'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Upload Plant Image
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload Area */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />

                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-80 object-contain rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleReset}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload"
                    className="image-preview cursor-pointer hover:border-primary-500 transition-colors flex flex-col items-center justify-center"
                  >
                    <FaCamera className="text-6xl text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium mb-2">
                      Click to upload image
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG up to 10MB
                    </p>
                  </label>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !selectedImage}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      <FaUpload className="inline mr-2" />
                      Detect Disease
                    </>
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

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                <FaInfoCircle className="mr-2" />
                Tips for Best Results:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                <li>Take clear, well-lit photos of affected leaves</li>
                <li>Focus on the diseased area</li>
                <li>Avoid blurry or dark images</li>
                <li>Include only one leaf per image</li>
              </ul>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {result ? (
              <div className="space-y-6">
                {/* Detection Result */}
                <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
                  <h2 className="text-2xl font-bold mb-4 text-green-900 flex justify-between items-center">
                    <span>Detection Result</span>
                    <button
                      onClick={() => {
                        const text = result.ai_advice;
                        if (text) {
                          const utterance = new SpeechSynthesisUtterance(text);
                          window.speechSynthesis.speak(utterance);
                        }
                      }}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition"
                    >
                      🔊 Read Aloud
                    </button>
                  </h2>

                  <div className="space-y-4">
                    {/* Disease Name */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Detected Disease</p>
                      <p className="text-2xl font-bold text-green-700">
                        {result.disease}
                      </p>
                    </div>

                    {/* Affected Plant */}
                    {result.affected_plant && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Affected Plant</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {result.affected_plant}
                        </p>
                      </div>
                    )}

                    {/* Confidence & Severity */}
                    <div className="grid grid-cols-2 gap-4">
                      {result.confidence && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-600 mb-2">Confidence</p>
                          <p className="text-2xl font-bold text-green-700">
                            {(result.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}

                      {result.severity && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-600 mb-2">Severity</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getSeverityColor(result.severity)}`}>
                            {result.severity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Advice */}
                {result.ai_advice && (
                  <div className="card bg-white border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                      <FaInfoCircle className="mr-2 text-green-600" />
                      AI Treatment Advice
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {result.ai_advice}
                    </div>
                  </div>
                )}

                {/* Action Button - Only show if we don't have detailed AI advice or if they want specific pest control */}
                {/* With AI advice, the "pest control" page might be redundant, but keeping link just in case */}
                {result.disease.toLowerCase() !== 'healthy' && !result.ai_advice && (
                  <div className="card bg-primary-50 border-2 border-primary-300">
                    <p className="text-gray-700 mb-4">
                      Get detailed pest control recommendations and treatment options
                    </p>
                    <button
                      onClick={() => window.location.href = '/pest-control'}
                      className="btn-primary w-full"
                    >
                      View Treatment Options
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card bg-gray-100 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-500">
                  <FaLeaf className="text-6xl mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Upload an image to detect diseases</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Common Diseases Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 card bg-yellow-50 border-2 border-yellow-200"
        >
          <h3 className="text-xl font-bold mb-4 text-yellow-900 flex items-center">
            <FaInfoCircle className="mr-2" />
            Commonly Detected Diseases
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">🍅 Tomato Diseases</p>
              <ul className="text-gray-700 space-y-1">
                <li>• Early Blight</li>
                <li>• Late Blight</li>
                <li>• Bacterial Spot</li>
                <li>• Leaf Mold</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">🌾 Rice Diseases</p>
              <ul className="text-gray-700 space-y-1">
                <li>• Leaf Blast</li>
                <li>• Brown Spot</li>
                <li>• Neck Blast</li>
                <li>• Bacterial Blight</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">🥔 Potato Diseases</p>
              <ul className="text-gray-700 space-y-1">
                <li>• Early Blight</li>
                <li>• Late Blight</li>
                <li>• Bacterial Wilt</li>
                <li>• Leaf Roll Virus</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
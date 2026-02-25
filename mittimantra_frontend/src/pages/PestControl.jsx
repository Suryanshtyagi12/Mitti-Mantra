import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaBug, FaUpload, FaCamera, FaInfoCircle, FaTimes, FaLeaf, FaFlask } from 'react-icons/fa';
import { apiService } from '../services/api';

const PestControl = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
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
      const response = await apiService.getPestControl(selectedImage);
      setResult(response);
      toast.success('Pest control recommendations generated!');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to get pest control recommendations');
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
      case 'very high':
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'none':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
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
            <FaBug className="text-5xl text-orange-600" />
          </div>
          <h1 className="section-title">Pest & Disease Control</h1>
          <p className="section-subtitle">
            Get comprehensive pest management strategies and treatment options
          </p>
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
              Upload Affected Plant Image
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
                  id="pest-image-upload"
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
                    htmlFor="pest-image-upload"
                    className="image-preview cursor-pointer hover:border-orange-500 transition-colors flex flex-col items-center justify-center"
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
                      Get Recommendations
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

            {/* Info Box */}
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm font-semibold text-orange-900 mb-2 flex items-center">
                <FaInfoCircle className="mr-2" />
                Image Tips:
              </p>
              <ul className="text-sm text-orange-800 space-y-1 ml-6 list-disc">
                <li>Capture clear images of affected areas</li>
                <li>Include symptoms and damage patterns</li>
                <li>Natural lighting works best</li>
                <li>Multiple angles help accurate diagnosis</li>
              </ul>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {result ? (
              <>
                {/* Detection Result */}
                <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300">
                  <h2 className="text-2xl font-bold mb-4 text-orange-900 flex justify-between items-center">
                    <span>Detection & Severity</span>
                    <button
                      onClick={() => {
                        // Construct text from organic and chemical solutions
                        let text = `Detected ${result.disease}. Severity is ${result.severity}. `;
                        if (result.organic_solutions && result.organic_solutions.length) {
                          text += "Organic solutions include: " + result.organic_solutions.join(", ") + ". ";
                        }
                        if (result.chemical_solutions && result.chemical_solutions.length) {
                          text += "Chemical solutions include: " + result.chemical_solutions.join(", ") + ".";
                        }

                        if (text) {
                          const utterance = new SpeechSynthesisUtterance(text);
                          window.speechSynthesis.speak(utterance);
                        }
                      }}
                      className="text-sm bg-orange-600 text-white px-3 py-1 rounded-full hover:bg-orange-700 transition"
                    >
                      🔊 Read Aloud
                    </button>
                  </h2>

                  <div className="space-y-4">
                    {/* Disease/Pest Name */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Detected Issue</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {result.disease}
                      </p>
                    </div>

                    {/* Confidence & Severity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">Confidence</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {(result.confidence * 100).toFixed(1)}%
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">Severity</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border-2 ${getSeverityColor(result.severity)}`}>
                          {result.severity}
                        </span>
                      </div>
                    </div>

                    {/* Recovery Time */}
                    {result.estimated_recovery_time && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-1">Estimated Recovery Time</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.estimated_recovery_time}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Organic Solutions */}
                {result.organic_solutions && result.organic_solutions.length > 0 && (
                  <div className="card bg-green-50 border-2 border-green-300">
                    <h3 className="text-xl font-bold mb-4 text-green-900 flex items-center">
                      <FaLeaf className="mr-2" />
                      Organic Solutions
                    </h3>
                    <ul className="space-y-2">
                      {result.organic_solutions.map((solution, index) => (
                        <li key={index} className="flex items-start text-sm text-green-900 bg-white p-3 rounded-lg">
                          <span className="mr-2 text-green-600 font-bold">✓</span>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chemical Solutions */}
                {result.chemical_solutions && result.chemical_solutions.length > 0 && (
                  <div className="card bg-blue-50 border-2 border-blue-300">
                    <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center">
                      <FaFlask className="mr-2" />
                      Chemical Solutions
                    </h3>
                    <ul className="space-y-2">
                      {result.chemical_solutions.map((solution, index) => (
                        <li key={index} className="flex items-start text-sm text-blue-900 bg-white p-3 rounded-lg">
                          <span className="mr-2 text-blue-600 font-bold">•</span>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                      <p className="text-xs text-yellow-900">
                        <strong>⚠️ Safety Note:</strong> Always follow label instructions and wear protective equipment when applying chemicals.
                      </p>
                    </div>
                  </div>
                )}

                {/* Preventive Measures */}
                {result.preventive_measures && result.preventive_measures.length > 0 && (
                  <div className="card bg-purple-50 border-2 border-purple-300">
                    <h3 className="text-xl font-bold mb-4 text-purple-900 flex items-center">
                      <FaInfoCircle className="mr-2" />
                      Preventive Measures
                    </h3>
                    <ul className="space-y-2">
                      {result.preventive_measures.map((measure, index) => (
                        <li key={index} className="flex items-start text-sm text-purple-900 bg-white p-3 rounded-lg">
                          <span className="mr-2 text-purple-600 font-bold">→</span>
                          <span>{measure}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="card bg-gray-100 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-500">
                  <FaBug className="text-6xl mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Upload an image to get pest control recommendations</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* IPM Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300"
        >
          <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
            <FaInfoCircle className="mr-2" />
            Integrated Pest Management (IPM) Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">🔍 Regular Monitoring</p>
              <p className="text-gray-700">Inspect crops weekly for early pest detection. Catch problems before they spread.</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">🌱 Cultural Practices</p>
              <p className="text-gray-700">Crop rotation, proper spacing, and sanitation reduce pest pressure naturally.</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">🐛 Biological Control</p>
              <p className="text-gray-700">Use natural predators like ladybugs and parasitic wasps to control pests.</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">💧 Threshold-Based Treatment</p>
              <p className="text-gray-700">Apply treatments only when pest populations exceed economic thresholds.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PestControl;
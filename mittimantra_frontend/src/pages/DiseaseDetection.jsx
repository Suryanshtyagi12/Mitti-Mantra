import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaLeaf, FaUpload, FaCamera, FaInfoCircle, FaTimes,
  FaExclamationTriangle, FaCheckCircle, FaFlask, FaSeedling,
  FaHandHoldingHeart, FaShieldAlt, FaLightbulb, FaMicroscope,
  FaSpinner, FaRedo, FaStar,
} from 'react-icons/fa';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

/* ─── helpers ─────────────────────────────────────────────── */

const SEVERITY_META = {
  'none':      { color: 'text-emerald-700 bg-emerald-100 border-emerald-300', icon: '✅', label: 'None'      },
  'low':       { color: 'text-yellow-700 bg-yellow-100 border-yellow-300',   icon: '⚠️', label: 'Low'       },
  'medium':    { color: 'text-orange-700 bg-orange-100 border-orange-300',   icon: '🟠', label: 'Medium'    },
  'high':      { color: 'text-red-700 bg-red-100 border-red-300',            icon: '🔴', label: 'High'      },
  'very high': { color: 'text-red-900 bg-red-200 border-red-500',            icon: '🚨', label: 'Very High' },
};

const getSeverityMeta = (severity) =>
  SEVERITY_META[(severity || '').toLowerCase()] ||
  { color: 'text-gray-600 bg-gray-100 border-gray-300', icon: '❓', label: severity || 'Unknown' };

/** Animated confidence bar */
const ConfidenceBar = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 55 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Confidence</span><span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

/** Reusable card section */
const Section = ({ icon: Icon, iconColor, title, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
    <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
      <Icon className={`text-lg ${iconColor}`} />
      {title}
    </h4>
    {children}
  </div>
);

/** Bullet list with empty-state */
const BulletList = ({ items, emptyMsg = 'N/A' }) => {
  const validItems = (items || []).filter(Boolean);
  if (validItems.length === 0) return <p className="text-gray-500 text-sm">{emptyMsg}</p>;
  return (
    <ul className="space-y-1.5">
      {validItems.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className="mt-0.5 text-green-500 flex-shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

/** Loading skeleton shown while Gemini is analysing */
const AnalysingSkeleton = () => (
  <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 space-y-4">
    <div className="flex items-center gap-3 mb-2">
      <FaSpinner className="text-green-500 animate-spin text-2xl" />
      <div>
        <p className="font-semibold text-gray-800">Analysing with Gemini AI…</p>
        <p className="text-xs text-gray-400">Trying the best available model. This may take a few seconds.</p>
      </div>
    </div>
    {[80, 60, 90, 50].map((w, i) => (
      <div key={i} className={`h-4 bg-gray-100 rounded-full animate-pulse`} style={{ width: `${w}%` }} />
    ))}
  </div>
);

/* ─── main component ─────────────────────────────────────── */

const DiseaseDetection = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [errorState, setErrorState]   = useState(null);
  const [mode, setMode]               = useState('ai');           // 'ml' | 'ai'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return; }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setErrorState(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleImageSelect(fakeEvent);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) { toast.error('Please select an image first'); return; }
    setLoading(true);
    setErrorState(null);
    setResult(null);

    try {
      let response;
      if (mode === 'ml') {
        response = await apiService.predictDisease(selectedImage, language);
      } else {
        response = await apiService.detectDiseaseAI(selectedImage, language);
      }

      // ── Classify the response type ──────────────────────────────
      const diseaseLower = (response?.disease || '').toLowerCase();
      const isServiceError = response?.source === 'fallback' && (
        diseaseLower.includes('quota') ||
        diseaseLower.includes('unavailable') ||
        diseaseLower.includes('busy') ||
        diseaseLower.includes('failed') ||
        diseaseLower.includes('service')
      );

      if (isServiceError) {
        const isQuota = diseaseLower.includes('quota') || diseaseLower.includes('exceeded');
        setErrorState({
          title: response.disease,
          message: response.farmer_advice || 'AI service temporarily unavailable.',
          isQuota,
        });
        toast.warning('AI service temporarily unavailable — see details below.');
        return;
      }

      // ── Success path ─────────────────────────────────────────────
      setResult(response);
      const src = response?.source === 'gemini'
        ? '✅ AI analysis complete!'
        : '⚠️ Result via fallback mode';
      toast.success(src);

    } catch (error) {
      console.error('Disease detection error:', error);
      const msg = error.response?.data?.detail || 'Failed to analyse image. Please try again.';
      toast.error(msg);
      setErrorState({ title: 'Request Failed', message: msg, isQuota: false });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorState(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReadAloud = () => {
    const text = result?.farmer_advice || result?.ai_advice || '';
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const severityMeta = getSeverityMeta(result?.severity);
  const isHealthy = result?.disease?.toLowerCase() === 'healthy';

  // Resolve friendly plant display name
  const plantDisplay = (() => {
    const p = result?.affected_plant || '';
    if (!p || p.toLowerCase() === 'plant' || p.toLowerCase() === 'unknown') return null;
    return p;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mb-4">
            <FaLeaf className="text-3xl text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {t('diseaseDetection.title')}
          </h1>
          <p className="mt-2 text-gray-500 text-lg max-w-xl mx-auto">
            {t('diseaseDetection.subtitle')}
          </p>

          {/* Mode Toggle */}
          <div className="mt-8 inline-flex bg-white rounded-2xl shadow-md p-1.5 border border-gray-100">
            {[
              { key: 'ml', label: 'CNN Model',        icon: '🧠', desc: 'Fast deep-learning classifier' },
              { key: 'ai', label: 'Gemini AI Vision', icon: '🔮', desc: 'Detailed AI analysis'         },
            ].map(({ key, label, icon, desc }) => (
              <button
                key={key}
                id={`mode-${key}`}
                onClick={() => { setMode(key); setResult(null); setErrorState(null); }}
                className={`flex flex-col items-center px-8 py-3 rounded-xl transition-all duration-200 text-sm font-semibold
                  ${mode === key
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
              >
                <span className="text-xl mb-0.5">{icon}</span>
                <span>{label}</span>
                <span className={`text-xs font-normal mt-0.5 ${mode === key ? 'text-green-100' : 'text-gray-400'}`}>{desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Upload Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FaCamera className="text-green-500" /> {t('diseaseDetection.uploadTitle')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Drop Zone */}
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
                  <div className="relative rounded-xl overflow-hidden border-2 border-green-300">
                    <img src={previewUrl} alt="Preview" className="w-full h-72 object-contain bg-gray-50" />
                    <button
                      type="button"
                      onClick={handleReset}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow transition"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex flex-col items-center justify-center h-72 border-2 border-dashed border-green-300
                               rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <FaCamera className="text-5xl text-gray-300 mb-3" />
                    <p className="text-gray-600 font-medium">Click or drag &amp; drop image here</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP — up to 10 MB</p>
                  </label>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  id="detect-disease-btn"
                  type="submit"
                  disabled={loading || !selectedImage}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
                             text-white font-bold py-3 px-6 rounded-xl shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" /> {t('diseaseDetection.analyzing')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FaUpload /> {t('diseaseDetection.analyzeBtn')}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition flex items-center gap-2"
                >
                  <FaRedo className="text-sm" /> {t('common.reset')}
                </button>
              </div>
            </form>

            {/* Tips */}
            <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <FaInfoCircle /> Tips for best results
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Take clear, well-lit photos of affected leaves</li>
                <li>Focus closely on the diseased area</li>
                <li>Avoid blurry or dark images</li>
                <li>One leaf per image works best</li>
              </ul>
            </div>
          </motion.div>

          {/* ── Results Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <AnimatePresence mode="wait">

              {/* ── Loading State ── */}
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AnalysingSkeleton />
                </motion.div>

              ) : errorState ? (
                /* ── Error / Quota State ── */
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-2xl border-2 shadow-lg p-6 ${
                    errorState.isQuota
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <h3 className={`text-xl font-bold mb-2 ${errorState.isQuota ? 'text-amber-800' : 'text-red-800'}`}>
                    {errorState.isQuota ? '⚠️ API Quota Reached' : '❌ Analysis Failed'}
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">{errorState.message}</p>
                  {errorState.isQuota && (
                    <div className="bg-amber-100 rounded-xl p-3 text-xs text-amber-900 mb-4">
                      <strong>Why does this happen?</strong> The Gemini AI API has free-tier rate limits.
                      The system automatically tried <strong>6 different model fallbacks</strong> but all are currently rate-limited.
                      Please wait 1–2 minutes and try again.
                    </div>
                  )}
                  <button
                    id="try-again-btn"
                    onClick={() => setErrorState(null)}
                    className="text-sm px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition flex items-center gap-2"
                  >
                    <FaRedo className="text-xs" /> {t('common.back')}
                  </button>
                </motion.div>

              ) : result ? (
                /* ── Results ── */
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="space-y-4"
                >
                  {/* ── Hero Card ── */}
                  <div className={`rounded-2xl border-2 shadow-lg p-5 ${isHealthy
                      ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300'
                      : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
                          {t('diseaseDetection.result.disease')}
                        </p>
                        <h2 className={`text-2xl font-extrabold leading-tight ${isHealthy ? 'text-emerald-700' : 'text-red-700'}`}>
                          {result.disease || 'Unknown'}
                        </h2>
                        {/* Affected Plant */}
                        {plantDisplay && (
                          <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                            <FaLeaf className="text-green-400 flex-shrink-0" />
                            Affected Plant: <span className="font-semibold text-gray-700">{plantDisplay}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleReadAloud}
                        title="Read aloud"
                        className="text-sm bg-white border border-gray-200 text-gray-600 hover:bg-green-50 px-3 py-1.5 rounded-full shadow-sm transition flex items-center gap-1 flex-shrink-0"
                      >
                        🔊 Read
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Severity Badge */}
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1.5">{t('diseaseDetection.result.severity')}</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${severityMeta.color}`}>
                          {severityMeta.icon} {severityMeta.label}
                        </span>
                      </div>
                      {/* Source Badge */}
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1.5">Detection Source</p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                          {result.source === 'gemini' ? '🔮 Gemini AI' : '🧠 CNN Model'}
                        </span>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    {result.confidence != null && (
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <ConfidenceBar value={result.confidence} />
                      </div>
                    )}
                  </div>

                  {/* ── Farmer Advice (prominent) ── */}
                  {result.farmer_advice && (
                    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 shadow p-5">
                      <h4 className="flex items-center gap-2 font-bold text-amber-800 mb-2">
                        <FaHandHoldingHeart className="text-amber-600" /> Farmer-Friendly Advice
                      </h4>
                      <p className="text-amber-900 text-sm leading-relaxed">{result.farmer_advice}</p>
                    </div>
                  )}

                  {/* ── Cause ── */}
                  {result.cause && (
                    <Section icon={FaMicroscope} iconColor="text-purple-500" title={t('diseaseDetection.result.cause')}>
                      <p className="text-sm text-gray-700 leading-relaxed">{result.cause}</p>
                    </Section>
                  )}

                  {/* ── Symptoms ── */}
                  {result.symptoms_observed && (
                    <Section icon={FaInfoCircle} iconColor="text-blue-500" title={t('diseaseDetection.result.symptoms')}>
                      <p className="text-sm text-gray-700 leading-relaxed">{result.symptoms_observed}</p>
                    </Section>
                  )}

                  {/* ── Precautions ── */}
                  {result.immediate_precautions?.length > 0 && (
                    <Section icon={FaExclamationTriangle} iconColor="text-orange-500" title={t('diseaseDetection.result.precautions')}>
                      <BulletList items={result.immediate_precautions} />
                    </Section>
                  )}

                  {/* ── Treatment ── */}
                  {result.treatment?.length > 0 && (
                    <Section icon={FaCheckCircle} iconColor="text-green-600" title={t('diseaseDetection.result.treatment')}>
                      <BulletList items={result.treatment} />
                    </Section>
                  )}

                  {/* ── Organic & Chemical Solutions side-by-side ── */}
                  {(result.organic_solutions?.length > 0 || result.chemical_solutions?.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Section icon={FaSeedling} iconColor="text-green-600" title={t('diseaseDetection.result.organic')}>
                        <BulletList items={result.organic_solutions} emptyMsg="None listed" />
                      </Section>
                      <Section icon={FaFlask} iconColor="text-red-500" title={t('diseaseDetection.result.chemical')}>
                        <BulletList items={result.chemical_solutions} emptyMsg="None listed" />
                      </Section>
                    </div>
                  )}

                  {/* ── Prevention ── */}
                  {result.prevention_methods?.length > 0 && (
                    <Section icon={FaShieldAlt} iconColor="text-indigo-500" title={t('diseaseDetection.result.prevention')}>
                      <BulletList items={result.prevention_methods} />
                    </Section>
                  )}

                  {/* ── Recovery Outlook ── */}
                  {result.recovery_outlook && (
                    <Section icon={FaLightbulb} iconColor="text-yellow-500" title={t('diseaseDetection.result.recovery')}>
                      <p className="text-sm text-gray-700 leading-relaxed">{result.recovery_outlook}</p>
                    </Section>
                  )}

                  {/* ── Full AI Response (collapsed) ── */}
                  {result.ai_advice && (
                    <details className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <summary className="cursor-pointer font-semibold text-gray-700 select-none flex items-center gap-2">
                        <FaStar className="text-yellow-400 text-sm" />
                        {t('diseaseDetection.result.aiAnalysis')}
                      </summary>
                      <pre className="mt-3 text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
                        {result.ai_advice}
                      </pre>
                    </details>
                  )}
                </motion.div>

              ) : (
                /* ── Empty placeholder ── */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow border border-gray-100 flex flex-col items-center justify-center min-h-[440px] text-center p-8"
                >
                  <FaLeaf className="text-7xl text-gray-200 mb-4" />
                  <p className="text-gray-400 text-lg font-medium">{t('diseaseDetection.empty')}</p>
                  <p className="text-gray-300 text-sm mt-1">AI will detect diseases and provide treatment advice</p>
                  {mode === 'ai' && (
                    <div className="mt-4 text-xs text-gray-300 bg-gray-50 rounded-xl px-4 py-2">
                      🔮 Using Gemini AI with 6-model fallback chain
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Common Diseases Reference ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white rounded-2xl shadow border border-yellow-100 p-6"
        >
          <h3 className="text-xl font-bold text-yellow-900 mb-5 flex items-center gap-2">
            <FaInfoCircle className="text-yellow-500" /> Commonly Detected Diseases
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { emoji: '🥒', name: 'Cucumber', diseases: ['Angular Leaf Spot', 'Powdery Mildew', 'Downy Mildew', 'Anthracnose'] },
              { emoji: '🍅', name: 'Tomato',   diseases: ['Early Blight', 'Late Blight', 'Bacterial Spot', 'Leaf Mold'] },
              { emoji: '🌾', name: 'Rice',     diseases: ['Leaf Blast', 'Brown Spot', 'Neck Blast', 'Bacterial Blight'] },
            ].map(({ emoji, name, diseases }) => (
              <div key={name} className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                <p className="font-semibold text-gray-900 mb-2">{emoji} {name} Diseases</p>
                <ul className="text-gray-700 space-y-1 text-sm">
                  {diseases.map((d) => <li key={d}>• {d}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
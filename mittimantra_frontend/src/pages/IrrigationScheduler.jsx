import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaTint, FaInfoCircle, FaClock, FaWater, FaThermometerHalf,
  FaWind, FaLeaf, FaExclamationTriangle, FaCalendarAlt, FaFlask
} from 'react-icons/fa';
import { WiHumidity, WiRain } from 'react-icons/wi';
import { apiService } from '../services/api';

/* ─── tiny markdown renderer (bold + headers only) ─── */
const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (/^###\s/.test(line)) return <h3 key={i} className="text-base font-bold text-green-800 mt-4 mb-1">{line.replace(/^###\s/, '')}</h3>;
    if (/^##\s/.test(line))  return <h2 key={i} className="text-lg font-bold text-green-900 mt-5 mb-2">{line.replace(/^##\s/, '')}</h2>;
    if (/^\|\s/.test(line))  return <p key={i} className="font-mono text-xs text-gray-700 leading-5">{line}</p>;
    const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return (
      <p key={i} className="text-sm text-gray-700 leading-6"
        dangerouslySetInnerHTML={{ __html: boldLine || '&nbsp;' }} />
    );
  });
};

const conditionEmoji = (cond = '') => {
  const c = cond.toLowerCase();
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) return '🌧️';
  if (c.includes('thunder') || c.includes('storm')) return '⛈️';
  if (c.includes('cloud')) return '⛅';
  if (c.includes('clear') || c.includes('sunny')) return '☀️';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return '🌫️';
  if (c.includes('snow')) return '❄️';
  return '🌤️';
};

const IrrigationScheduler = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [formData, setFormData] = useState({
    location: '',
    crop: '',
    irrigation_method: 'Drip',
    soil_type: '',
    rainfall_pattern: '',
  });

  const irrigationMethods = [
    { value: 'Drip',      label: '💧 Drip',      desc: 'Water-efficient' },
    { value: 'Sprinkler', label: '🌀 Sprinkler',  desc: 'Wide coverage' },
    { value: 'Flood',     label: '🌊 Flood',      desc: 'Traditional' },
    { value: 'Not Sure',  label: '❓ Not Sure',   desc: 'AI will decide' },
  ];

  const commonCrops = [
    'Rice','Wheat','Maize','Cotton','Tomato','Potato','Sugarcane',
    'Soybean','Chickpea','Mustard','Onion','Groundnut','Sunflower','Barley',
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.trim() || formData.location.trim().length < 3) {
      toast.error('Please enter a valid location'); return;
    }
    if (!formData.crop.trim() || formData.crop.trim().length < 2) {
      toast.error('Please enter a crop name'); return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        location:          formData.location,
        crop:              formData.crop,
        irrigation_method: formData.irrigation_method,
        soil_type:         formData.soil_type || null,
        rainfall_pattern:  formData.rainfall_pattern || null,
        language:          'en',
      };
      const response = await apiService.getIrrigationSchedule(payload);
      setResult(response);
      toast.success('Irrigation plan generated!');
    } catch (err) {
      console.error('Irrigation error:', err);
      toast.error(err.response?.data?.detail || 'Failed to get irrigation schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ location:'', crop:'', irrigation_method:'Drip', soil_type:'', rainfall_pattern:'' });
    setResult(null);
  };

  const weather = result?.weather;
  const soil    = result?.soil;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl shadow-lg">
              <FaTint className="text-4xl text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Smart Irrigation Advisor</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Real-time weather + soil intelligence + AI reasoning for your farm
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── INPUT FORM (2/5) ── */}
          <motion.div
            initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <FaLeaf className="text-green-500" /> Irrigation Help
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    📍 Location (State / District) *
                  </label>
                  <input
                    type="text" name="location" value={formData.location} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    placeholder="e.g., Ludhiana, Punjab" required
                  />
                  <p className="text-xs text-gray-400 mt-1">AI fetches live weather for this location</p>
                </div>

                {/* Crop */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">🌾 Crop *</label>
                  <input
                    type="text" name="crop" value={formData.crop} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    placeholder="e.g., Wheat, Rice, Cotton" list="crop-suggestions" required
                  />
                  <datalist id="crop-suggestions">
                    {commonCrops.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* Irrigation Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💧 Preferred Irrigation Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {irrigationMethods.map(m => (
                      <button
                        key={m.value} type="button"
                        onClick={() => setFormData({ ...formData, irrigation_method: m.value })}
                        className={`p-3 rounded-xl border-2 text-left transition-all text-sm ${
                          formData.irrigation_method === m.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white hover:border-blue-300 text-gray-600'
                        }`}
                      >
                        <div className="font-semibold">{m.label}</div>
                        <div className="text-xs opacity-70">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Soil Type (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    🪨 Soil Type <span className="font-normal text-gray-400">(Optional)</span>
                  </label>
                  <select
                    name="soil_type" value={formData.soil_type} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  >
                    <option value="">Auto-detect from SoilGrids API</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Black">Black</option>
                    <option value="Red">Red</option>
                    <option value="Alluvial">Alluvial</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Leave blank to auto-detect using satellite soil data</p>
                </div>

                {/* Rainfall Pattern (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    🌧️ Rainfall Pattern <span className="font-normal text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text" name="rainfall_pattern" value={formData.rainfall_pattern} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    placeholder="e.g., Heavy monsoon, Moderate, Low"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit" disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Fetching data…
                      </span>
                    ) : '🌿 Get Irrigation Plan'}
                  </button>
                  <button
                    type="button" onClick={handleReset}
                    className="px-5 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:border-gray-400 transition font-semibold"
                  >
                    Reset
                  </button>
                </div>
              </form>

              {/* Info note */}
              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                <strong>What happens when you submit:</strong>
                <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                  <li>Location geocoded to latitude/longitude</li>
                  <li>Live weather + 7-day forecast fetched</li>
                  <li>Soil type &amp; chemistry auto-detected</li>
                  <li>AI generates a data-driven irrigation plan</li>
                </ol>
              </div>
            </div>
          </motion.div>

          {/* ── RESULTS PANEL (3/5) ── */}
          <motion.div
            initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }}
            className="lg:col-span-3 space-y-5"
          >
            {/* Loading State */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                  className="bg-white rounded-2xl shadow-lg border border-blue-100 p-10 text-center"
                >
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                      <FaTint className="absolute inset-0 m-auto text-blue-500 text-xl" />
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-700">Analysing your farm…</p>
                  <div className="mt-4 space-y-1 text-sm text-gray-400">
                    <p>🌍 Geocoding location</p>
                    <p>⛅ Fetching live weather + 7-day forecast</p>
                    <p>🪨 Detecting soil type via satellite data</p>
                    <p>🤖 AI building your irrigation plan</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!loading && !result && (
              <div className="bg-white rounded-2xl shadow border border-gray-100 flex flex-col items-center justify-center min-h-[400px] p-10 text-center text-gray-400">
                <FaTint className="text-7xl mb-4 text-blue-200" />
                <p className="text-lg font-semibold">Fill the form to get your irrigation plan</p>
                <p className="text-sm mt-1">AI will use live weather + soil data for your location</p>
              </div>
            )}

            {/* ── Results ── */}
            <AnimatePresence>
              {!loading && result && (
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="space-y-5">

                  {/* ── Weather Summary Card ── */}
                  {weather && (
                    <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-2xl shadow-lg p-5">
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <span className="text-2xl">{conditionEmoji(weather.condition)}</span>
                        Live Weather — {result.location}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                          <FaThermometerHalf className="mx-auto mb-1 text-orange-200" />
                          <p className="text-2xl font-bold">{weather.temperature ?? '—'}°C</p>
                          <p className="text-xs opacity-80">Temperature</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                          <FaTint className="mx-auto mb-1 text-blue-200" />
                          <p className="text-2xl font-bold">{weather.humidity ?? '—'}%</p>
                          <p className="text-xs opacity-80">Humidity</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                          <span className="text-xl block mb-1">🌧️</span>
                          <p className="text-2xl font-bold">{weather.rainfall_today_mm ?? 0} mm</p>
                          <p className="text-xs opacity-80">Rain Today</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                          <FaWind className="mx-auto mb-1 text-gray-200" />
                          <p className="text-2xl font-bold">{weather.wind_speed ?? '—'} m/s</p>
                          <p className="text-xs opacity-80">Wind</p>
                        </div>
                      </div>

                      {/* 7-Day forecast strip */}
                      {weather.forecast_days?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-2">7-Day Forecast</p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {weather.forecast_days.map((day, i) => (
                              <div key={i} className="bg-white/20 rounded-xl px-3 py-2 text-center min-w-[80px] flex-shrink-0">
                                <p className="text-xs opacity-80">{new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric' })}</p>
                                <p className="text-xl my-1">{conditionEmoji(day.condition)}</p>
                                <p className="text-xs font-bold">{day.rain_mm > 0 ? `${day.rain_mm}mm` : 'Dry'}</p>
                                <p className="text-xs opacity-70">{day.temp_max}° / {day.temp_min}°</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Soil Intelligence Card ── */}
                  {soil && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5">
                      <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                        <FaFlask className="text-amber-600" /> Soil Intelligence
                        <span className="ml-auto text-xs font-normal bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                          {soil.source === 'SoilGrids API' ? '📡 SoilGrids' : soil.source === 'user_provided' ? '👤 User input' : '🔄 Fallback'}
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Soil Type</p>
                          <p className="font-bold text-amber-800 text-sm">{soil.type}</p>
                        </div>
                        {soil.ph != null && (
                          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">pH Level</p>
                            <p className="font-bold text-amber-800 text-lg">{soil.ph}</p>
                          </div>
                        )}
                        {soil.nitrogen != null && (
                          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Nitrogen (N)</p>
                            <p className="font-bold text-green-700 text-lg">{soil.nitrogen} <span className="text-xs">cg/kg</span></p>
                          </div>
                        )}
                        {soil.organic_carbon != null && (
                          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Organic Carbon</p>
                            <p className="font-bold text-amber-700 text-lg">{soil.organic_carbon} <span className="text-xs">dg/kg</span></p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── AI Irrigation Plan ── */}
                  {result.irrigation_plan && (
                    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-xl text-green-900 flex items-center gap-2">
                          <span>🤖</span> AI Irrigation Plan
                          <span className="text-sm font-normal text-gray-500">— {result.crop} · {result.location}</span>
                        </h3>
                        <button
                          onClick={() => {
                            const utterance = new SpeechSynthesisUtterance(result.irrigation_plan);
                            window.speechSynthesis.speak(utterance);
                          }}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition"
                        >
                          🔊 Read Aloud
                        </button>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-700 space-y-1">
                        {renderMarkdown(result.irrigation_plan)}
                      </div>
                      {result.fallback && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                          ⚠️ Live data was unavailable. This is a rule-based fallback response.
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── Best Practices Footer ── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          className="mt-10 bg-white rounded-2xl shadow border border-green-100 p-6"
        >
          <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
            <FaInfoCircle className="text-green-500" /> Irrigation Best Practices
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              { emoji:'⏰', title:'Best Time', desc:'5–7 AM or 6–8 PM to minimize evaporation' },
              { emoji:'💧', title:'Drip Irrigation', desc:'Saves up to 60% water vs. flood — ideal for most crops' },
              { emoji:'🌱', title:'Mulching', desc:'Apply organic mulch to retain soil moisture' },
              { emoji:'📊', title:'Monitor Daily', desc:'Finger test or moisture meter before irrigating' },
              { emoji:'🌤️', title:'Check Forecast', desc:'Skip irrigation if rain is expected in 24–48 hrs' },
              { emoji:'⚠️', title:'Avoid Overwatering', desc:'Excess water causes root diseases and nutrient loss' },
            ].map((p, i) => (
              <div key={i} className="bg-green-50 rounded-xl p-4">
                <p className="font-semibold text-green-900 mb-1">{p.emoji} {p.title}</p>
                <p className="text-green-800">{p.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default IrrigationScheduler;
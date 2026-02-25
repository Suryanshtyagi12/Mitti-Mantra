import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaLeaf, FaMapMarkerAlt, FaCalendarAlt, FaSeedling, FaWater, FaExclamationTriangle } from 'react-icons/fa';
import { apiService } from '../services/api';
import { toast } from 'react-toastify';

const TrackFarming = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [adviceLoading, setAdviceLoading] = useState(null); // ID of record loading advice

    // New Record Form State
    const [formData, setFormData] = useState({
        crop_name: '',
        location: '',
        soil_type: '',
        fertilizer: '',
        planting_date: ''
    });

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const data = await apiService.getFarmingRecords();
            setRecords(data);
        } catch (error) {
            console.error("Error fetching records:", error);
            toast.error("Failed to load farming records.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiService.createFarmingRecord({
                ...formData,
                language: 'en' // Default for now
            });
            toast.success("Crop added successfully!");
            setShowAddForm(false);
            setFormData({
                crop_name: '',
                location: '',
                soil_type: '',
                fertilizer: '',
                planting_date: ''
            });
            fetchRecords();
        } catch (error) {
            console.error("Error adding crop:", error);
            toast.error("Failed to add crop.");
        }
    };

    const getAdvice = async (record) => {
        setAdviceLoading(record.id);
        try {
            const data = await apiService.getFarmingAdvice(record.id);
            // Check if we already have this advice in a local state or just show toast/modal?
            // For now, let's update the record in the list with the new advice if backend returns it?
            // Or simplified: show advice in a modal/expandable section.

            // Backend returns { record: ..., weather: ..., advice: ... }
            // Let's store the latest advice in a temporary state or update the record's 'latest_advice' field locally?

            // Better: Update records state to show the new advice
            setRecords(prev => prev.map(r => r.id === record.id ? { ...r, _tempAdvice: data.advice, _weather: data.weather } : r));

        } catch (error) {
            console.error("Error getting advice:", error);
            toast.error("Failed to get advice.");
        } finally {
            setAdviceLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6 pt-24">
            <div className="container mx-auto max-w-5xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">My Farms</h1>
                        <p className="text-gray-600">Track your crops and get daily AI advice</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
                    >
                        <FaPlus /> Add Crop
                    </button>
                </div>

                {/* Add Form */}
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white rounded-xl shadow-md p-6 mb-8 overflow-hidden"
                        >
                            <h2 className="text-xl font-bold mb-4">Add New Crop Details</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Crop Name</label>
                                    <select
                                        name="crop_name"
                                        value={formData.crop_name}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 p-2"
                                    >
                                        <option value="">Select Crop</option>
                                        <option value="Wheat">Wheat</option>
                                        <option value="Rice">Rice</option>
                                        <option value="Maize">Maize</option>
                                        <option value="Cotton">Cotton</option>
                                        <option value="Tomato">Tomato</option>
                                        <option value="Potato">Potato</option>
                                        {/* Add more as needed */}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. Punjab, India"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Soil Type</label>
                                    <select
                                        name="soil_type"
                                        value={formData.soil_type}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 p-2"
                                    >
                                        <option value="">Select Soil</option>
                                        <option value="Alluvial">Alluvial</option>
                                        <option value="Black">Black</option>
                                        <option value="Red">Red</option>
                                        <option value="Clay">Clay</option>
                                        <option value="Sandy">Sandy</option>
                                        <option value="Loamy">Loamy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Planting Date</label>
                                    <input
                                        type="date"
                                        name="planting_date"
                                        value={formData.planting_date}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fertilizer Used</label>
                                    <input
                                        type="text"
                                        name="fertilizer"
                                        value={formData.fertilizer}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Urea, DAP"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-50 p-2"
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Save Farm
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Records Grid */}
                {loading ? (
                    <div className="text-center py-12">Loading farms...</div>
                ) : records.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <FaSeedling className="mx-auto text-4xl text-green-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No crops tracked yet</h3>
                        <p className="text-gray-500">Add your first crop to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {records.map((record) => (
                            <motion.div
                                key={record.id}
                                layout
                                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                <FaLeaf className="text-green-500" /> {record.crop_name}
                                            </h3>
                                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <FaMapMarkerAlt /> {record.location}
                                            </div>
                                        </div>
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                            Active
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="block text-gray-500 text-xs">Planted</span>
                                            <span className="font-medium">
                                                {new Date(record.planting_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="block text-gray-500 text-xs">Soil</span>
                                            <span className="font-medium">{record.soil_type}</span>
                                        </div>
                                    </div>

                                    {/* Advice Section */}
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-semibold text-gray-700">Daily Advisory</h4>
                                            <button
                                                onClick={() => getAdvice(record)}
                                                disabled={adviceLoading === record.id}
                                                className="text-sm text-green-600 font-medium hover:text-green-700 disabled:opacity-50"
                                            >
                                                {adviceLoading === record.id ? "Analyzing..." : "Refresh Advice"}
                                            </button>
                                        </div>

                                        {record._tempAdvice ? (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-gray-700 whitespace-pre-line">
                                                {record._tempAdvice}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-500 text-center italic">
                                                Click 'Refresh Advice' to get today's plan.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackFarming;

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaPaperPlane, FaTimes, FaRobot, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { apiService } from '../services/api';
import { toast } from 'react-toastify';

const VoiceAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Namaste! I am MittiMantra, your farming assistant. How can I help you today?', options: ['Crop Advice', 'Disease Detection', 'Market Prices'] }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [language, setLanguage] = useState('en'); // 'en' or 'hi'

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                handleSend(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                toast.error('Could not hear you. Please try again.');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            console.warn('Speech Recognition not supported in this browser.');
        }
    }, [language]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Handle Text to Speech
    const speak = (text) => {
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        // Attempt to select a better voice
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes(language === 'hi' ? 'hi' : 'en'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // Toggle listening
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            if (recognitionRef.current) {
                stopSpeaking(); // Stop speaking when starting to listen
                recognitionRef.current.start();
                setIsListening(true);
            } else {
                toast.warning('Voice input not supported in this browser.');
            }
        }
    };

    // Send message
    const handleSend = async (text = inputValue) => {
        if (!text.trim()) return;

        // Add user message
        const newMessages = [...messages, { type: 'user', text }];
        setMessages(newMessages);
        setInputValue('');

        try {
            // Call API
            const response = await apiService.smartTalk(text, language);

            // Add bot response
            const botMessage = {
                type: 'bot',
                text: response.answer,
                options: response.options
            };

            setMessages(prev => [...prev, botMessage]);
            speak(response.answer);

        } catch (error) {
            console.error('Bot Error:', error);
            setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I am having trouble connecting right now.' }]);
            speak('Sorry, I am having trouble connecting right now.');
        }
    };

    const handleOptionClick = (option) => {
        handleSend(option);
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg ${isOpen ? 'bg-red-500' : 'bg-green-600'} text-white hover:scale-110 transition-transform`}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {isOpen ? <FaTimes size={24} /> : <FaRobot size={24} />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[600px]"
                    >
                        {/* Header */}
                        <div className="bg-green-600 p-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FaRobot />
                                <span className="font-bold">MittiMantra Assistant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
                                    className="text-xs bg-white text-green-700 px-2 py-1 rounded font-bold uppercase"
                                >
                                    {language}
                                </button>
                                <button onClick={isSpeaking ? stopSpeaking : () => { }} className="hover:text-gray-200">
                                    {isSpeaking ? <FaVolumeUp className="animate-pulse" /> : <FaVolumeMute />}
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.type === 'user'
                                                ? 'bg-green-600 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>

                                    {/* Options chips */}
                                    {msg.type === 'bot' && msg.options && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleOptionClick(opt)}
                                                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full hover:bg-green-100 transition-colors"
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t bg-white flex items-center gap-2">
                            <button
                                onClick={toggleListening}
                                className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <FaMicrophone />
                            </button>

                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isListening ? "Listening..." : "Type or speak..."}
                                className="flex-1 border-0 focus:ring-0 text-sm bg-transparent"
                            />

                            <button
                                onClick={() => handleSend()}
                                disabled={!inputValue.trim()}
                                className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VoiceAssistant;

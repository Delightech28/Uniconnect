import React, { useState } from 'react';
import { Play, Volume2, Users, Clock, Globe, Radio } from 'lucide-react';

/**
 * PodcastConfig component for podcast settings
 */
const PodcastConfig = ({ 
  topics, 
  onStart,
  onBack,
  isDarkMode 
}) => {
  const [hostName, setHostName] = useState('');
  const [tone, setTone] = useState('FRIENDLY');
  const [speakers, setSpeakers] = useState('SINGLE');
  const [accent, setAccent] = useState('en-US');
  const [duration, setDuration] = useState(10);

  const tones = [
    { value: 'FUNNY', label: '😄 Funny', description: 'Lighthearted and humorous' },
    { value: 'PROFESSIONAL', label: '💼 Professional', description: 'Formal and expert' },
    { value: 'TEACHER', label: '👨‍🏫 Teacher', description: 'Educational and clear' },
    { value: 'FRIEND', label: '👋 Friend', description: 'Casual and friendly' },
  ];

  const speakerModes = [
    { value: 'SINGLE', label: '🎙️ Solo', description: 'One presenter' },
    { value: 'DOUBLE', label: '🎙️🎙️ Dual', description: 'Two hosts' },
  ];

  const accents = [
    { value: 'en-US', label: '🇺🇸 US English' },
    { value: 'en-GB', label: '🇬🇧 UK English' },
    { value: 'en-IN', label: '🇮🇳 Indian English' },
    { value: 'fr-FR', label: '🇫🇷 French' },
    { value: 'de-DE', label: '🇩🇪 German' },
    { value: 'es-ES', label: '🇪🇸 Spanish' },
  ];

  const handleStart = () => {
    if (!hostName.trim()) {
      alert('Please enter a host name');
      return;
    }
    
    onStart({
      hostName,
      tone,
      speakers,
      accent,
      duration,
      topics,
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-8 overflow-y-auto transition-colors max-w-4xl mx-auto p-4 md:p-8 bg-white dark:bg-secondary">
      
      {/* Back Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          ← Back
        </button>
        <div /> {/* spacer */}
      </div>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#07bc0c] to-[#07bc0c]/60">
          <Radio className="w-8 h-8 text-white" />
        </div>
        <h1 className={`text-3xl md:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Create Your Podcast
        </h1>
        <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Customize your learning experience as an audio podcast
        </p>
      </div>

      {/* Host Name Input */}
      <div className={`rounded-3xl p-8 border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <label className={`block text-sm font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          📍 Host / Presenter Name
        </label>
        <input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          placeholder="e.g., Alex, Dr. Sarah"
          className={`w-full px-6 py-4 rounded-2xl border-2 text-lg font-semibold outline-none transition-all ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-[#07bc0c]'
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#07bc0c]'
          }`}
        />
      </div>

      {/* Tone Selection */}
      <div className={`rounded-3xl p-8 border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <label className={`block text-sm font-black uppercase tracking-widest mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          🎭 Tone & Style
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tones.map(t => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`p-4 rounded-2xl border-2 text-left transition-all transform hover:scale-105 ${
                tone === t.value
                  ? isDarkMode
                    ? 'border-[#07bc0c] bg-[#07bc0c]/10'
                    : 'border-[#07bc0c] bg-[#07bc0c]/10'
                  : isDarkMode
                    ? 'border-slate-700 hover:border-slate-600'
                    : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.label}</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Speaker Mode */}
      <div className={`rounded-3xl p-8 border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <label className={`block text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <Users className="w-5 h-5" /> Number of Speakers
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {speakerModes.map(m => (
            <button
              key={m.value}
              onClick={() => setSpeakers(m.value)}
              className={`p-6 rounded-2xl border-2 text-center transition-all transform hover:scale-105 ${
                speakers === m.value
                  ? isDarkMode
                    ? 'border-[#07bc0c] bg-[#07bc0c]/10'
                    : 'border-[#07bc0c] bg-[#07bc0c]/10'
                  : isDarkMode
                    ? 'border-slate-700 hover:border-slate-600'
                    : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.label}</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{m.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Selection */}
      <div className={`rounded-3xl p-8 border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <label className={`block text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <Globe className="w-5 h-5" /> Voice Accent
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accents.map(a => (
            <button
              key={a.value}
              onClick={() => setAccent(a.value)}
              className={`p-4 rounded-xl border-2 font-semibold transition-all text-left ${
                accent === a.value
                  ? isDarkMode
                    ? 'border-[#07bc0c] bg-[#07bc0c]/10 text-white'
                    : 'border-[#07bc0c] bg-[#07bc0c]/10 text-slate-900'
                  : isDarkMode
                    ? 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Slider */}
      <div className={`rounded-3xl p-8 border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <label className={`block text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          <Clock className="w-5 h-5" /> Duration
        </label>
        <div className="space-y-4">
          <input
            type="range"
            min="5"
            max="60"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-[#07bc0c]"
            style={{
              background: isDarkMode
                ? `linear-gradient(to right, #07bc0c 0%, #07bc0c ${(duration / 60) * 100}%, #374151 ${(duration / 60) * 100}%, #374151 100%)`
                : `linear-gradient(to right, #07bc0c 0%, #07bc0c ${(duration / 60) * 100}%, #e2e8f0 ${(duration / 60) * 100}%, #e2e8f0 100%)`
            }}
          />
          <div className="flex items-center justify-between">
            <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {duration} minutes
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>
              Estimated length of your podcast
            </p>
          </div>
        </div>
      </div>

      {/* Topics Display */}
      <div className={`rounded-3xl p-8 border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <p className={`text-sm font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          📚 Topics to Cover
        </p>
        <div className="flex flex-wrap gap-2">
          {topics.map(topic => (
            <span
              key={topic}
              className={`px-4 py-2 rounded-full font-bold text-sm ${
                isDarkMode
                  ? 'bg-[#07bc0c]/20 text-[#07bc0c]'
                  : 'bg-[#07bc0c]/10 text-[#07bc0c]'
              }`}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!hostName.trim()}
        className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-8 ${
          hostName.trim()
            ? isDarkMode
              ? 'bg-gradient-to-r from-[#07bc0c] to-[#07bc0c]/80 text-slate-900 shadow-xl shadow-[#07bc0c]/20'
              : 'bg-gradient-to-r from-[#07bc0c] to-[#07bc0c]/80 text-white shadow-xl shadow-[#07bc0c]/20'
            : isDarkMode
              ? 'bg-slate-800 text-slate-600'
              : 'bg-slate-200 text-slate-400'
        }`}
      >
        <Play className="w-6 h-6" /> Generate Podcast
      </button>
    </div>
  );
};

export default PodcastConfig;




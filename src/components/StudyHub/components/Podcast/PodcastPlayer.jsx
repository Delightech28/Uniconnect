import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Maximize2, Download, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Footer from './Footer';

/**
 * Creates a WAV file from base64 audio data
 * @param {string} base64Audio - Base64 encoded audio data
 * @returns {Blob} WAV blob
 */
const createWavFile = (base64Audio) => {
  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'audio/wav' });
};

/**
 * PodcastPlayer component
 */
const PodcastPlayer = ({ 
  audioData, 
  transcript,
  onExit,
  isDarkMode 
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [activeSegment, setActiveSegment] = useState(0);
  const [expandedSegment, setExpandedSegment] = useState(null);
  const [showTranscript, setShowTranscript] = useState(true);

  // Create audio URL from base64
  useEffect(() => {
    if (audioData && audioRef.current) {
      try {
        const wavBlob = createWavFile(audioData);
        const audioUrl = URL.createObjectURL(wavBlob);
        audioRef.current.src = audioUrl;
        return () => URL.revokeObjectURL(audioUrl);
      } catch (err) {
        console.error('Failed to create audio:', err);
      }
    }
  }, [audioData]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      
      // Update active segment based on time
      if (transcript) {
        const activeIdx = transcript.findIndex((seg, i) => {
          const nextSeg = transcript[i + 1];
          return currentTime >= seg.startTime && (!nextSeg || currentTime < nextSeg.startTime);
        });
        if (activeIdx !== -1) setActiveSegment(activeIdx);
      }
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percent * duration;
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const currentIdx = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const downloadAudio = () => {
    if (audioData) {
      const wavBlob = createWavFile(audioData);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'podcast.wav';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col transition-colors bg-white dark:bg-secondary">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header with Exit Button */}
      <div className={`border-b transition-colors p-4 flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Podcast Player</h2>
        <button
          onClick={onExit}
          className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Exit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-white dark:bg-secondary">
        
        {/* Player Controls */}
        <div className={`rounded-[2.5rem] p-8 border shadow-lg transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          
          {/* Play Button & Timer */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handlePlayPause}
              className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl transition-all transform hover:scale-110 ${
                isPlaying
                  ? isDarkMode
                    ? 'bg-[#07bc0c] text-slate-900 shadow-xl shadow-[#07bc0c]/30'
                    : 'bg-[#07bc0c] text-white shadow-xl shadow-[#07bc0c]/30'
                  : isDarkMode
                    ? 'bg-slate-800 text-[#07bc0c] border-2 border-slate-700'
                    : 'bg-slate-100 text-[#07bc0c] border-2 border-slate-200'
              }`}
            >
              {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
            </button>
            
            <div className="text-center">
              <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Playing at {speed.toFixed(1)}x
              </p>
            </div>

            <button
              onClick={handleReset}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-400 hover:text-slate-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-8 h-8" />
            </button>
          </div>

          {/* Progress Bar */}
          <div 
            onClick={handleSeek}
            className={`w-full h-2 rounded-full cursor-pointer mb-6 transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'}`}
          >
            <div
              className="h-full bg-[#07bc0c] rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={cycleSpeed}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⏱️ {speed.toFixed(1)}x
            </button>
            <button
              onClick={downloadAudio}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                showTranscript
                  ? isDarkMode
                    ? 'bg-[#07bc0c]/20 text-[#07bc0c]'
                    : 'bg-[#07bc0c]/10 text-[#07bc0c]'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📄 Transcript
            </button>
          </div>
        </div>

        {/* Transcript */}
        {showTranscript && transcript && (
          <div className="space-y-3">
            {transcript.map((segment, idx) => {
              const isActive = idx === activeSegment;
              const isExpanded = expandedSegment === idx;
              
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer transform ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[#07bc0c]/10 border-[#07bc0c]/30 scale-105'
                        : 'bg-[#07bc0c]/5 border-[#07bc0c]/20 scale-105'
                      : isDarkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                  onClick={() => {
                    setExpandedSegment(isExpanded ? null : idx);
                    if (audioRef.current) {
                      audioRef.current.currentTime = segment.startTime;
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider shrink-0 mt-1 ${
                      segment.speaker === 'Host'
                        ? isDarkMode
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : isDarkMode
                          ? 'bg-purple-900/30 text-purple-400'
                          : 'bg-purple-50 text-purple-600'
                    }`}>
                      {segment.speaker}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {segment.speaker === 'Host' ? '🎙️' : '📚'} {segment.speaker}
                        </p>
                        <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          {formatTime(segment.startTime)}
                        </p>
                      </div>
                      {(isExpanded || isActive) && (
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {segment.text}
                        </p>
                      )}
                      {!isExpanded && !isActive && (
                        <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {segment.text}
                        </p>
                      )}
                    </div>
                    <button 
                      className={`mt-1 ${isExpanded ? 'text-[#07bc0c]' : isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSegment(isExpanded ? null : idx);
                      }}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastPlayer;




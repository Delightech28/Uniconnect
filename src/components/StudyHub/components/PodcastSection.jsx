import React, { useState, useEffect } from 'react';
import { Play, Pause, Headphones, Download, ChevronDown, Mic2, UserPlus, RotateCcw, RotateCw, Settings2, User, MessageCircle, Share2, Volume2 } from 'lucide-react';
import { generatePodcastContent, speakText, downloadPodcastAsAudio, getVoiceForAccent, detectGenderFromName } from '../services/geminiService';

const PodcastSection = ({ docText, topics, setLoading, setLoadingMessage, isPaused }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);

  // automatically choose first topic when available
  useEffect(() => {
    if (topics && topics.length && !selectedTopic) {
      console.log('[PodcastSection] topics updated, defaulting selectedTopic', topics[0]);
      setSelectedTopic(topics[0]);
    }
  }, [topics]);
  const [hostCount, setHostCount] = useState(1);
  const [duration, setDuration] = useState(3);
  const [hosts, setHosts] = useState([
    { name: 'Alex', accent: 'US', tone: 'PROFESSIONAL' },
    { name: 'Jordan', accent: 'UK', tone: 'FRIENDLY' }
  ]);
  const [activePodcast, setActivePodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);

  const [isPlayLoading, setIsPlayLoading] = useState(false);

  useEffect(() => {
    return () => {
      // Stop speech synthesis when component unmounts
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPlayLoading(false);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && activePodcast?.transcript) {
      // Update current time based on speech position
      const updateTime = setInterval(() => {
        const rate = 150; // approximate words per minute
        const words = activePodcast.transcript.split(/\s+/).length;
        const totalSeconds = (words / rate) * 60;
        // This is approximate since Web Speech API doesn't give exact position
        console.log('[PodcastSection] speaking: ' + activePodcast.topicTitle);
      }, 1000);
      return () => clearInterval(updateTime);
    }
  }, [isPlaying, activePodcast]);

  const areHostsValid = hosts.slice(0, hostCount).every(h => h.name?.trim().length > 0);

  const calculateDurationFromSegments = (segments) => {
    // Estimate duration: average 150 words per minute, 4.5 characters per word
    let totalChars = 0;
    segments.forEach(seg => {
      totalChars += (seg.text || '').length;
    });
    // Rough estimate: 600 chars = 1 minute at normal speech rate
    const baseSeconds = (totalChars / 600) * 60;
    return Math.round(baseSeconds);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const createPodcast = async () => {
    console.log('[PodcastSection] createPodcast', { selectedTopic, hostCount, duration, hosts });
    if (!selectedTopic) return;
    setLoading(true);
    const topic = selectedTopic || (Array.isArray(topics) && topics.length > 0 ? topics[0] : null);
    try {
      if (!topic) {
        throw new Error('Please select a topic before generating the podcast.');
      }
      setLoadingMessage('Generating podcast content...');
      
      // Prepare hosts with default names if empty
      const hostsWithDefaults = hosts.slice(0, hostCount).map((h, idx) => ({
        ...h,
        name: h.name?.trim() || (idx === 0 ? 'Alex' : 'Jordan'),
        index: idx
      }));
      
      const result = await generatePodcastContent(docText, {
        tone: hosts[0]?.tone || 'TEACHER',
        durationMinutes: duration,
        selectedTopics: [topic],
        hosts: hostsWithDefaults
      });
      
      console.log('[PodcastSection] Podcast content generated:', result);
      
      // Build transcript from segments with speaker names
      const transcript = result.segments && result.segments.length > 0 
        ? result.segments.map(seg => {
            let speaker = seg.speaker || 'Host';
            if (speaker.toLowerCase().includes('all') || speaker.toLowerCase().includes('hosts')) {
              speaker = 'All Hosts';
            }
            return `[${speaker}]\n${seg.text}`;
          }).join('\n\n')
        : 'No content available';
      
      console.log('[PodcastSection] Segments count:', result.segments?.length, 'Transcript length:', transcript.length);
      
      setActivePodcast({ 
        id: Date.now().toString(), 
        topicTitle: topic, 
        title: result.title || `Study Podcast: ${topic}`, 
        audioUrl: result.audio || '', 
        transcript: transcript,
        timestamp: Date.now(), 
        hosts: hostsWithDefaults,
        segments: result.segments || []
      });
      
      // Calculate and set total duration
      const podcastDuration = calculateDurationFromSegments(result.segments || []);
      setTotalDuration(podcastDuration);
      setCurrentTime(0);
      setPlaybackSpeed(1.0);
      
      console.log('[PodcastSection] Podcast activated successfully, duration:', podcastDuration, 'seconds');
    } catch (e) {
      console.error('[PodcastSection] Error generating podcast:', e);
      alert("Failed to generate podcast: " + (e.message || "Unknown error"));
    } finally { 
      setLoading(false); 
    }
  };

  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [segmentIndex, setSegmentIndex] = useState(0);

  const getVoiceForHostName = (hostName, excludeVoiceName = null) => {
    if (!hostName || !activePodcast?.hosts) return null;
    
    // Find host by name from the hosts array
    const host = activePodcast.hosts.find(h => h.name?.toLowerCase() === hostName.toLowerCase());
    if (!host) {
      // Try partial match
      const matchedHost = activePodcast.hosts.find(h => hostName.toLowerCase().includes(h.name?.toLowerCase() || ''));
      if (matchedHost) return getVoiceForHostName(matchedHost.name, excludeVoiceName);
      return null;
    }
    
    const voices = window.speechSynthesis.getVoices();
    const accentMap = { 'US': 'en-US', 'UK': 'en-GB', 'NG': 'en-NG' };
    const targetLang = accentMap[host.accent] || 'en-US';
    
    // Detect gender from host name using the imported function
    const gender = detectGenderFromName(hostName);
    console.log('[getVoiceForHostName] Host:', hostName, 'Detected gender:', gender, 'Accent:', host.accent);
    
    // Expanded gender keywords for better voice matching
    const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'victoria', 'eva', 'samantha', 'olivia', 'amy', 'anna', 'sophia', 'hazel', 'julia', 'lily', 'mia', 'isabella', 'elena', 'fatima', 'grace', 'hailey', 'heather', 'irene', 'kate', 'linda', 'marisa', 'nora', 'paula', 'rose', 'sara', 'tina', 'ursula'];
    const maleKeywords = ['male', 'man', 'boy', 'david', 'james', 'john', 'mark', 'paul', 'tom', 'chris', 'daniel', 'michael', 'richard', 'steve', 'benjamin', 'arthur', 'ethan', 'henry', 'william', 'oliver', 'lucas', 'matthew', 'andrew', 'robert', 'joseph', 'sam'];
    
    // First, try to find a voice matching both gender and accent
    let voice = voices.find(v => 
      v.lang.startsWith(targetLang.split('-')[0]) && 
      (gender === 'female' ? femaleKeywords.some(k => v.name.toLowerCase().includes(k)) : maleKeywords.some(k => v.name.toLowerCase().includes(k))) &&
      v.name !== excludeVoiceName
    );
    
    // If not found, try gender match with any English accent
    if (!voice) {
      voice = voices.find(v => 
        v.lang?.startsWith('en') && 
        (gender === 'female' ? femaleKeywords.some(k => v.name.toLowerCase().includes(k)) : maleKeywords.some(k => v.name.toLowerCase().includes(k))) &&
        v.name !== excludeVoiceName
      );
    }
    
    // If still not found, try accent match only (fallback to gender-neutral)
    if (!voice) {
      voice = voices.find(v => (v.lang === targetLang || v.lang?.startsWith(targetLang.split('-')[0])) && v.name !== excludeVoiceName);
    }
    
    // Final fallback: any English voice
    if (!voice) {
      voice = voices.find(v => v.lang?.includes('en') && v.name !== excludeVoiceName) || voices[0];
    }
    
    console.log('[getVoiceForHostName] Selected voice:', voice?.name, 'for gender:', gender);
    return voice;
  };

  const playNextSegment = (index) => {
    if (!activePodcast?.segments || index >= activePodcast.segments.length) {
      // Podcast finished
      setIsPlaying(false);
      setIsPlayLoading(false);
      setCurrentSpeaker(null);
      setCurrentTime(totalDuration);
      console.log('[PodcastSection] Podcast playback completed');
      return;
    }
    
    const segment = activePodcast.segments[index];
    let speaker = segment.speaker || 'Host';
    
    // For "All Hosts", alternate through actual host voices based on segment index
    if (speaker.toLowerCase().includes('all') || speaker.toLowerCase().includes('hosts')) {
      const hostIndex = index % (activePodcast.hosts?.length || 1);
      speaker = activePodcast.hosts[hostIndex]?.name || 'Alex';
    }
    
    setCurrentSpeaker(speaker);
    setSegmentIndex(index);
    
    // Estimate segment duration: ~600 chars = 1 minute at normal speech
    const segmentDurationBase = (segment.text.length / 600) * 60;
    const segmentDuration = segmentDurationBase / playbackSpeed;
    
    const utterance = new SpeechSynthesisUtterance(segment.text);
    // Apply playback speed to speech rate (0.9 is base rate)
    utterance.rate = Math.max(0.1, Math.min(10, 0.9 * playbackSpeed));
    // Add small random pitch variation for more natural speech (±0.1)
    utterance.pitch = Math.max(0.8, Math.min(1.2, 1 + (Math.random() * 0.2 - 0.1)));
    utterance.volume = 1;
    
    // Get appropriate voice for this segment's speaker
    // If we have multiple hosts, try to exclude the other host's voice for variety
    let excludeVoiceName = null;
    if (activePodcast.hosts && activePodcast.hosts.length > 1) {
      const otherHost = activePodcast.hosts.find(h => h.name?.toLowerCase() !== speaker.toLowerCase());
      if (otherHost) {
        const otherVoice = getVoiceForHostName(otherHost.name);
        if (otherVoice) excludeVoiceName = otherVoice.name;
      }
    }
    const voice = getVoiceForHostName(speaker, excludeVoiceName);
    if (voice) {
      utterance.voice = voice;
      console.log('[PodcastSection] Playing segment', index, 'with speaker:', speaker, 'speed:', playbackSpeed, 'rate:', utterance.rate, 'pitch:', utterance.pitch.toFixed(2));
    } else {
      console.warn('[PodcastSection] No voice found for speaker:', speaker);
    }
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPlayLoading(false);
      console.log('[PodcastSection] Started segment', index, '/', activePodcast.segments.length, 'Speaker:', speaker, 'Duration:', segmentDuration);
    };
    
    // Track time progress during segment
    let timeUpdateInterval;
    utterance.onend = () => {
      clearInterval(timeUpdateInterval);
      // Update current time to end of this segment
      const currentTimeValue = activePodcast.segments.slice(0, index + 1)
        .reduce((sum, seg) => sum + ((seg.text.length / 600) * 60) / playbackSpeed, 0);
      setCurrentTime(Math.min(currentTimeValue, totalDuration));
      
      console.log('[PodcastSection] Finished segment', index, 'Current time:', currentTimeValue);
      // Play next segment after brief pause
      setTimeout(() => playNextSegment(index + 1), 300);
    };
    
    utterance.onerror = (e) => {
      clearInterval(timeUpdateInterval);
      console.error('[PodcastSection] Speech error on segment', index, ':', e);
      setIsPlaying(false);
      setIsPlayLoading(false);
    };
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const togglePlay = async () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      console.log('[PodcastSection] Playback paused at segment:', segmentIndex);
    } else {
      // Start playing from beginning or from current position
      if (segmentIndex === 0) {
        console.log('[PodcastSection] Starting playback from beginning');
        playNextSegment(0);
      } else {
        console.log('[PodcastSection] Resuming playback from segment:', segmentIndex);
        playNextSegment(segmentIndex);
      }
    }
  };

  const handleSeek = (newValue) => {
    const seekPercent = parseFloat(newValue) / 100;
    const seekTime = seekPercent * totalDuration;
    
    // Find which segment to start from based on seek time
    let cumulativeTime = 0;
    let targetSegmentIndex = 0;
    
    for (let i = 0; i < activePodcast.segments.length; i++) {
      const segmentDuration = (activePodcast.segments[i].text.length / 600) * 60 / playbackSpeed;
      if (cumulativeTime + segmentDuration > seekTime) {
        targetSegmentIndex = i;
        break;
      }
      cumulativeTime += segmentDuration;
    }
    
    setCurrentTime(seekTime);
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    
    console.log('[PodcastSection] Seeking to time:', seekTime, 'segment:', targetSegmentIndex);
  };

  const toneOptions = ['FUNNY', 'PROFESSIONAL', 'TEACHER', 'FRIEND'];
  const accentOptions = ['NG', 'UK', 'US'];

  return (
    <div className="p-4 sm:p-12 max-w-7xl mx-auto h-full flex flex-col space-y-8 mb-24">
      <div className="space-y-1 px-2">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Podcast</h2>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm sm:text-lg">Listen to your curriculum.</p>
      </div>

      {activePodcast ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 sm:gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[40px] sm:rounded-[60px] p-8 sm:p-16 shadow-2xl border border-gray-100 dark:border-zinc-800 flex flex-col justify-center text-center space-y-10">
            <div className="space-y-6">
              <div className={`w-32 h-32 sm:w-48 sm:h-48 bg-[#07bc0c] text-white rounded-[40px] sm:rounded-[50px] flex items-center justify-center mx-auto shadow-2xl shadow-[#07bc0c]/30 ${isPlaying ? 'animate-pulse' : ''}`}>
                <Headphones size={isPlaying ? 60 : 50} className="transition-all" />
              </div>
              <div className="px-4">
                <h3 className="text-xl sm:text-3xl font-bold dark:text-white leading-tight line-clamp-2">{activePodcast.title}</h3>
                <p className="text-[#07bc0c] font-black uppercase tracking-[0.2em] text-[9px] sm:text-xs mt-3">{activePodcast.topicTitle}</p>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8 px-2 sm:px-6">
              {/* Progress bar with time display */}
              <div className="space-y-2">
                <input 
                  type="range" 
                  min="0" 
                  max={totalDuration || 100}
                  value={Math.min(currentTime, totalDuration)} 
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    setCurrentTime(newTime);
                    let cumulativeTime = 0;
                    for (let i = 0; i < (activePodcast.segments || []).length; i++) {
                      const segDuration = (activePodcast.segments[i].text.length / 600) * 60 / playbackSpeed;
                      if (cumulativeTime + segDuration > newTime) {
                        setSegmentIndex(i);
                        break;
                      }
                      cumulativeTime += segDuration;
                    }
                    window.speechSynthesis.cancel();
                    setIsPlaying(false);
                    console.log('[PodcastSection] Seeked to:', newTime, 'seconds');
                  }}
                  className="w-full h-1.5 sm:h-2 bg-gray-100 dark:bg-zinc-800 rounded-full appearance-none accent-[#07bc0c] cursor-pointer" 
                />
                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                  <span>{formatTime(Math.min(currentTime, totalDuration))}</span>
                  <span>{formatTime(totalDuration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); setSegmentIndex(0); setCurrentSpeaker(null); setCurrentTime(0); console.log('[PodcastSection] Podcast reset'); }} className="text-gray-500 dark:text-gray-300 active:text-[#07bc0c] transition-colors" title="Reset"><RotateCcw size={28} /></button>
                <button onClick={togglePlay} className="w-20 h-20 sm:w-24 sm:h-24 bg-[#07bc0c] text-white rounded-[32px] sm:rounded-[40px] flex items-center justify-center shadow-2xl shadow-[#07bc0c]/20 active:scale-90 transition-transform" title={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1.5" />}</button>
                <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); setSegmentIndex(0); setCurrentSpeaker(null); setCurrentTime(0); console.log('[PodcastSection] Podcast stopped'); }} className="text-gray-500 dark:text-gray-300 active:text-[#07bc0c] transition-colors" title="Stop"><RotateCw size={28} /></button>
              </div>

              {/* Speed Control */}
              <div className="flex gap-3 sm:gap-4 relative">
                <div className="flex-1 relative">
                  <button 
                    onClick={() => setShowSpeedDropdown(!showSpeedDropdown)}
                    className="w-full py-3 sm:py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    title="Playback speed"
                  >
                    <Volume2 size={18} /> <span>{playbackSpeed.toFixed(2)}x</span> <ChevronDown size={16} />
                  </button>
                  
                  {showSpeedDropdown && (
                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg z-50 w-full">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            setPlaybackSpeed(speed);
                            setShowSpeedDropdown(false);
                            console.log('[PodcastSection] Playback speed set to:', speed);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-zinc-700 font-semibold text-sm transition-colors flex items-center justify-between ${
                            playbackSpeed === speed 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                              : 'text-gray-800 dark:text-gray-100'
                          } ${speed !== 2.0 ? 'border-b border-gray-200 dark:border-zinc-700' : ''}`}
                        >
                          {speed}x
                          {playbackSpeed === speed && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 relative">
                  <button 
                    onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                    className="w-full py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    title="Download podcast as audio or text"
                  >
                    <Download size={18} /> <span>Download</span> <ChevronDown size={16} />
                  </button>
                  
                  {showDownloadDropdown && (
                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-lg z-50 w-full">
                      <button
                        onClick={() => {
                          console.log('[PodcastSection] User selected: Download Audio with speed:', playbackSpeed);
                          downloadPodcastAsAudio(activePodcast.transcript, `podcast-${activePodcast.topicTitle.replace(/\s+/g, '-')}.wav`, activePodcast.hosts, playbackSpeed);
                          setShowDownloadDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-100 font-semibold text-sm border-b border-gray-200 dark:border-zinc-700 transition-colors flex items-center gap-2"
                      >
                        <Download size={18} className="text-emerald-500" /> Audio (.wav) @ {playbackSpeed}x
                      </button>
                      <button
                        onClick={() => {
                          console.log('[PodcastSection] User selected: Download Text');
                          const textBlob = new Blob([activePodcast.transcript], { type: 'text/plain' });
                          const url = URL.createObjectURL(textBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `podcast-${activePodcast.topicTitle.replace(/\s+/g, '-')}.txt`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          console.log('[PodcastSection] Text download completed');
                          setShowDownloadDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-100 font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        <MessageCircle size={18} className="text-blue-500" /> Text (.txt)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-96 flex flex-col gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 sm:p-8 border border-gray-100 dark:border-zinc-800 flex-1 overflow-hidden flex flex-col shadow-sm">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-4 text-gray-600 dark:text-gray-300"><MessageCircle size={16} className="text-[#07bc0c]" /> Transcript</div>
              <div className="flex-1 overflow-y-auto custom-scrollbar text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-zinc-400 font-semibold">
                {activePodcast.segments && activePodcast.segments.length > 0 ? (
                  <div className="space-y-3">
                    {activePodcast.segments.map((segment, idx) => {
                      let speakerName = segment.speaker || 'Host';
                      if (speakerName.toLowerCase().includes('all') || speakerName.toLowerCase().includes('hosts')) {
                        speakerName = 'All Hosts';
                      }
                      const isCurrentSegment = idx === segmentIndex && isPlaying;
                      return (
                        <div key={idx} className={`p-3 rounded-lg transition-all ${
                          isCurrentSegment 
                            ? 'bg-[#07bc0c]/10 border border-[#07bc0c]/50' 
                            : 'bg-gray-50 dark:bg-zinc-800/50'
                        }`}>
                          <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                            isCurrentSegment ? 'text-[#07bc0c]' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {speakerName}
                            {isCurrentSegment && <span className="ml-2">🎤</span>}
                          </div>
                          <p className={`text-xs leading-relaxed ${
                            isCurrentSegment ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-zinc-400'
                          }`}>
                            {segment.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Transcript will appear here once podcast is generated...</span>
                )}
              </div>
            </div>
            <button onClick={() => setActivePodcast(null)} className="w-full py-4 sm:py-5 bg-gray-900 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">New Recording</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[40px] sm:rounded-[60px] p-8 sm:p-16 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-[#07bc0c] shadow-inner"><Mic2 size={32} /></div>
            <h3 className="text-2xl sm:text-3xl font-bold dark:text-white leading-tight">Podcast Studio</h3>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm sm:text-lg max-w-sm">Convert your materials into engaging conversations.</p>
            <div className="w-full max-w-xs space-y-2 pt-4">
              <div className="flex justify-between text-[9px] font-black uppercase text-gray-500 dark:text-gray-300 tracking-widest">
                <span>Duration</span>
                <span>{duration} Minutes</span>
              </div>
              <input type="range" min="1" max="10" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full accent-[#07bc0c] cursor-pointer" />
              {console.log('[PodcastSection] rendering host count', hostCount)}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-gray-100 dark:border-zinc-800 shadow-2xl space-y-8">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest block px-1">Focus Topic</label>
              <div className="relative">
                <select value={selectedTopic || ''} onChange={e => setSelectedTopic(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border-none outline-none font-bold text-xs appearance-none cursor-pointer text-zinc-900 dark:text-white">
                  <option value="">Select Topic</option>
                  {topics.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest block px-1">Format</label>
              <div className="flex bg-gray-50 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
                  {[1, 2].map(n => (
                  <button key={n} onClick={() => setHostCount(n)} className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${hostCount === n ? 'bg-white dark:bg-zinc-700 shadow-md text-[#07bc0c]' : 'text-gray-700 dark:text-gray-200'}`}>
                    {n === 1 ? <User size={12}/> : <UserPlus size={12}/>} {n === 1 ? 'Solo' : 'Double'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[...Array(hostCount)].map((_, i) => (
                <div key={i} className="p-5 bg-gray-50 dark:bg-zinc-800 rounded-[28px] space-y-4 border dark:border-zinc-700">
                  <div className="flex items-center gap-1.5 font-black text-[9px] text-gray-500 dark:text-gray-300 uppercase tracking-widest"><Settings2 size={10} className="text-[#07bc0c]" /> Host {i + 1}</div>
                  <input type="text" value={hosts[i].name} placeholder={`Name (e.g. ${i === 0 ? 'Dr. Sarah' : 'Alex'})`} onChange={e => { const h = [...hosts]; h[i].name = e.target.value; setHosts(h); }} className="w-full p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 text-xs font-bold outline-none text-zinc-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={hosts[i].accent} onChange={e => { const h = [...hosts]; h[i].accent = e.target.value; setHosts(h); }} className="p-2.5 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-lg text-[9px] font-bold text-zinc-900 dark:text-white">{accentOptions.map(a => <option key={a} value={a}>{a}</option>)}</select>
                    <select value={hosts[i].tone} onChange={e => { const h = [...hosts]; h[i].tone = e.target.value; setHosts(h); }} className="p-2.5 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-lg text-[9px] font-bold text-zinc-900 dark:text-white">{toneOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={createPodcast} disabled={!selectedTopic || isPaused} className={`w-full py-5 rounded-[24px] font-bold text-base text-white shadow-2xl transition-all ${selectedTopic && !isPaused ? 'bg-[#07bc0c] shadow-[#07bc0c]/30 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>Start Session</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastSection;

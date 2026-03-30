import React, { useState, useEffect } from 'react';
import { Play, Pause, Headphones, Download, ChevronDown, Mic2, UserPlus, RotateCcw, RotateCw, Settings2, User, MessageCircle, Share2 } from 'lucide-react';
import { generatePodcastContent, speakText, downloadPodcastAsAudio, getVoiceForAccent } from '../services/geminiService';

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
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  useEffect(() => {
    return () => {
      // Stop speech synthesis when component unmounts
      window.speechSynthesis.cancel();
      setIsPlaying(false);
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

  const createPodcast = async () => {
    console.log('[PodcastSection] createPodcast', { selectedTopic, hostCount, duration, hosts });
    if (!selectedTopic) return;
    setLoading(true);
    const topic = Array.isArray(topics) && topics.length > 0 ? topics[0] : selectedTopic;
    try {
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
      
      // Build transcript from segments
      const transcript = result.segments && result.segments.length > 0 
        ? result.segments.map(seg => seg.text || '').join('\n\n')
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
      
      console.log('[PodcastSection] Podcast activated successfully');
    } catch (e) {
      console.error('[PodcastSection] Error generating podcast:', e);
      alert("Failed to generate podcast: " + (e.message || "Unknown error"));
    } finally { 
      setLoading(false); 
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      // Use Web Speech API to synthesize and speak the transcript with proper accent
      const cleanTranscript = activePodcast.transcript.replace(/\[PAUSE\]/g, '...');
      const utterance = new SpeechSynthesisUtterance(cleanTranscript);
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Get voices and apply first host's accent
      if (activePodcast.hosts && activePodcast.hosts.length > 0) {
        const firstHostAccent = activePodcast.hosts[0].accent || 'US';
        const voices = window.speechSynthesis.getVoices();
        
        // Map accents to language codes for voice selection - proper support for all accents
        const accentMap = {
          'US': 'en-US',
          'UK': 'en-GB',
          'NG': 'en-NG' // Proper Nigerian English support
        };
        
        const targetLang = accentMap[firstHostAccent] || 'en-US';
        // Try exact match first, then partial match, then fallback
        const selectedVoice = voices.find(v => v.lang === targetLang) || 
                             voices.find(v => v.lang?.startsWith(targetLang.split('-')[0])) || 
                             voices.find(v => v.lang?.includes('en')) ||
                             voices[0];
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('[PodcastSection] Using voice:', { lang: selectedVoice.lang, name: selectedVoice.name, accent: firstHostAccent, targetLang });
        }
      }
      
      utterance.onstart = () => {
        setIsPlaying(true);
        console.log('[PodcastSection] starting speech synthesis');
      };
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        console.log('[PodcastSection] speech synthesis ended');
      };
      utterance.onerror = (e) => {
        console.error('[PodcastSection] speech synthesis error:', e);
        setIsPlaying(false);
      };
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
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
              <input type="range" min="0" max={100} value={currentTime} onChange={(e) => console.log('seek not yet implemented')} className="w-full h-1.5 sm:h-2 bg-gray-100 dark:bg-zinc-800 rounded-full appearance-none accent-[#07bc0c] cursor-pointer" />
              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); }} className="text-gray-500 dark:text-gray-300 active:text-[#07bc0c] transition-colors" title="Reset"><RotateCcw size={28} /></button>
                <button onClick={togglePlay} className="w-20 h-20 sm:w-24 sm:h-24 bg-[#07bc0c] text-white rounded-[32px] sm:rounded-[40px] flex items-center justify-center shadow-2xl shadow-[#07bc0c]/20 active:scale-90 transition-transform" title={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1.5" />}</button>
                <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); }} className="text-gray-500 dark:text-gray-300 active:text-[#07bc0c] transition-colors" title="Stop"><RotateCw size={28} /></button>
              </div>
              <div className="flex gap-3 sm:gap-4 relative">
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
                          console.log('[PodcastSection] User selected: Download Audio');
                          downloadPodcastAsAudio(activePodcast.transcript, `podcast-${activePodcast.topicTitle.replace(/\s+/g, '-')}.wav`, activePodcast.hosts);
                          setShowDownloadDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-100 font-semibold text-sm border-b border-gray-200 dark:border-zinc-700 transition-colors flex items-center gap-2"
                      >
                        <Download size={18} className="text-emerald-500" /> Audio (.wav)
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
              <div className="flex-1 overflow-y-auto custom-scrollbar text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-gray-600 dark:text-zinc-400 font-semibold">
                {activePodcast.transcript && activePodcast.transcript.length > 0 
                  ? activePodcast.transcript 
                  : <span className="text-gray-400 italic">Transcript will appear here once podcast is generated...</span>
                }
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

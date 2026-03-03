import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Headphones, Download, ChevronDown, Mic2, UserPlus, RotateCcw, RotateCw, Settings2, User, MessageCircle } from 'lucide-react';
import { generatePodcastContent, speakText } from '../services/geminiService';

const PodcastSection = ({ docText, topics, setLoading, setLoadingMessage, isPaused }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [hostCount, setHostCount] = useState(1);
  const [duration, setDuration] = useState(3);
  const [hosts, setHosts] = useState([
    { name: '', accent: 'US', tone: 'PROFESSIONAL' },
    { name: '', accent: 'UK', tone: 'FRIENDLY' }
  ]);
  const [activePodcast, setActivePodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const audioRef = useRef(null);

  useEffect(() => {
    if (activePodcast?.audioUrl) {
      try {
        // For now, we'll skip audio playback since we don't have audio generation yet
        // In production, this would handle audio blob creation and playback
        console.log('Podcast audio would be played here');
      } catch (e) {
        console.error('Error setting up audio:', e);
      }
    }
  }, [activePodcast]);

  const areHostsValid = hosts.slice(0, hostCount).every(h => h.name?.trim().length > 0);

  const createPodcast = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    const topic = Array.isArray(topics) && topics.length > 0 ? topics[0] : selectedTopic;
    try {
      setLoadingMessage('Generating podcast content...');
      const result = await generatePodcastContent(docText, {
        tone: hosts[0]?.tone || 'TEACHER',
        durationMinutes: duration,
        selectedTopics: [topic]
      });
      setActivePodcast({ 
        id: Date.now().toString(), 
        topicTitle: topic, 
        title: `Study Podcast: ${topic}`, 
        audioUrl: result.audio || '', 
        transcript: result.segments?.map(s => s.text).join('\n\n') || '', 
        timestamp: Date.now(), 
        hosts: hosts.slice(0, hostCount) 
      });
    } catch (e) {
      alert("Failed to generate podcast: " + (e.message || "Unknown error"));
    } finally { 
      setLoading(false); 
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const toneOptions = ['FUNNY', 'PROFESSIONAL', 'TEACHER', 'FRIEND'];
  const accentOptions = ['NG', 'UK', 'US'];

  return (
    <div className="p-4 sm:p-12 max-w-7xl mx-auto h-full flex flex-col space-y-8 mb-24">
      <div className="space-y-1 px-2">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Podcast</h2>
        <p className="text-gray-500 font-bold text-sm sm:text-lg">Listen to your curriculum.</p>
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
              <input type="range" min="0" max={audioDuration || 0} value={currentTime} onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value); }} className="w-full h-1.5 sm:h-2 bg-gray-100 dark:bg-zinc-800 rounded-full appearance-none accent-[#07bc0c] cursor-pointer" />
              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }} className="text-gray-400 active:text-[#07bc0c] transition-colors"><RotateCcw size={28} /></button>
                <button onClick={togglePlay} className="w-20 h-20 sm:w-24 sm:h-24 bg-[#07bc0c] text-white rounded-[32px] sm:rounded-[40px] flex items-center justify-center shadow-2xl shadow-[#07bc0c]/20 active:scale-90 transition-transform">{isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1.5" />}</button>
                <button onClick={() => { if (audioRef.current) audioRef.current.currentTime += 15; }} className="text-gray-400 active:text-[#07bc0c] transition-colors"><RotateCw size={28} /></button>
              </div>
            </div>
          </div>

          <div className="lg:w-96 flex flex-col gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 sm:p-8 border border-gray-100 dark:border-zinc-800 flex-1 overflow-hidden flex flex-col shadow-sm">
              <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-4"><MessageCircle size={16} className="text-[#07bc0c]" /> Transcript</div>
              <div className="flex-1 overflow-y-auto custom-scrollbar text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-gray-600 dark:text-zinc-400 font-semibold">{activePodcast.transcript}</div>
            </div>
            <button onClick={() => setActivePodcast(null)} className="w-full py-4 sm:py-5 bg-gray-900 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">New Recording</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[40px] sm:rounded-[60px] p-8 sm:p-16 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center text-[#07bc0c] shadow-inner"><Mic2 size={32} /></div>
            <h3 className="text-2xl sm:text-3xl font-bold dark:text-white leading-tight">Podcast Studio</h3>
            <p className="text-gray-500 font-bold text-sm sm:text-lg max-w-sm">Convert your materials into engaging conversations.</p>
            <div className="w-full max-w-xs space-y-2 pt-4">
              <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 tracking-widest">
                <span>Duration</span>
                <span>{duration} Minutes</span>
              </div>
              <input type="range" min="1" max="10" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full accent-[#07bc0c] cursor-pointer" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-gray-100 dark:border-zinc-800 shadow-2xl space-y-8">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">Focus Topic</label>
              <div className="relative">
                <select value={selectedTopic || ''} onChange={e => setSelectedTopic(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border-none outline-none font-bold text-xs appearance-none cursor-pointer">
                  <option value="">Select Topic</option>
                  {topics.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">Format</label>
              <div className="flex bg-gray-50 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
                {[1, 2].map(n => (
                  <button key={n} onClick={() => setHostCount(n)} className={`flex-1 py-3 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${hostCount === n ? 'bg-white dark:bg-zinc-700 shadow-md text-[#07bc0c]' : 'text-gray-400'}`}>
                    {n === 1 ? <User size={12}/> : <UserPlus size={12}/>} {n === 1 ? 'Solo' : 'Double'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[...Array(hostCount)].map((_, i) => (
                <div key={i} className="p-5 bg-gray-50 dark:bg-zinc-800 rounded-[28px] space-y-4 border dark:border-zinc-700">
                  <div className="flex items-center gap-1.5 font-black text-[9px] text-gray-400 uppercase tracking-widest"><Settings2 size={10} className="text-[#07bc0c]" /> Host {i + 1}</div>
                  <input type="text" value={hosts[i].name} placeholder={`Name (e.g. ${i === 0 ? 'Dr. Sarah' : 'Alex'})`} onChange={e => { const h = [...hosts]; h[i].name = e.target.value; setHosts(h); }} className="w-full p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 text-xs font-bold outline-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={hosts[i].accent} onChange={e => { const h = [...hosts]; h[i].accent = e.target.value; setHosts(h); }} className="p-2.5 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-lg text-[9px] font-bold">{accentOptions.map(a => <option key={a} value={a}>{a}</option>)}</select>
                    <select value={hosts[i].tone} onChange={e => { const h = [...hosts]; h[i].tone = e.target.value; setHosts(h); }} className="p-2.5 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-lg text-[9px] font-bold">{toneOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
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

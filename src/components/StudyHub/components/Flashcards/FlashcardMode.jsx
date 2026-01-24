import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Brain, CheckCircle2, Circle } from 'lucide-react';

const FlashcardMode = ({ cards, onClose, isDarkMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState(new Set());

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const toggleMastered = () => {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(currentCard.id)) next.delete(currentCard.id);
      else next.add(currentCard.id);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex]);

  const progress = ((currentIndex + 1) / cards.length) * 100;
  const masteredCount = mastered.size;

  return (
    <div className={`h-full w-full flex flex-col items-center p-4 md:p-8 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className="w-full max-w-4xl flex items-center justify-between mb-8 md:mb-12 shrink-0">
        <button onClick={onClose} className="p-2.5 rounded-xl border hover:bg-red-500/10 hover:text-red-500 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-[#07bc0c]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Flashcard Mastery</span>
          </div>
          <div className="text-[10px] font-bold text-[#07bc0c]">
            {masteredCount} of {cards.length} cards mastered
          </div>
        </div>
        <button onClick={() => { setCurrentIndex(0); setMastered(new Set()); setIsFlipped(false); }} className="p-2.5 rounded-xl border hover:text-[#07bc0c] transition-all">
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center gap-12 min-h-0">
        {/* Flashcard Component */}
        <div 
          className="relative w-full aspect-[4/3] md:aspect-[3/2] cursor-pointer group perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ perspective: '2000px' }}
        >
          <div 
            className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-[3rem] ${isFlipped ? 'rotate-y-180' : ''}`}
            style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* Front side */}
            <div 
              className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 md:p-14 text-center border-4 rounded-[3rem] ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-20">
                <Brain className="w-12 h-12" />
              </div>
              <h2 className={`text-2xl md:text-4xl font-extrabold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {currentCard.front}
              </h2>
              <div className="absolute bottom-10 text-[10px] font-black uppercase tracking-widest opacity-30 animate-pulse">
                Click to flip
              </div>
            </div>

            {/* Back side */}
            <div 
              className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 md:p-14 text-center border-4 rounded-[3rem] ${
                isDarkMode ? 'bg-slate-800 border-[#07bc0c]/30' : 'bg-slate-50 border-[#07bc0c]/20'
              }`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="absolute top-8 left-8">
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-[#07bc0c]/20 text-[#07bc0c]' : 'bg-[#07bc0c]/10 text-[#07bc0c]'}`}>
                    Definition
                </div>
              </div>
              <p className={`text-lg md:text-2xl font-medium leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {currentCard.back}
              </p>
              <div className="absolute bottom-10 text-[10px] font-black uppercase tracking-widest opacity-30">
                Click to flip back
              </div>
            </div>
          </div>
        </div>

        {/* Card Controls */}
        <div className="flex items-center gap-6 w-full justify-center">
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className={`p-5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); toggleMastered(); }}
            className={`flex items-center gap-3 px-8 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-xl ${
              mastered.has(currentCard.id)
              ? 'bg-[#07bc0c] text-white shadow-[#07bc0c]/30'
              : isDarkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {mastered.has(currentCard.id) ? (
                <>
                    <CheckCircle2 className="w-5 h-5" /> Mastered
                </>
            ) : (
                <>
                    <Circle className="w-5 h-5" /> Mark as Mastered
                </>
            )}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className={`p-5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </main>

      <footer className="w-full max-w-4xl mt-12 mb-8 shrink-0">
        <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black uppercase opacity-40">Card {currentIndex + 1} of {cards.length}</span>
            <span className="text-[10px] font-black uppercase opacity-40">{Math.round(progress)}% Complete</span>
        </div>
        <div className={`h-2 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-900 shadow-inner' : 'bg-slate-200 shadow-inner'}`}>
          <div 
            className="h-full bg-[#07bc0c] transition-all duration-500 shadow-[0_0_10px_rgba(7,188,12,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </footer>
    </div>
  );
};

export default FlashcardMode;

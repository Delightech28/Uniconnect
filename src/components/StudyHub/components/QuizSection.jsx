import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, Clock, MapPin, Target, Zap, Rocket, Activity, Lock, ArrowRight, BookOpen, ExternalLink, X } from 'lucide-react';
import { generateQuiz, getQuizFeedback } from '../services/geminiService';

const QuizSection = ({ docText, topics, onQuizComplete, setLoading, setLoadingMessage, isDarkMode }) => {

  const startQuiz = async () => {
    if (!selectedTopic) return;
    const topicIdx = topics.findIndex(t => t.id === selectedTopic);
    setLoading(true);
    setLoadingMessage(`Constructing ${numQuestions} questions...`);
    try {
      const qs = await generateQuiz(docText, topics[topicIdx].title, numQuestions);
      setQuestions(qs);
      setUserAnswers(new Array(qs.length).fill(-1));
      setCurrentIdx(0);
      setIsQuizRunning(true);
      setTimeLeft(timePerQuestion);
      setAiFeedback(null);
    } catch (e) {
      alert("AI Service Capacity Reached.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (isQuizRunning && !isShowingResults && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isQuizRunning && !isShowingResults) {
      handleNext();
    }
    return () => clearInterval(timer);
  }, [isQuizRunning, timeLeft, isShowingResults]);

  const handleAnswer = (idx) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIdx] = idx;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setTimeLeft(timePerQuestion);
    } else {
      finishQuiz();
    }
  };

  const fetchAiFeedback = async () => {
    if (!selectedTopic || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const topicTitle = topics.find(t => t.id === selectedTopic)?.title || '';
      const feedback = await getQuizFeedback(docText, questions, userAnswers.map((ans, idx) => ({
        isCorrect: ans === questions[idx].correctAnswerIndex || (questions[idx].correctAnswer !== undefined && ans === questions[idx].correctAnswer)
      })));
      setAiFeedback(feedback);
    } catch (e) {
      alert("Analysis engine busy.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const finishQuiz = () => {
    setIsShowingResults(true);
    const correctCount = userAnswers.reduce((acc, ans, idx) => 
      ans === questions[idx].correctAnswer ? acc + 1 : acc
    , 0);
    const score = (correctCount / questions.length) * 100;
    if (selectedTopic) {
      onQuizComplete(selectedTopic, score);
    }
  };

  if (isQuizRunning) {
    if (isShowingResults) {
      const correctCount = userAnswers.reduce((acc, ans, idx) => 
        ans === questions[idx].correctAnswerIndex ? acc + 1 : ans === questions[idx].correctAnswer ? acc + 1 : acc
      , 0);
      const score = Math.round((correctCount / questions.length) * 100);

      return (
        <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-in fade-in duration-500 mb-24">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-8 sm:space-y-12">
            <div className="text-center space-y-3">
               <div className={`text-6xl sm:text-7xl font-black ${score >= 70 ? 'text-unispace' : 'text-red-500'}`}>{score}%</div>
               <h2 className="text-2xl sm:text-3xl font-bold dark:text-white">Assessment Complete</h2>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Status: {score >= 70 ? 'MASTERED' : 'GAP DETECTED'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {!aiFeedback ? (
                  <button onClick={fetchAiFeedback} disabled={isAnalyzing} className="md:col-span-2 flex items-center justify-center gap-3 px-6 py-4 bg-unispace text-white rounded-2xl sm:rounded-[24px] font-bold text-base sm:text-lg shadow-xl shadow-unispace/20 active:scale-95 transition-all">
                    {isAnalyzing ? "Analyzing..." : "Get AI Report"}
                  </button>
                ) : (
                  <>
                    {[
                      { icon: Activity, title: 'Performance', text: aiFeedback.performanceSummary },
                      { icon: Zap, title: 'Strengths', text: aiFeedback.strengths },
                      { icon: Target, title: 'Weaknesses', text: aiFeedback.weaknesses },
                      { icon: Rocket, title: 'Next Steps', text: aiFeedback.nextSteps }
                    ].map((item, idx) => (
                      <div key={idx} className="p-5 sm:p-6 bg-gray-50 dark:bg-zinc-800 rounded-2xl sm:rounded-[32px] border dark:border-zinc-700">
                        <div className="flex items-center gap-2 mb-3 font-bold text-unispace text-[10px] uppercase tracking-widest"><item.icon size={16}/> {item.title}</div>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </>
                )}
            </div>

            <div className="space-y-6 pt-8 border-t dark:border-zinc-800">
              <h3 className="text-xl sm:text-2xl font-bold dark:text-white">Review Responses</h3>
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 sm:p-8 border border-gray-100 dark:border-zinc-800 rounded-2xl sm:rounded-[32px] bg-gray-50/20 dark:bg-zinc-800/20 space-y-4">
                  <div className="flex justify-between gap-4">
                    <p className="font-semibold text-base sm:text-lg dark:text-white leading-snug">{idx + 1}. {q.question}</p>
                    {userAnswers[idx] === q.correctAnswer ? <CheckCircle2 className="text-unispace shrink-0" size={24}/> : <XCircle className="text-red-500 shrink-0" size={24}/>}
                  </div>
                  <div className="text-xs sm:text-sm space-y-1">
                    <p className="text-gray-400">Chosen: <span className={userAnswers[idx] === q.correctAnswer ? 'text-unispace' : 'text-red-500'}>{q.options[userAnswers[idx]] || 'Timed Out'}</span></p>
                    <p className="text-gray-900 dark:text-zinc-100 font-bold">Correct: {q.options[q.correctAnswer]}</p>
                  </div>
                  <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-700 text-xs sm:text-sm leading-relaxed">
                    <div className="font-bold text-unispace uppercase text-[9px] tracking-widest mb-2">Explanation</div>
                    <div className="dark:text-zinc-400">{q.explanation}</div>
                    <button 
                      onClick={() => setValidationRef(q.pageReference)}
                      className="mt-4 flex items-center gap-2 text-[9px] font-black text-gray-400 hover:text-unispace uppercase tracking-widest bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-transparent active:border-unispace/20 transition-all"
                    >
                      <MapPin size={10}/> {q.pageReference} 
                      <span className="flex items-center gap-1 border-l pl-2 ml-1 text-unispace"><ExternalLink size={10}/> Validate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => {setIsQuizRunning(false); setIsShowingResults(false); setSelectedTopic(null);}} className="w-full py-4 sm:py-5 bg-gray-900 text-white rounded-2xl sm:rounded-[24px] font-bold text-base sm:text-lg shadow-xl shadow-gray-200 active:scale-95 transition-all">Exit Assessment</button>
          </div>

          {validationRef && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setValidationRef(null)}>
              <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-t-[32px] sm:rounded-[40px] p-6 sm:p-10 space-y-6 shadow-2xl animate-in slide-in-from-bottom-20 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold flex items-center gap-2"><BookOpen className="text-unispace" /> Validation</h4>
                  <button onClick={() => setValidationRef(null)} className="p-2"><X size={18}/></button>
                </div>
                <div className="h-[50vh] sm:h-72 overflow-y-auto custom-scrollbar p-6 bg-gray-50 dark:bg-zinc-800 rounded-2xl text-xs sm:text-sm leading-relaxed italic border dark:border-zinc-700">{docText.substring(0, 5000)}...</div>
                <button onClick={() => setValidationRef(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">Return to Review</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    const currentQ = questions[currentIdx];
    return (
      <div className="max-w-3xl mx-auto py-6 sm:py-12 px-4 sm:px-6 animate-in slide-in-from-bottom-6 duration-500 mb-24">
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] sm:rounded-[50px] p-6 sm:p-12 shadow-2xl space-y-8 sm:space-y-12">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{currentIdx + 1} / {questions.length}</span>
              <div className="w-full sm:w-40 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-unispace transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
              </div>
            </div>
            <div className="px-4 py-2 sm:px-6 sm:py-3 bg-unispace/10 text-unispace rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 font-black text-lg sm:text-xl ml-4">
              <Clock size={20} className="sm:w-6 sm:h-6" /> {timeLeft}s
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">{currentQ.question}</h3>

          <div className="grid gap-3 sm:gap-4">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`p-4 sm:p-6 text-left rounded-2xl sm:rounded-[28px] border-2 transition-all font-semibold text-sm sm:text-lg flex items-center gap-4 sm:gap-6 ${
                  userAnswers[currentIdx] === idx 
                    ? 'border-unispace bg-unispace/5 text-unispace shadow-md' 
                    : 'border-gray-50 dark:border-zinc-800 dark:text-zinc-300'
                }`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border-2 shrink-0 ${userAnswers[currentIdx] === idx ? 'bg-unispace text-white border-unispace' : 'border-gray-50 dark:border-zinc-700 text-gray-300'}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between gap-4 pt-4 sm:pt-6">
            <button onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)} disabled={currentIdx === 0} className={`flex items-center gap-1 sm:gap-2 font-black text-gray-400 uppercase tracking-widest text-[9px] sm:text-xs ${currentIdx === 0 ? 'opacity-0' : 'hover:text-unispace'}`}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={userAnswers[currentIdx] === -1}
              className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 rounded-2xl sm:rounded-[24px] font-bold text-base sm:text-lg transition-all ${
                userAnswers[currentIdx] === -1 ? 'bg-gray-100 text-gray-300' : 'bg-unispace text-white shadow-xl shadow-unispace/20 active:scale-95'
              }`}
            >
              {currentIdx === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-12 max-w-7xl mx-auto space-y-8 sm:space-y-12 mb-24">
      <div className="space-y-2 px-2">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Curriculum</h2>
        <p className="text-gray-500 font-bold text-base sm:text-lg">Assess your mastery level.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {topics.map((topic, index) => {
          const isFailing = topic.score !== undefined && topic.score < 70;
          return (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={`p-6 sm:p-8 rounded-3xl sm:rounded-[40px] border-2 transition-all text-left space-y-4 sm:space-y-6 relative group ${
                selectedTopic === topic.id 
                  ? 'border-unispace bg-unispace/5' 
                  : 'bg-white dark:bg-zinc-900 border-gray-50 dark:border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-gray-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-unispace group-hover:text-white transition-colors">{index + 1}</div>
                {topic.passed ? <CheckCircle2 className="text-unispace" size={24}/> : isFailing ? <XCircle className="text-red-500" size={24}/> : null}
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-lg sm:text-xl font-bold dark:text-white leading-tight">{topic.title}</h3>
                <p className="text-xs text-gray-400 font-semibold line-clamp-1">{topic.subtopics.join(', ')}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t dark:border-zinc-800">
                <div className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{topic.score !== undefined ? `${topic.score}% Mastery` : 'Not Attempted'}</div>
                <ArrowRight size={16} className="text-unispace group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {selectedTopic && (
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] shadow-2xl border border-gray-100 dark:border-zinc-800 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-unispace/10 text-unispace rounded-xl flex items-center justify-center shadow-inner"><Zap size={20} /></div>
            <h3 className="text-xl sm:text-2xl font-bold dark:text-white">Settings</h3>
          </div>
          
          <div className="flex flex-col gap-6 sm:gap-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">Questions</label>
                <select value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl sm:rounded-2xl font-bold text-sm border-none outline-none appearance-none cursor-pointer">
                  {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n} Items</option>)}
                </select>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">Timer</label>
                <select value={timePerQuestion} onChange={e => setTimePerQuestion(Number(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl sm:rounded-2xl font-bold text-sm border-none outline-none appearance-none cursor-pointer">
                  {[15, 30, 45, 60].map(n => <option key={n} value={n}>{n} Seconds</option>)}
                </select>
              </div>
            </div>

            <button onClick={startQuiz} className="w-full py-4 sm:py-5 bg-unispace text-white rounded-2xl sm:rounded-[24px] font-bold text-base sm:text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-unispace/20">Begin Assessment</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSection;

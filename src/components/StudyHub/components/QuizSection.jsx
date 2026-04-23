import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
  Target,
  Zap,
  Rocket,
  Activity,
  Lock,
  ArrowLeft,
  BookOpen,
  ExternalLink,
  X,
  Users,
  RotateCcw,
} from "lucide-react";
import { generateQuiz, getQuizFeedback } from "../services/geminiService";
import QuizInviteModal from "../../QuizInviteModal";

const QuizSection = ({
  docText,
  topics,
  onQuizComplete,
  setLoading,
  setLoadingMessage,
  isDarkMode,
}) => {
  // Load persisted state from localStorage
  const [selectedTopic, setSelectedTopic] = useState(() => {
    const saved = localStorage.getItem("quizState_selectedTopic");
    return saved || topics?.[0] || null;
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [lockedTopic, setLockedTopic] = useState(() => {
    const saved = localStorage.getItem("quizState_lockedTopic");
    return saved || null;
  });
  const [topicScores, setTopicScores] = useState(() => {
    const saved = localStorage.getItem("quizState_topicScores");
    return saved ? JSON.parse(saved) : {};
  });

  const [numQuestions, setNumQuestions] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  // State for quiz execution
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isQuizRunning, setIsQuizRunning] = useState(false);
  const [isShowingResults, setIsShowingResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationRef, setValidationRef] = useState(null);
  const validationScrollRef = useRef(null);

  // Log component mount/updates (only when props change, not on every render)
  useEffect(() => {
    console.log("[QuizSection] Component mounted/updated", {
      docText: !!docText,
      topicsLength: topics?.length,
      isDarkMode,
      topics,
    });
  }, [docText, topics?.length, isDarkMode]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem("quizState_selectedTopic", selectedTopic || "");
    localStorage.setItem("quizState_lockedTopic", lockedTopic || "");
    localStorage.setItem("quizState_topicScores", JSON.stringify(topicScores));
  }, [selectedTopic, lockedTopic, topicScores]);

  // Handle validation modal scrolling to reference
  useEffect(() => {
    console.log(
      "[QuizSection] Validation effect triggered - validationRef:",
      validationRef,
      "docText length:",
      docText?.length,
    );

    if (validationRef && validationScrollRef.current && docText) {
      const container = validationScrollRef.current;
      const text = docText;

      // Search for the reference in the text (case-insensitive)
      const searchPattern = validationRef.toLowerCase();
      const lowerText = text.toLowerCase();
      const index = lowerText.indexOf(searchPattern);

      console.log(
        "[QuizSection] Searching for:",
        searchPattern,
        "Found at index:",
        index,
      );

      if (index !== -1) {
        // Calculate position more accurately by counting lines before the found text
        const beforeText = text.substring(0, index);
        const lines = beforeText.split("\n");
        const lineNumber = lines.length - 1;
        const roughLineHeight = 24; // Approximate line height in pixels
        const scrollPosition = Math.max(0, lineNumber * roughLineHeight - 100); // -100 to center it

        console.log(
          "[QuizSection] Scroll - Line:",
          lineNumber,
          "Position:",
          scrollPosition,
          "Container height:",
          container.clientHeight,
        );

        // Wait for DOM to be ready, then scroll
        setTimeout(() => {
          container.scrollTop = scrollPosition;
          console.log(
            "[QuizSection] Scrolled to position:",
            container.scrollTop,
          );
        }, 100);
      } else {
        console.warn(
          "[QuizSection] Reference not found in document:",
          searchPattern,
        );
      }
    }
  }, [validationRef, docText]);

  const startQuiz = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setLoadingMessage(`Constructing ${numQuestions} questions...`);
    try {
      const qs = await generateQuiz(docText, selectedTopic, numQuestions);
      setQuestions(qs);
      setUserAnswers(new Array(qs.length).fill(-1));
      setCurrentIdx(0);
      setIsShowingResults(false);
      setIsQuizRunning(true);
      setTimeLeft(timePerQuestion);
      setAiFeedback(null);
    } catch (e) {
      alert("Failed to generate quiz: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (isQuizRunning && !isShowingResults && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
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
      setCurrentIdx((prev) => prev + 1);
      setTimeLeft(timePerQuestion);
    } else {
      finishQuiz();
    }
  };

  const fetchAiFeedback = async () => {
    if (!selectedTopic || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const feedback = await getQuizFeedback(
        docText,
        questions,
        userAnswers.map((ans, idx) => ({
          isCorrect: ans === questions[idx].correctAnswerIndex,
        })),
      );
      setAiFeedback(feedback);
    } catch (e) {
      alert("Analysis engine busy.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const finishQuiz = () => {
    console.log(
      "[QuizSection] finishQuiz called - selectedTopic:",
      selectedTopic,
      "questions:",
      questions.length,
      "userAnswers:",
      userAnswers.length,
    );
    setIsShowingResults(true);
    const correctCount = userAnswers.reduce(
      (acc, ans, idx) =>
        ans === (questions[idx]?.correctAnswerIndex ?? -1) ? acc + 1 : acc,
      0,
    );
    const score = questions.length
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
    console.log(
      "[QuizSection] Quiz finished - Correct:",
      correctCount,
      "Total:",
      questions.length,
      "Score:",
      score,
      "Topic:",
      selectedTopic,
    );
    console.log("[QuizSection] About to call onQuizComplete with:", {
      selectedTopic,
      score,
    });

    if (selectedTopic) {
      onQuizComplete(selectedTopic, score);
      console.log("[QuizSection] Called onQuizComplete successfully");

      // Update score
      const newScores = {
        ...topicScores,
        [selectedTopic]: Math.max(topicScores[selectedTopic] || 0, score),
      };
      setTopicScores(newScores);
      console.log("[QuizSection] Updated topicScores:", newScores);

      // If score >= 70%, unlock the topic by clearing the lock
      if (score >= 70) {
        setLockedTopic(null);
      } else {
        // If score < 70%, keep the topic locked
        setLockedTopic(selectedTopic);
      }
    } else {
      console.warn(
        "[QuizSection] No selectedTopic, not calling onQuizComplete",
      );
    }
  };

  if (isQuizRunning) {
    if (isShowingResults) {
      const correctCount = userAnswers.reduce(
        (acc, ans, idx) =>
          ans === questions[idx].correctAnswerIndex ? acc + 1 : acc,
        0,
      );
      const score = questions.length
        ? Math.round((correctCount / questions.length) * 100)
        : 0;

      return (
        <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-in fade-in duration-500 mb-24">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-8 sm:space-y-12">
            <div className="text-center space-y-3">
              <div
                className={`text-6xl sm:text-7xl font-black ${score >= 70 ? "text-unispace" : "text-red-500"}`}
              >
                {score}%
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold dark:text-white">
                Assessment Complete
              </h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                Status: {score >= 70 ? "MASTERED" : "GAP DETECTED"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {!aiFeedback ? (
                <button
                  onClick={fetchAiFeedback}
                  disabled={isAnalyzing}
                  className={`md:col-span-2 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl sm:rounded-[24px] font-bold text-base sm:text-lg transition-all ${
                    isAnalyzing
                      ? "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-unispace text-white shadow-xl shadow-unispace/20 active:scale-95 hover:shadow-2xl"
                  }`}
                >
                  {isAnalyzing ? "Analyzing..." : "Get AI Report"}
                </button>
              ) : (
                <>
                  {[
                    {
                      icon: Activity,
                      title: "Performance",
                      text: aiFeedback.performanceSummary,
                    },
                    {
                      icon: Zap,
                      title: "Strengths",
                      text: aiFeedback.strengths,
                    },
                    {
                      icon: Target,
                      title: "Weaknesses",
                      text: aiFeedback.weaknesses,
                    },
                    {
                      icon: Rocket,
                      title: "Next Steps",
                      text: aiFeedback.nextSteps,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 sm:p-6 bg-gray-50 dark:bg-zinc-800 rounded-2xl sm:rounded-[32px] border dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-2 mb-3 font-bold text-unispace text-[10px] uppercase tracking-widest">
                        <item.icon size={16} /> {item.title}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="space-y-6 pt-8 border-t dark:border-zinc-800">
              <h3 className="text-xl sm:text-2xl font-bold dark:text-white">
                Review Responses
              </h3>
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 sm:p-8 border border-gray-100 dark:border-zinc-800 rounded-2xl sm:rounded-[32px] bg-gray-50/20 dark:bg-zinc-800/20 space-y-4"
                >
                  <div className="flex justify-between gap-4">
                    <p className="font-semibold text-base sm:text-lg dark:text-white leading-snug">
                      {idx + 1}. {q.text}
                    </p>
                    {userAnswers[idx] === q.correctAnswerIndex ? (
                      <CheckCircle2
                        className="text-unispace shrink-0"
                        size={24}
                      />
                    ) : (
                      <XCircle className="text-red-500 shrink-0" size={24} />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm space-y-1">
                    <p className="text-gray-400">
                      Chosen:{" "}
                      <span
                        className={
                          userAnswers[idx] === q.correctAnswerIndex
                            ? "text-unispace"
                            : "text-red-500"
                        }
                      >
                        {q.options[userAnswers[idx]] || "Timed Out"}
                      </span>
                    </p>
                    <p className="text-gray-900 dark:text-zinc-100 font-bold">
                      Correct: {q.options[q.correctAnswerIndex]}
                    </p>
                  </div>
                  <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-700 text-xs sm:text-sm leading-relaxed">
                    <div className="font-bold text-unispace uppercase text-[9px] tracking-widest mb-2">
                      Explanation
                    </div>
                    <div className="dark:text-zinc-400">{q.explanation}</div>
                    <button
                      onClick={() => {
                        console.log(
                          "[QuizSection] Validate button clicked - pageReference:",
                          q.pageReference,
                          "docText available:",
                          !!docText,
                        );
                        setValidationRef(q.pageReference);
                      }}
                      className="mt-4 flex items-center gap-2 text-[9px] font-black text-gray-400 hover:text-unispace uppercase tracking-widest bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-transparent active:border-unispace/20 transition-all"
                    >
                      <MapPin size={10} /> {q.pageReference}
                      <span className="flex items-center gap-1 border-l pl-2 ml-1 text-unispace">
                        <ExternalLink size={10} /> Validate
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                onClick={() => {
                  setIsQuizRunning(false);
                  setIsShowingResults(false);
                  setSelectedTopic(null);
                  setAiFeedback(null);
                }}
                className="flex-1 py-4 sm:py-5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-2xl sm:rounded-[24px] font-bold text-base sm:text-lg hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Back to Topics
              </button>
              <button
                onClick={() => {
                  setIsShowingResults(false);
                  setUserAnswers(new Array(questions.length).fill(-1));
                  setCurrentIdx(0);
                  setTimeLeft(timePerQuestion);
                  setAiFeedback(null);
                }}
                className="flex-1 py-4 sm:py-5 bg-unispace text-white rounded-2xl sm:rounded-[24px] font-bold text-base sm:text-lg shadow-xl shadow-unispace/20 active:scale-95 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Retake Quiz
              </button>
            </div>
          </div>

          {validationRef && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
              onClick={() => setValidationRef(null)}
            >
              <div
                className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-t-[32px] sm:rounded-[40px] p-6 sm:p-10 space-y-6 shadow-2xl animate-in slide-in-from-bottom-20 sm:zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="text-unispace" /> Validation - Finding:{" "}
                    <span className="text-unispace font-black">
                      {validationRef}
                    </span>
                  </h4>
                  <button
                    onClick={() => setValidationRef(null)}
                    className="p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div
                  ref={validationScrollRef}
                  className="h-[50vh] sm:h-80 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-zinc-900 rounded-2xl text-sm leading-relaxed border dark:border-zinc-700 whitespace-pre-wrap break-words shadow-inner"
                >
                  {docText && validationRef ? (
                    (() => {
                      const parts = [];
                      const text = docText;
                      const searchTerm = validationRef;
                      const regex = new RegExp(
                        `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                        "gi",
                      );
                      const splitText = text.split(regex);

                      splitText.forEach((part, idx) => {
                        if (regex.test(part)) {
                          // This is a match
                          return parts.push(
                            <span
                              key={idx}
                              className="bg-yellow-300 dark:bg-yellow-600 font-bold px-1 py-0.5 rounded text-gray-900"
                            >
                              {part}
                            </span>,
                          );
                        } else {
                          // Regular text
                          return parts.push(
                            <span
                              key={idx}
                              className="text-gray-700 dark:text-gray-300"
                            >
                              {part}
                            </span>,
                          );
                        }
                      });

                      return parts;
                    })()
                  ) : (
                    <span className="text-gray-500">Loading document...</span>
                  )}
                </div>
                <button
                  onClick={() => setValidationRef(null)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
                >
                  Return to Review
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    const currentQ = questions[currentIdx];

    if (!currentQ || questions.length === 0) {
      return (
        <div className="max-w-3xl mx-auto py-6 sm:py-12 px-4 sm:px-6 mb-24">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] sm:rounded-[50px] p-6 sm:p-12 shadow-2xl flex flex-col items-center justify-center gap-8 min-h-96">
            {/* Animated gradient background */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-r from-unispace to-[#07bc0c] rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-gray-200 dark:border-zinc-700 border-t-unispace border-r-[#07bc0c] rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <p className="text-lg font-bold dark:text-white">
                Loading questions...
              </p>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-2 h-2 bg-unispace rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-unispace rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-unispace rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto py-6 sm:py-12 px-4 sm:px-6 animate-in slide-in-from-bottom-6 duration-500 mb-24">
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] sm:rounded-[50px] p-6 sm:p-12 shadow-2xl space-y-8 sm:space-y-12">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {currentIdx + 1} / {questions.length}
              </span>
              <div className="w-full sm:w-40 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-unispace transition-all duration-300"
                  style={{
                    width: `${((currentIdx + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="px-4 py-2 sm:px-6 sm:py-3 bg-unispace/10 text-unispace rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 font-black text-lg sm:text-xl ml-4">
              <Clock size={20} className="sm:w-6 sm:h-6" /> {timeLeft}s
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {currentQ.text || currentQ.question}
          </h3>

          <div className="grid gap-3 sm:gap-4">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`p-4 sm:p-6 text-left rounded-2xl sm:rounded-[28px] border-2 transition-all font-semibold text-sm sm:text-lg flex items-center gap-4 sm:gap-6 ${
                  userAnswers[currentIdx] === idx
                    ? "border-unispace bg-unispace/5 text-unispace shadow-md"
                    : "border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-300"
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border-2 shrink-0 ${userAnswers[currentIdx] === idx ? "bg-unispace text-white border-unispace" : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400"}`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between gap-4 pt-4 sm:pt-6">
            <button
              onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
              disabled={currentIdx === 0}
              className={`flex items-center gap-1 sm:gap-2 font-black text-gray-400 uppercase tracking-widest text-[9px] sm:text-xs ${currentIdx === 0 ? "opacity-0" : "hover:text-unispace"}`}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={userAnswers[currentIdx] === -1}
              className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 rounded-2xl sm:rounded-[24px] font-bold text-base sm:text-lg transition-all ${
                userAnswers[currentIdx] === -1
                  ? "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-unispace text-white shadow-xl shadow-unispace/20 active:scale-95 hover:scale-105"
              }`}
            >
              {currentIdx === questions.length - 1 ? "Finish" : "Next"}{" "}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-12 max-w-7xl mx-auto space-y-8 sm:space-y-12 mb-24">
      <div className="space-y-2 px-2">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
          Quiz Yourself
        </h2>
        <p
          className={`font-bold text-base sm:text-lg ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Test your knowledge with AI-generated questions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {topics &&
          topics.map((topic, index) => {
            const handleTopicClick = () => {
              setSelectedTopic(topic);
            };
            return (
              <button
                key={topic || index}
                onClick={handleTopicClick}
                className={`p-6 sm:p-8 rounded-3xl sm:rounded-[40px] border-2 transition-all text-left space-y-4 sm:space-y-6 relative group ${
                  selectedTopic === topic
                    ? "border-unispace bg-unispace/5"
                    : `bg-white dark:bg-zinc-900 border-gray-50 ${isDarkMode ? "dark:border-zinc-800" : ""}`
                }`}
              >
                <div className="flex justify-between items-start">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${isDarkMode ? "bg-zinc-800 text-gray-400" : "bg-gray-50 text-gray-400"} group-hover:bg-unispace group-hover:text-white transition-colors`}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h3
                    className={`text-lg sm:text-xl font-bold leading-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {topic}
                  </h3>
                </div>
                <div className="flex items-center justify-between pt-2 border-t dark:border-zinc-800">
                  <div className="text-[9px] font-black uppercase text-gray-400 tracking-widest">
                    Ready
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-unispace group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </button>
            );
          })}
      </div>

      {selectedTopic && (
        <div
          className={`${isDarkMode ? "bg-zinc-900" : "bg-white"} p-6 sm:p-12 rounded-[32px] sm:rounded-[50px] shadow-2xl ${isDarkMode ? "border border-zinc-800" : "border border-gray-100"} animate-in slide-in-from-bottom-4 duration-500`}
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-unispace/10 text-unispace rounded-xl flex items-center justify-center shadow-inner">
              <Zap size={20} />
            </div>
            <h3
              className={`text-xl sm:text-2xl font-bold ${isDarkMode ? "text-white" : ""}`}
            >
              Quiz Settings
            </h3>
          </div>

          <div className="flex flex-col gap-6 sm:gap-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">
                  Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className={`w-full p-4 rounded-xl sm:rounded-2xl font-bold text-sm border-none outline-none appearance-none cursor-pointer ${isDarkMode ? "bg-zinc-800 text-white" : "bg-gray-50"}`}
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} Items
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">
                  Time Per Question
                </label>
                <select
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className={`w-full p-4 rounded-xl sm:rounded-2xl font-bold text-sm border-none outline-none appearance-none cursor-pointer ${isDarkMode ? "bg-zinc-800 text-white" : "bg-gray-50"}`}
                >
                  {[15, 30, 45, 60].map((n) => (
                    <option key={n} value={n}>
                      {n} Seconds
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="w-full py-5 sm:py-6 bg-unispace hover:bg-unispace/90 text-gray-900 dark:bg-gray-300 dark:text-gray-900 rounded-2xl sm:rounded-[24px] font-black text-lg sm:text-xl hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-unispace/40 hover:shadow-2xl hover:shadow-unispace/60 border-2 border-unispace/40 hover:border-unispace"
            >
              Begin Quiz
            </button>

            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full py-5 sm:py-6 bg-[#07bc0c]/10 hover:bg-[#07bc0c]/20 text-[#07bc0c] rounded-2xl sm:rounded-[24px] font-black text-lg sm:text-xl hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-[#07bc0c]/20 hover:shadow-2xl hover:shadow-[#07bc0c]/40 border-2 border-[#07bc0c]/40 hover:border-[#07bc0c] flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Invite Friends to Quiz
            </button>
          </div>
        </div>
      )}

      {/* Quiz Invite Modal */}
      <QuizInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        quizTitle={`${selectedTopic || "Quiz"}`}
        topicId={selectedTopic}
        quizQuestions={questions}
        docText={docText}
        numQuestions={numQuestions}
        selectedTopic={selectedTopic}
        onInviteSent={() => {
          setShowInviteModal(false);
        }}
      />
    </div>
  );
};

export default QuizSection;

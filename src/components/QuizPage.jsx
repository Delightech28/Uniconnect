import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useLocation, Link } from "react-router-dom";
import Footer from "./Footer";
import { Users } from "lucide-react";
import QuizInviteModal from "./QuizInviteModal";
import MultiplayerQuizView from "./MultiplayerQuizView";
import { updatePlayerScore } from "../services/quizMultiplayerService";
import { auth, db } from "../firebase";
import { getDoc, doc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../hooks/useTheme";
// --- Data Layer (No Backend) ---
// This array holds all the quiz questions and answers.
const quizData = [
  {
    id: 1,
    question:
      "What is the fundamental economic problem that all societies face?",
    options: [
      "Technological advancement",
      "Scarcity of resources",
      "Distribution of wealth",
      "Government intervention",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Scarcity is the basic economic problem that arisesbecause people have unlimited wants but resources are limited.",
  },
  {
    id: 2,
    question: "Which of the following is considered a factor of production?",

    options: [
      "Money",
      "Capital (e.g., machinery)",
      "Stocks and bonds",
      "Consumer goods",
    ],
    correctAnswerIndex: 1,
    explanation:
      "The four factors of production are land, labor, capital, and entrepreneurship. Capital includes man-made resources like machinery and tools.",
  },
  {
    id: 3,
    question: "What does the 'Law of Demand' state?",
    options: [
      "As price increases, quantity demanded increases.",
      "Price and quantity demanded are not related.",
      "As price increases, quantity demanded decreases.",
      "As income increases, demand always increases.",
    ],
    correctAnswerIndex: 2,
    explanation:
      "The Law of Demand states that, all other factors being equal, as the price of a good or service increases, consumer demand for the good or service will decrease.",
  },
  {
    id: 4,
    question:
      "An economy operating on its production possibility frontier (PPF) is considered:",
    options: ["Inefficient", "Unattainable", "Efficient", "In recession"],
    correctAnswerIndex: 2,

    explanation:
      "Any point on the PPF curve represents an efficient allocation of resources, meaning the economy is producing as much as it can with its available resources.",
  },
];
// --- Helper Components ---
import AppHeader from "./AppHeader";
// QuizOption Component
const QuizOption = ({
  option,
  index,
  selectedAnswer,
  correctAnswer,
  onSelect,
  isAnswered,
  showAnswerFeedback = true, // For multiplayer, hide feedback until both done
}) => {
  const isSelected = selectedAnswer === index;

  const isCorrect = correctAnswer === index;
  const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
  let buttonClasses =
    "w-full text-left p-4 rounded-lg border-2 transition-colors flex items-center gap-4 ";
  let letterClasses =
    "flex items-center justify-center size-6 rounded-full font-bold ";
  if (isAnswered && showAnswerFeedback) {
    // Only show correct/incorrect feedback if answering is allowed to be shown
    if (isSelected && isCorrect) {
      buttonClasses += "border-success bg-success/10 ring-2 ring-success";
      letterClasses += "bg-success text-white";
    } else if (isSelected && !isCorrect) {
      buttonClasses += "border-error bg-error/10";
      letterClasses += "bg-error text-white";
    } else if (isCorrect) {
      buttonClasses += "border-success bg-success/10";
      // Show correct answer if wrong one was picked
      letterClasses += "bg-success text-white";
    } else {
      buttonClasses +=
        "border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60";
      letterClasses +=
        "bg-slate-200 dark:bg-slate-600 text-secondary dark:text-white";
    }
  } else if (isAnswered && !showAnswerFeedback) {
    // In multiplayer before both are done, show selected answer but no feedback
    if (isSelected) {
      buttonClasses += "border-primary bg-primary/10";
      letterClasses += "bg-primary text-white";
    } else {
      buttonClasses +=
        "border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60";
      letterClasses +=
        "bg-slate-200 dark:bg-slate-600 text-secondary dark:text-white";
    }
  } else {
    buttonClasses +=
      "border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10";
    letterClasses +=
      "bg-slate-200 dark:bg-slate-600 text-secondary dark:text-white";
  }
  return (
    <button
      className={buttonClasses}
      onClick={() => onSelect(index)}
      disabled={isAnswered}
    >
      <div className={letterClasses}>{optionLetter}</div>
      <span
        className="flex-1 text-secondary
dark:text-white"
      >
        {option}
      </span>
      {isAnswered && isSelected && isCorrect && (
        <span
          className="material-symbols-outlined text-success
ml-auto"
        >
          check_circle
        </span>
      )}
      {isAnswered && isSelected && !isCorrect && (
        <span
          className="material-symbols-outlined text-error
ml-auto"
        >
          cancel
        </span>
      )}
    </button>
  );
};
// --- Main Page Component ---
function QuizPage() {
  const location = useLocation();
  const { darkMode, toggleTheme } = useTheme();
  const incoming = location.state && location.state.questions;
  const incomingQuizTitle = location.state && location.state.quizTitle;
  const incomingQuizQuestions = location.state && location.state.quizQuestions;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState(
    incoming && incoming.length
      ? incoming
      : incomingQuizQuestions && incomingQuizQuestions.length
        ? incomingQuizQuestions
        : quizData,
  );
  const [userAnswers, setUserAnswers] = useState(
    Array(questions.length).fill(null),
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [multiplayerSessionId, setMultiplayerSessionId] = useState(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [waitingForMultiplayer, setWaitingForMultiplayer] = useState(false);
  const [quizTitle, setQuizTitle] = useState(
    incomingQuizTitle || "Introduction to Economics Quiz",
  );
  const [opponentScore, setOpponentScore] = useState(null);
  const [opponentName, setOpponentName] = useState(null);
  const initializedFromState = useRef(false);

  useEffect(() => {
    // Only initialize once from location.state, never reset after that
    if (initializedFromState.current) {
      return;
    }

    let questionsToUse = null;
    if (incoming && incoming.length) {
      questionsToUse = incoming;
    } else if (incomingQuizQuestions && incomingQuizQuestions.length) {
      questionsToUse = incomingQuizQuestions;
    }

    if (questionsToUse) {
      setQuestions(questionsToUse);
      setUserAnswers(Array(questionsToUse.length).fill(null));
      setCurrentQuestionIndex(0);
      initializedFromState.current = true;
    }
  }, [incoming, incomingQuizQuestions]);

  // Handle sessionId from URL parameters for multiplayer quiz
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("sessionId");
    if (sessionId) {
      setMultiplayerSessionId(sessionId);
      setWaitingForMultiplayer(true);
      // If we have the quiz title from state, use it
      if (incomingQuizTitle) {
        setQuizTitle(incomingQuizTitle);
      }
      // Fetch session data to get quiz questions
      const fetchSessionData = async () => {
        try {
          const sessionDoc = await getDoc(doc(db, "quizSessions", sessionId));
          if (sessionDoc.exists()) {
            const sessionData = sessionDoc.data();
            if (
              sessionData.quizQuestions &&
              sessionData.quizQuestions.length > 0
            ) {
              setQuestions(sessionData.quizQuestions);
            }
            if (sessionData.quizTitle) {
              setQuizTitle(sessionData.quizTitle);
            }
          }
        } catch (err) {
          console.error("Error fetching session data:", err);
        }
      };
      fetchSessionData();
    }
  }, [location.search, incomingQuizTitle]);
  const [showResults, setShowResults] = useState(false);
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestionIndex];
  const isAnswered = selectedAnswer !== null;
  const handleSelectAnswer = (optionIndex) => {
    if (!isAnswered) {
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestionIndex] = optionIndex;
      setUserAnswers(newAnswers);
    }
  };
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  const handleSubmit = async () => {
    // If multiplayer, update score in the session
    if (isMultiplayer && multiplayerSessionId) {
      try {
        await updatePlayerScore(
          multiplayerSessionId,
          auth.currentUser?.uid,
          score,
        );

        // Fetch session data to get opponent's score
        const sessionDoc = await getDoc(
          doc(db, "quizSessions", multiplayerSessionId),
        );
        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data();
          const isPlayer1 = auth.currentUser?.uid === sessionData.player1Id;
          const opponentScoreValue = isPlayer1
            ? sessionData.player2Score
            : sessionData.player1Score;
          const opponentNameValue = isPlayer1
            ? sessionData.player2Name
            : sessionData.player1Name;

          setOpponentScore(opponentScoreValue);
          setOpponentName(opponentNameValue);
        }
      } catch (error) {
        console.error("Error updating player score:", error);
      }
    }
    setShowResults(true);
  };
  const handleMultiplayerReady = useCallback(() => {
    setWaitingForMultiplayer(false);
    setIsMultiplayer(true);
  }, []);
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers(Array(questions.length).fill(null));
    setShowResults(false);
    setOpponentScore(null);
    setOpponentName(null);
  };

  // Real-time listener for opponent's score in multiplayer
  useEffect(() => {
    if (!isMultiplayer || !multiplayerSessionId || !showResults) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "quizSessions", multiplayerSessionId),
      (doc) => {
        if (doc.exists()) {
          const sessionData = doc.data();
          const isPlayer1 = auth.currentUser?.uid === sessionData.player1Id;
          const opponentScoreValue = isPlayer1
            ? sessionData.player2Score
            : sessionData.player1Score;
          const opponentNameValue = isPlayer1
            ? sessionData.player2Name
            : sessionData.player1Name;

          // Only update if opponent has submitted (score is no longer undefined)
          if (opponentScoreValue !== undefined && opponentScoreValue !== null) {
            setOpponentScore(opponentScoreValue);
            setOpponentName(opponentNameValue);
          }
        }
      },
    );

    return () => unsubscribe();
  }, [isMultiplayer, multiplayerSessionId, showResults]);

  const score = useMemo(() => {
    return userAnswers.reduce((acc, answer, index) => {
      return answer ===
        (questions[index] && questions[index].correctAnswerIndex)
        ? acc + 1
        : acc;
    }, 0);
  }, [userAnswers, questions]);

  const progressPercentage =
    ((currentQuestionIndex + 1) / quizData.length) * 100;
  if (showResults) {
    const isWinner =
      isMultiplayer && opponentScore !== null && score > opponentScore;
    const isLoser =
      isMultiplayer && opponentScore !== null && score < opponentScore;
    const isTie =
      isMultiplayer && opponentScore !== null && score === opponentScore;

    return (
      <div>
        <div
          className="bg-background-light dark:bg-background-dark
font-display text-secondary dark:text-slate-200 min-h-screen flex flex-col"
        >
          <AppHeader />
          <main className="flex-1 px-4 py-8">
            <div
              className="max-w-2xl mx-auto bg-white
dark:bg-secondary rounded-xl shadow-lg p-6 sm:p-8"
            >
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary
dark:text-white text-center"
              >
                {isMultiplayer ? "Quiz Battle Complete! 🎯" : "Quiz Completed!"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
                {isMultiplayer && opponentScore !== null
                  ? "Here are the final scores..."
                  : isMultiplayer && opponentScore === null
                    ? "Waiting for other player to finish..."
                    : "You have successfully finished the quiz."}
              </p>

              {isMultiplayer && opponentScore !== null ? (
                <div className="my-8">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Your Score */}
                    <div
                      className={`p-6 rounded-lg border-2 transition-all ${
                        isWinner
                          ? "bg-success/10 border-success"
                          : isLoser
                            ? "bg-error/10 border-error"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Your Score
                      </p>
                      <p
                        className={`text-4xl font-bold mb-2 ${
                          isWinner
                            ? "text-success"
                            : isLoser
                              ? "text-error"
                              : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {score} / {questions.length}
                      </p>
                      <p
                        className={`text-lg font-medium ${
                          isWinner
                            ? "text-success"
                            : isLoser
                              ? "text-error"
                              : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {((score / questions.length) * 100).toFixed(0)}%
                      </p>
                    </div>

                    {/* Opponent Score */}
                    <div
                      className={`p-6 rounded-lg border-2 transition-all ${
                        isLoser
                          ? "bg-success/10 border-success"
                          : isWinner
                            ? "bg-error/10 border-error"
                            : "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                        {opponentName}'s Score
                      </p>
                      <p
                        className={`text-4xl font-bold mb-2 ${
                          isLoser
                            ? "text-success"
                            : isWinner
                              ? "text-error"
                              : "text-orange-600 dark:text-orange-400"
                        }`}
                      >
                        {opponentScore} / {questions.length}
                      </p>
                      <p
                        className={`text-lg font-medium ${
                          isLoser
                            ? "text-success"
                            : isWinner
                              ? "text-error"
                              : "text-orange-600 dark:text-orange-400"
                        }`}
                      >
                        {((opponentScore / questions.length) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Winner Banner */}
                  <div
                    className={`p-4 rounded-lg text-center font-bold text-lg mb-6 ${
                      isWinner
                        ? "bg-success/20 text-success"
                        : isLoser
                          ? "bg-error/20 text-error"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {isWinner
                      ? "🏆 You Won! Congratulations!"
                      : isLoser
                        ? "Keep practicing! Better luck next time."
                        : "It's a Tie! Well played both of you!"}
                  </div>
                </div>
              ) : isMultiplayer && opponentScore === null ? (
                <div className="my-8">
                  <p className="text-lg text-center mb-6 font-medium text-slate-600 dark:text-slate-300">
                    Your Score:
                  </p>
                  <p
                    className="text-5xl font-bold text-primary
my-2 text-center"
                  >
                    {score} / {questions.length}
                  </p>
                  <p className="text-xl font-medium text-center mb-6">
                    {((score / questions.length) * 100).toFixed(0)}%
                  </p>
                  <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-center font-medium animate-pulse">
                    ⏳ Waiting for {opponentName || "opponent"} to finish...
                  </div>
                </div>
              ) : (
                <div className="my-8">
                  <p className="text-lg text-center mb-4">Your Score:</p>
                  <p
                    className="text-5xl font-bold text-primary
my-2 text-center"
                  >
                    {score} / {questions.length}
                  </p>
                  <p className="text-xl font-medium text-center">
                    {((score / questions.length) * 100).toFixed(0)}%
                  </p>
                </div>
              )}

              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center
gap-2 rounded-lg h-10 sm:h-11 px-4 sm:px-6 bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">refresh</span>
                <span>Take Again</span>
              </button>
            </div>
          </main>
        </div>
        <Footer darkMode={darkMode} />
      </div>
    );
  }
  return (
    <div
      className="bg-background-light dark:bg-background-dark
font-display text-secondary dark:text-slate-200 min-h-screen flex flex-col"
    >
      <div className="relative flex flex-1 h-auto w-full flex-col">
        <AppHeader />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8">
          <div className="flex flex-col max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Link
                to="/study-hub"
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="text-sm font-medium">Back to Study Hub</span>
              </Link>
            </div>
            <div
              className="bg-white dark:bg-secondary rounded-xl
shadow-lg p-6 sm:p-8"
            >
              <div
                className="flex flex-col sm:flex-row justify-between
sm:items-center gap-4 mb-6"
              >
                <div>
                  <h1
                    className="text-2xl font-bold text-secondary
dark:text-white"
                  >
                    {quizTitle}
                  </h1>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <span
                    className="text-sm font-medium text-secondary
dark:text-white bg-primary/10 dark:bg-primary/20 px-3 py-1.5
rounded-full"
                  >
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#07bc0c]/10 text-[#07bc0c] rounded-full hover:bg-[#07bc0c]/20 transition-colors text-sm font-medium"
                    title="Invite others to take quiz"
                  >
                    <Users className="w-4 h-4" />
                    Invite
                  </button>
                </div>
              </div>
              <div
                className="w-full bg-slate-200 dark:bg-slate-700
rounded-full h-2.5 mb-8"
              >
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              {/* Show multiplayer view if waiting for someone to join */}
              {waitingForMultiplayer && (
                <div className="mb-8">
                  <MultiplayerQuizView
                    quizSessionId={multiplayerSessionId}
                    quizTitle={quizTitle}
                    onBothReady={handleMultiplayerReady}
                    isDarkMode={darkMode}
                  />
                </div>
              )}

              {/* Show quiz questions if not waiting for multiplayer */}
              {!waitingForMultiplayer && (
                <>
                  <div>
                    <p
                      className="text-base text-slate-500 dark:text-slate-400
font-medium mb-2"
                    >
                      Multiple Choice Question
                    </p>

                    <h2
                      className="text-xl font-semibold text-secondary
dark:text-white"
                    >
                      {currentQuestion.question}
                    </h2>
                  </div>
                  <div className="mt-6 space-y-4">
                    {currentQuestion.options.map((option, index) => (
                      <QuizOption
                        key={index}
                        option={option}
                        index={index}
                        selectedAnswer={selectedAnswer}
                        correctAnswer={currentQuestion.correctAnswerIndex}
                        onSelect={handleSelectAnswer}
                        isAnswered={isAnswered}
                        showAnswerFeedback={
                          !isMultiplayer ||
                          (isMultiplayer && opponentScore !== null)
                        }
                      />
                    ))}
                  </div>
                  {isAnswered &&
                    (!isMultiplayer ||
                      (isMultiplayer && opponentScore !== null)) && (
                      <div
                        className={`mt-6 p-4 rounded-lg border-l-4
${
  selectedAnswer === currentQuestion.correctAnswerIndex
    ? "bg-success/10 border-success"
    : "bg-error/10 border-error"
}`}
                      >
                        <h3
                          className={`font-bold ${
                            selectedAnswer ===
                            currentQuestion.correctAnswerIndex
                              ? "text-success"
                              : "text-error"
                          }`}
                        >
                          {selectedAnswer === currentQuestion.correctAnswerIndex
                            ? "Correct!"
                            : "Incorrect."}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${
                            selectedAnswer ===
                            currentQuestion.correctAnswerIndex
                              ? "text-success/80 dark:text-success/90"
                              : "text-error/80 dark:text-error/90"
                          }`}
                        >
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}
                  {isAnswered && isMultiplayer && opponentScore === null && (
                    <div className="mt-6 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 border-l-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        ⏳ Waiting for opponent to finish before showing
                        answers...
                      </p>
                    </div>
                  )}

                  <div
                    className="mt-8 pt-6 border-t border-slate-200
dark:border-slate-700 flex flex-col sm:flex-row justify-between
items-center gap-4"
                  >
                    <button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="w-full sm:w-auto flex items-center justify-center
gap-2 rounded-lg h-12 px-6 bg-slate-200 dark:bg-slate-700
text-secondary dark:text-white text-base font-bold hover:bg-slate-300
dark:hover:bg-slate-600 transition-colors disabled:opacity-50
disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">
                        arrow_back
                      </span>
                      <span>Previous</span>
                    </button>
                    {currentQuestionIndex === questions.length - 1 ? (
                      <button
                        onClick={handleSubmit}
                        disabled={!isAnswered}
                        className="w-full sm:w-auto flex items-center
justify-center gap-2 rounded-lg h-12 px-6 bg-accent text-secondary
text-base font-bold hover:bg-accent/90 transition-colors
disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Submit Quiz</span>
                        <span className="material-symbols-outlined">
                          task_alt
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        disabled={!isAnswered}
                        className="w-full sm:w-auto flex items-center
justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-white text-base

font-bold hover:bg-primary/90 transition-colors disabled:opacity-50
disabled:cursor-not-allowed"
                      >
                        <span>Next Question</span>
                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer darkMode={darkMode} />
      {/* Quiz Invite Modal */}
      <QuizInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        quizTitle={quizTitle}
        topicId="economics_101"
        onInviteSent={() => {
          setShowInviteModal(false);
        }}
      />
    </div>
  );
}
export default QuizPage;

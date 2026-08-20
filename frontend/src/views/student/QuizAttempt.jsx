import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import toast from "react-hot-toast";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  Flag,
  HelpCircle,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const QuizAttempt = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Answers state mapping: { question_id: [selected_option_ids] }
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const timerRef = useRef(null);

  // 1. Fetch Quiz Data and Create Attempt on Backend
  useEffect(() => {
    const initializeAttempt = async () => {
      try {
        // Start attempt on backend
        const attemptRes = await API.post(`/quizzes/${quizId}/attempts`);
        const attemptData = attemptRes.data;
        setAttempt(attemptData);

        // Fetch sanitized student questions
        const quizRes = await API.get(`/quizzes/${quizId}/attempt`);
        const quizData = quizRes.data;
        setQuiz(quizData);
        setQuestions(quizData.questions);

        // Calculate timer remaining seconds
        const start = new Date(attemptData.started_at).getTime();
        const duration = quizData.time_limit * 60 * 1000;
        const end = start + duration;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        
        setTimeLeft(remaining);

        // Load cached progress from localStorage (recovery support)
        const cachedAnswers = localStorage.getItem(`attempt_ans_${attemptData.id}`);
        const cachedReview = localStorage.getItem(`attempt_rev_${attemptData.id}`);
        if (cachedAnswers) setAnswers(JSON.parse(cachedAnswers));
        if (cachedReview) setMarkedForReview(JSON.parse(cachedReview));

      } catch (err) {
        console.error("Failed to initialize attempt", err);
        navigate("/student/quizzes");
      } finally {
        setLoading(false);
      }
    };

    initializeAttempt();
  }, [quizId]);

  // 2. Timer countdown mechanism
  useEffect(() => {
    if (timeLeft === null || submitting) return;

    if (timeLeft <= 0) {
      toast.error("Time is up! Submitting your answers automatically...");
      handleFinalSubmit(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitting]);

  // Sync answers to localstorage
  const saveLocalAnswers = (updatedAnswers) => {
    if (attempt) {
      localStorage.setItem(`attempt_ans_${attempt.id}`, JSON.stringify(updatedAnswers));
    }
  };

  const saveLocalReview = (updatedReview) => {
    if (attempt) {
      localStorage.setItem(`attempt_rev_${attempt.id}`, JSON.stringify(updatedReview));
    }
  };

  // Select Option choice handler
  const handleSelectOption = (optionId) => {
    const currentQ = questions[currentIndex];
    const selected = answers[currentQ.id] || [];

    let updated;
    if (currentQ.question_type === "multiple") {
      // Toggle selection for multiple choice
      if (selected.includes(optionId)) {
        updated = selected.filter((id) => id !== optionId);
      } else {
        updated = [...selected, optionId];
      }
    } else {
      // Single choice/Boolean overrides existing selections
      updated = [optionId];
    }

    const nextAnswers = { ...answers, [currentQ.id]: updated };
    setAnswers(nextAnswers);
    saveLocalAnswers(nextAnswers);
  };

  // Clear answer choice for the current question
  const handleClearAnswer = () => {
    const currentQ = questions[currentIndex];
    const nextAnswers = { ...answers };
    delete nextAnswers[currentQ.id];
    setAnswers(nextAnswers);
    saveLocalAnswers(nextAnswers);
  };

  // Toggle mark for review state
  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    const updatedReview = {
      ...markedForReview,
      [currentQ.id]: !markedForReview[currentQ.id]
    };
    setMarkedForReview(updatedReview);
    saveLocalReview(updatedReview);
  };

  // Format seconds -> MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Post scores to backend API
  const handleFinalSubmit = async (autoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, optIds]) => ({
        question_id: parseInt(qId),
        selected_option_ids: optIds
      }));

      // In case user skipped some questions completely, backend handles it.
      const response = await API.post(`/attempts/${attempt.id}/submit`, {
        answers: formattedAnswers
      });
      
      // Clear localstorage caches
      localStorage.removeItem(`attempt_ans_${attempt.id}`);
      localStorage.removeItem(`attempt_rev_${attempt.id}`);
      
      toast.success("Assessment submitted successfully!");
      navigate(`/student/attempts/${attempt.id}/review`);

    } catch (err) {
      console.error("Submission failed", err);
      toast.error("Failed to submit attempt. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading quiz environment...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  // Stat calculations for palette summary
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter((k) => answers[k] && answers[k].length > 0).length;
  const reviewCount = Object.keys(markedForReview).filter((k) => markedForReview[k] === true).length;
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top sticky bar containing timer */}
      <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-950 dark:text-white truncate max-w-sm md:max-w-xl">
            {quiz?.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pass Target: {quiz?.pass_percentage}% | Negatives: -{quiz?.negative_marking} pt
          </p>
        </div>

        {/* Timer UI */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold shadow-sm ${
          timeLeft <= 60 
            ? "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse" 
            : "bg-amber-500/5 text-amber-600 border-amber-500/10"
        }`}>
          <Clock className="w-4 h-4" />
          <span>{formatTime(timeLeft || 0)}</span>
        </div>
      </header>

      {/* Main split work space */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left side: Current Question Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 md:p-8 rounded-2xl shadow-premium">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg">
                {currentQuestion?.points} pt
              </span>
            </div>

            {/* Question Text */}
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-6 select-none">
              {currentQuestion?.question_text}
            </p>

            {/* MCQ Options */}
            <div className="space-y-3">
              {currentQuestion?.options.map((opt) => {
                const isSelected = answers[currentQuestion.id]?.includes(opt.id) || false;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition flex items-start gap-3 select-none ${
                      isSelected
                        ? "bg-amber-500/5 border-amber-500 text-amber-700 dark:text-amber-400"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border font-bold text-[10px] ${
                      isSelected 
                        ? "bg-amber-500 text-white border-amber-500" 
                        : "border-slate-300 dark:border-slate-700"
                    }`}>
                      {currentQuestion.question_type === "multiple" ? "✓" : "●"}
                    </span>
                    {opt.option_text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav Controls footer */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleReview}
                className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-bold transition ${
                  markedForReview[currentQuestion?.id]
                    ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {markedForReview[currentQuestion?.id] ? "Flagged" : "Flag for Review"}
              </button>

              <button
                type="button"
                onClick={handleClearAnswer}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isFirstQuestion}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-sm font-semibold transition disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white rounded-xl text-sm font-bold transition"
                >
                  <Send className="w-4 h-4" />
                  Submit Exam
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 rounded-xl text-sm font-semibold transition"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right side: Palette Sidebar */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Question Palette
            </h2>

            {/* Grid numbers */}
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                const isSelected = idx === currentIndex;
                const isAnswered = answers[q.id] && answers[q.id].length > 0;
                const isFlagged = markedForReview[q.id];

                let btnStyles = "border-slate-250 text-slate-700 dark:border-slate-800 dark:text-slate-400";
                if (isAnswered) btnStyles = "bg-emerald-500 border-emerald-500 text-white";
                if (isFlagged) btnStyles = "bg-purple-500 border-purple-500 text-white";
                if (isSelected) btnStyles = "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900";

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-10 h-10 border rounded-xl flex items-center justify-center text-xs font-bold hover:scale-105 transition-all ${btnStyles}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Stats Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-500"></span>
                <span>Flagged ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="w-3 h-3 rounded border border-slate-300 dark:border-slate-700"></span>
                <span>Unanswered ({totalQuestions - answeredCount})</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-2xl max-w-sm w-full text-center space-y-6 shadow-glass animate-fade-in">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full w-fit mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submit Assessment?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You have answered <strong>{answeredCount}</strong> out of <strong>{totalQuestions}</strong> questions. Are you sure you want to grade your quiz now?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="py-2.5 border border-slate-200 dark:border-slate-850 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Back to Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold rounded-xl shadow-lg transition"
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAttempt;

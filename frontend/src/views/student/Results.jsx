import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../services/api";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react";

const QuizResults = () => {
  const { attemptId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await API.get(`/attempts/${attemptId}/review`);
        setReview(response.data);
        
        // Auto-expand all incorrect answers for explanation review
        const expansions = {};
        response.data.answers.forEach((ans) => {
          if (!ans.is_correct) {
            expansions[ans.question_id] = true;
          }
        });
        setExpandedQuestions(expansions);
      } catch (err) {
        console.error("Failed to load attempt review", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [attemptId]);

  const toggleExpand = (qId) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Attempt results not found.</p>
        <Link to="/student/dashboard" className="text-amber-500 font-bold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const correctAnswersCount = review.answers.filter((a) => a.is_correct).length;
  const totalQuestions = review.answers.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Back button */}
      <Link
        to="/student/attempts"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Attempts
      </Link>

      {/* Results Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-premium text-center space-y-6 relative overflow-hidden">
        {review.passed && (
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl"></div>
        )}
        
        <div className="space-y-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              review.passed
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-red-500/10 text-red-600 border border-red-500/20"
            }`}
          >
            {review.passed ? "Exam Passed" : "Exam Failed"}
          </span>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">
            {review.quiz_title}
          </h1>
        </div>

        {/* Score Ring / Metric */}
        <div className="space-y-1">
          <p className="text-5xl font-black text-slate-950 dark:text-white tracking-tight">
            {review.percentage.toFixed(1)}%
          </p>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Accuracy Score
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto border-t border-slate-100 dark:border-slate-800 pt-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400">Points Earned</span>
            <p className="font-bold text-slate-900 dark:text-white">{review.score.toFixed(1)} pts</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400">Time Taken</span>
            <p className="font-bold text-slate-900 dark:text-white">{Math.floor(review.time_taken / 60)}m {review.time_taken % 60}s</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400">Correct Qs</span>
            <p className="font-bold text-slate-900 dark:text-white">{correctAnswersCount} / {totalQuestions}</p>
          </div>
        </div>

        {/* Certificate issue action */}
        {review.passed && (
          <div className="mt-8 pt-6 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
            <div className="flex items-center gap-3 text-left">
              <Award className="w-10 h-10 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-slate-950 dark:text-white">Certificate generated</p>
                <p className="text-slate-500 dark:text-slate-400">Verification lookup: {review.certificate_code}</p>
              </div>
            </div>
            <a
              href={`http://localhost:8000/api/v1/attempts/${review.id}/certificate`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Download PDF
            </a>
          </div>
        )}
      </div>

      {/* Review breakdown header */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
          Question Breakdown Review
        </h2>

        <div className="space-y-4">
          {review.answers.map((ans, idx) => {
            const isExpanded = expandedQuestions[ans.question_id];
            return (
              <div
                key={ans.question_id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden transition"
              >
                {/* Header item */}
                <button
                  onClick={() => toggleExpand(ans.question_id)}
                  className="w-full flex items-center justify-between p-6 gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 mt-0.5">
                      {ans.is_correct ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                        Question {idx + 1}: {ans.question_text}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Points gained: {ans.points_earned} / {ans.points} pt
                      </p>
                    </div>
                  </div>
                  <span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </span>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 text-sm space-y-4 animate-fade-in">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Question Type: <span className="font-semibold uppercase">{ans.question_type}</span>
                    </div>

                    {/* Explanations block */}
                    {ans.explanation && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Explanation Detail
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {ans.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizResults;

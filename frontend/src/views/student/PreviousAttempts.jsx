import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { History, Award, BookOpen, Clock, Activity } from "lucide-react";

const PreviousAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await API.get("/attempts/me");
        setAttempts(response.data);
      } catch (err) {
        console.error("Failed to load student attempts history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          My Attempts History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review your past assessment transcripts and verification records.
        </p>
      </div>

      {attempts.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="p-6 font-semibold">Quiz Title</th>
                  <th className="p-6 font-semibold">Score / Status</th>
                  <th className="p-6 font-semibold">Time Elapsed</th>
                  <th className="p-6 font-semibold">Date Completed</th>
                  <th className="p-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {attempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-6">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {attempt.quiz_title}
                      </p>
                      <span className="text-xs text-slate-400">
                        Attempt Ref ID: #{attempt.id}
                      </span>
                    </td>
                    <td className="p-6 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-850 dark:text-slate-200">
                          {attempt.score.toFixed(1)} pts
                        </span>
                        <span className="text-xs text-slate-400">({attempt.percentage.toFixed(1)}%)</span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          attempt.passed
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 border border-red-500/20"
                        }`}
                      >
                        {attempt.passed ? "PASSED" : "FAILED"}
                      </span>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-slate-400 font-semibold">
                      {Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s
                    </td>
                    <td className="p-6 text-slate-500 dark:text-slate-400">
                      {new Date(attempt.started_at).toLocaleString()}
                    </td>
                    <td className="p-6 text-right space-x-4">
                      <Link
                        to={`/student/attempts/${attempt.id}/review`}
                        className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-amber-500 hover:opacity-80 transition"
                      >
                        Review Answers
                      </Link>
                      {attempt.passed && (
                        <a
                          href={`http://localhost:8000/api/v1/attempts/${attempt.id}/certificate`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Certificate
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6 text-slate-400">
          <History className="w-16 h-16 mb-4 stroke-1 text-slate-350" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No attempts logged yet</p>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            You haven't completed any assessments. Click "Explore Quizzes" above to begin your first quiz.
          </p>
        </div>
      )}
    </div>
  );
};

export default PreviousAttempts;

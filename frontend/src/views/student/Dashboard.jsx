import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import {
  Trophy,
  CheckCircle,
  FileText,
  Activity,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get("/analytics/student");
        setStats(response.data);
      } catch (err) {
        console.error("Failed to load student analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Attempts",
      value: stats?.total_attempts || 0,
      icon: Activity,
      color: "text-blue-500 bg-blue-500/10"
    },
    {
      name: "Passed Quizzes",
      value: stats?.passed_attempts || 0,
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-500/10"
    },
    {
      name: "Avg Percentage",
      value: `${(stats?.average_percentage || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-amber-500 bg-amber-500/10"
    },
    {
      name: "Avg Points Score",
      value: (stats?.average_score || 0).toFixed(1),
      icon: Trophy,
      color: "text-rose-500 bg-rose-500/10"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview of your performance and recent activities.
          </p>
        </div>
        <Link
          to="/student/quizzes"
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-semibold rounded-xl transition shadow-lg self-start"
        >
          Explore Quizzes
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-premium flex items-center justify-between transition-all hover:-translate-y-0.5"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {card.name}
              </span>
              <p className="text-2xl font-black text-slate-950 dark:text-white">
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Performance by Category
          </h2>
          
          {stats?.performance_by_category?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.performance_by_category}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="category_name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                  />
                  <Bar dataKey="avg_score" fill="#d97706" radius={[4, 4, 0, 0]} name="Average Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl text-center p-6 text-slate-400">
              <BookOpen className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm font-semibold">No category statistics available</p>
              <p className="text-xs text-slate-500 max-w-xs">Take some quizzes first to build your category profile.</p>
            </div>
          )}
        </div>

        {/* Strengthen Section */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Platform Certification
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Score at least the required passing percentage on any published quiz to obtain an official verification certificate. Download and showcase it.
            </p>
          </div>
          <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center gap-4">
            <Award className="w-12 h-12 text-amber-500 stroke-1 shrink-0" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900 dark:text-white">Earn Verification Codes</p>
              <p className="text-slate-500 dark:text-slate-400">Certificates are cryptographically signed with unique serial lookup identifiers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Attempts</h2>
        {stats?.recent_attempts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Quiz Title</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Accuracy</th>
                  <th className="pb-3 font-semibold">Date Completed</th>
                  <th className="pb-3 font-semibold">Result</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {stats.recent_attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 font-semibold text-slate-900 dark:text-white">
                      {attempt.quiz_title}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                      {attempt.score.toFixed(1)} pts
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                      {attempt.percentage.toFixed(1)}%
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">
                      {new Date(attempt.started_at).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          attempt.passed
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 border border-red-500/20"
                        }`}
                      >
                        {attempt.passed ? "PASSED" : "FAILED"}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-3">
                      <Link
                        to={`/student/attempts/${attempt.id}/review`}
                        className="text-xs font-bold text-slate-900 dark:text-amber-500 hover:underline"
                      >
                        Review
                      </Link>
                      {attempt.passed && (
                        <a
                          href={`http://localhost:8000/api/v1/attempts/${attempt.id}/certificate`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                        >
                          Certificate
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
            <FileText className="w-12 h-12 mb-3 stroke-1" />
            <p className="text-sm font-semibold">No recent quiz attempts found</p>
            <p className="text-xs text-slate-500">Go explore the quizzes page and take your first attempt!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

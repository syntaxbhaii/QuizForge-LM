import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import {
  Users,
  BookOpen,
  FileText,
  Layers,
  TrendingUp,
  Activity,
  CheckCircle,
  PlusCircle
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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get("/analytics/admin");
        setStats(response.data);
      } catch (err) {
        console.error("Failed to load admin dashboard analytics", err);
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
      name: "Total Students",
      value: stats?.total_students || 0,
      icon: Users,
      color: "text-blue-500 bg-blue-500/10"
    },
    {
      name: "Quizzes Created",
      value: stats?.total_quizzes || 0,
      icon: BookOpen,
      color: "text-amber-500 bg-amber-500/10"
    },
    {
      name: "Total Attempts",
      value: stats?.total_attempts || 0,
      icon: Activity,
      color: "text-emerald-500 bg-emerald-500/10"
    },
    {
      name: "Active Categories",
      value: stats?.total_categories || 0,
      icon: Layers,
      color: "text-rose-500 bg-rose-500/10"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Workspace Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor registration metrics, quiz results, and pass rates.
          </p>
        </div>
        <Link
          to="/admin/quizzes"
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-semibold rounded-xl transition shadow-lg self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Quiz
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-premium flex items-center justify-between transition hover:-translate-y-0.5"
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

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pass rate chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Pass Rates by Quiz
          </h2>

          {stats?.quiz_pass_rates?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.quiz_pass_rates}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="quiz_title" stroke="#64748b" fontSize={11} tickLine={false} />
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
                  <Bar dataKey="pass_rate" fill="#d97706" radius={[4, 4, 0, 0]} name="Pass Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
              <BookOpen className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm font-semibold">No quiz metrics available</p>
              <p className="text-xs text-slate-500 mt-0.5">Students must complete quiz attempts first.</p>
            </div>
          )}
        </div>

        {/* Monthly attempt trends summary */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Platform Status
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Platform is currently running in local development test modes. Email triggers are simulated, saving raw transcript text files to your stdout/logging buffer.
            </p>
          </div>
          <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 stroke-1 shrink-0" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-slate-900 dark:text-white">Relational Integrity</p>
              <p className="text-slate-500 dark:text-slate-400">PostgreSQL is enforced with cascading deletion rules on categories and attempts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent attempt lists */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Global Attempts</h2>
        {stats?.recent_attempts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Student Name</th>
                  <th className="pb-3 font-semibold">Quiz Title</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Accuracy</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Date Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {stats.recent_attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">
                      {attempt.user_name}
                    </td>
                    <td className="py-4 font-medium text-slate-700 dark:text-slate-350">
                      {attempt.quiz_title}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">
                      {attempt.score.toFixed(1)} pts
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400">
                      {attempt.percentage.toFixed(1)}%
                    </td>
                    <td className="py-4">
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
                    <td className="py-4 text-right text-slate-400">
                      {new Date(attempt.started_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-450 text-center">
            <FileText className="w-12 h-12 mb-3 stroke-1" />
            <p className="text-sm font-semibold">No recent global attempts found</p>
            <p className="text-xs text-slate-500 mt-0.5">Attempts will appear here once students start testing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

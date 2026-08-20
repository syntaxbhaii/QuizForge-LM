import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { Trophy, Medal, Star, Target } from "lucide-react";

const StudentLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState("overall");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/leaderboard/?timeframe=${timeframe}`);
        setLeaderboard(response.data);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [timeframe]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-500" />
          Leaderboard Standings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Compete with other students and check rankings based on total points and accuracy.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl w-fit">
        {["overall", "monthly", "weekly"].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition ${
              timeframe === tf
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-premium"
                : "text-slate-550 dark:text-slate-450 hover:bg-white/50 dark:hover:bg-slate-800/30"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="p-6 font-semibold w-24">Rank</th>
                  <th className="p-6 font-semibold">Student Name</th>
                  <th className="p-6 font-semibold">Total Points</th>
                  <th className="p-6 font-semibold">Accuracy</th>
                  <th className="p-6 font-semibold text-right">Quizzes Finished</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {leaderboard.map((entry) => {
                  // Style top 3 ranks
                  let rankCell = (
                    <span className="font-extrabold text-slate-500">{entry.rank}</span>
                  );
                  if (entry.rank === 1) {
                    rankCell = (
                      <span className="flex items-center justify-center w-7 h-7 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full font-black text-xs">
                        <Medal className="w-3.5 h-3.5" />
                      </span>
                    );
                  } else if (entry.rank === 2) {
                    rankCell = (
                      <span className="flex items-center justify-center w-7 h-7 bg-slate-300/20 border border-slate-350 text-slate-400 dark:text-slate-300 rounded-full font-black text-xs">
                        2
                      </span>
                    );
                  } else if (entry.rank === 3) {
                    rankCell = (
                      <span className="flex items-center justify-center w-7 h-7 bg-amber-800/10 border border-amber-800/20 text-amber-850 dark:text-amber-700 rounded-full font-black text-xs">
                        3
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={entry.user_id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="p-6 font-bold">{rankCell}</td>
                      <td className="p-6">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {entry.full_name}
                        </p>
                        <span className="text-[10px] text-slate-400">ID: #{entry.user_id}</span>
                      </td>
                      <td className="p-6 font-bold text-slate-850 dark:text-slate-200">
                        {entry.total_score.toFixed(1)} pts
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          <Target className="w-4 h-4 text-slate-400" />
                          {entry.accuracy.toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-6 text-right font-bold text-slate-900 dark:text-white">
                        {entry.quizzes_taken}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6 text-slate-400">
          <Medal className="w-16 h-16 mb-4 stroke-1 text-slate-350" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300 font-sans">Leaderboard empty</p>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            No student attempts logged for the {timeframe} timeframe. Be the first to score!
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentLeaderboard;

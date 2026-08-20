import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { Search, Filter, BookOpen, Clock, HelpCircle, AlertTriangle } from "lucide-react";

const ExploreQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [quizRes, catRes] = await Promise.all([
          API.get("/quizzes/"),
          API.get("/categories/")
        ]);
        setQuizzes(quizRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error("Failed to fetch quizzes list", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(search.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(search.toLowerCase());
      
    const matchesCategory =
      selectedCategory === "" || quiz.category_id === parseInt(selectedCategory);
      
    return matchesSearch && matchesCategory;
  });

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
          Explore Quizzes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Browse published assessments and test your knowledge.
        </p>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes by title or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
        
        {/* Category select */}
        <div className="relative w-full sm:w-64">
          <Filter className="absolute top-1/2 left-3.5 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none"
          >
            <option value="" className="dark:bg-slate-900">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-premium p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-lg transition duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {quiz.category_name}
                  </span>
                  {quiz.negative_marking > 0 && (
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-red-550/10">
                      <AlertTriangle className="w-3 h-3" />
                      Negative Marking
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                    {quiz.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                    {quiz.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-slate-500 dark:text-slate-400 text-xs">
                  <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-1 text-center">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.time_limit}m</span>
                    <span className="text-[10px] text-slate-400">Duration</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-1 text-center">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Yes</span>
                    <span className="text-[10px] text-slate-400">Questions</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-1 text-center">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.max_attempts}</span>
                    <span className="text-[10px] text-slate-400">Max Attempts</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Pass Target: {quiz.pass_percentage}%
                </span>
                
                <Link
                  to={`/student/quizzes/${quiz.id}/attempt`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white rounded-xl text-sm font-semibold transition"
                >
                  Start Assessment
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6 text-slate-400">
          <BookOpen className="w-16 h-16 mb-4 stroke-1 text-slate-300 dark:text-slate-700" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-350">No quizzes match your filters</p>
          <p className="text-sm text-slate-500 max-w-sm mt-1">Try clearing your search query or choosing another category.</p>
        </div>
      )}
    </div>
  );
};

export default ExploreQuizzes;

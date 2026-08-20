import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import API from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2, BookOpen, Settings, HelpCircle, FileText, ToggleLeft, ToggleRight, X } from "lucide-react";

const ManageQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [passPercentage, setPassPercentage] = useState(50.0);
  const [negativeMarking, setNegativeMarking] = useState(0.0);
  const [randomQuestions, setRandomQuestions] = useState(false);
  const [randomOptions, setRandomOptions] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const loadData = async () => {
    try {
      const [quizRes, catRes] = await Promise.all([
        API.get("/quizzes/"),
        API.get("/categories/")
      ]);
      setQuizzes(quizRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateForm = () => {
    setEditingQuiz(null);
    setTitle("");
    setDescription("");
    setCategoryId(categories[0]?.id || "");
    setTimeLimit(30);
    setMaxAttempts(3);
    setPassPercentage(50.0);
    setNegativeMarking(0.0);
    setRandomQuestions(false);
    setRandomOptions(false);
    setStartsAt("");
    setEndsAt("");
    setIsPublished(false);
    setShowForm(true);
  };

  const openEditForm = (quiz) => {
    setEditingQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description || "");
    setCategoryId(quiz.category_id);
    setTimeLimit(quiz.time_limit);
    setMaxAttempts(quiz.max_attempts);
    setPassPercentage(quiz.pass_percentage);
    setNegativeMarking(quiz.negative_marking);
    setRandomQuestions(quiz.random_questions);
    setRandomOptions(quiz.random_options);
    
    // Formatting date strings for inputs
    setStartsAt(quiz.starts_at ? new Date(quiz.starts_at).toISOString().slice(0, 16) : "");
    setEndsAt(quiz.ends_at ? new Date(quiz.ends_at).toISOString().slice(0, 16) : "");
    setIsPublished(quiz.is_published);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      title,
      description: description || null,
      category_id: parseInt(categoryId),
      time_limit: parseInt(timeLimit),
      max_attempts: parseInt(maxAttempts),
      pass_percentage: parseFloat(passPercentage),
      negative_marking: parseFloat(negativeMarking),
      random_questions: randomQuestions,
      random_options: randomOptions,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_published: isPublished
    };

    try {
      if (editingQuiz) {
        await API.put(`/quizzes/${editingQuiz.id}`, payload);
        toast.success("Quiz configuration updated successfully!");
      } else {
        await API.post("/quizzes/", payload);
        toast.success("Quiz created successfully!");
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePublish = async (quiz) => {
    try {
      await API.put(`/quizzes/${quiz.id}`, {
        is_published: !quiz.is_published
      });
      toast.success(quiz.is_published ? "Quiz unpublished (Draft mode)" : "Quiz published successfully!");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this quiz? All question items and attempt results will be erased!")) {
      return;
    }
    try {
      await API.delete(`/quizzes/${id}`);
      toast.success("Quiz deleted successfully!");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Quiz Assessments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create assessment blueprints, manage timers, and publish exam questions.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-semibold rounded-xl shadow-md transition self-start"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
        </button>
      </div>

      {/* Grid List of Quizzes */}
      {quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium p-6 flex flex-col justify-between hover:shadow-lg transition duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {quiz.category_name}
                  </span>
                  <button
                    onClick={() => togglePublish(quiz)}
                    className="flex items-center gap-1.5 focus:outline-none"
                    title={quiz.is_published ? "Unpublish" : "Publish"}
                  >
                    {quiz.is_published ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-550/10 flex items-center gap-1">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        Draft
                      </span>
                    )}
                  </button>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {quiz.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
                    {quiz.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-500">
                  <div>
                    Timer: <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.time_limit} mins</span>
                  </div>
                  <div>
                    Max Attempts: <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.max_attempts}</span>
                  </div>
                  <div>
                    Negative Penalty: <span className="font-semibold text-slate-800 dark:text-slate-200">-{quiz.negative_marking} pt</span>
                  </div>
                  <div>
                    Pass Mark: <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.pass_percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between gap-2">
                <Link
                  to={`/admin/quizzes/${quiz.id}/questions`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-amber-500 transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Manage Qs
                </Link>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(quiz)}
                    className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg transition"
                    title="Edit Quiz"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="p-2 bg-red-500/10 text-red-650 rounded-lg hover:bg-red-500/20 transition"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6 text-slate-400">
          <BookOpen className="w-16 h-16 mb-4 stroke-1 text-slate-350" />
          <p className="text-lg font-bold text-slate-755 dark:text-slate-300">No quizzes constructed yet</p>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Build your first evaluation quiz. Start by creating metadata, and then populate the questions.
          </p>
        </div>
      )}

      {/* Creation Modal form */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-glass space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {editingQuiz ? "Edit Quiz Settings" : "Configure New Assessment"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures and Algorithms"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about parameters, rules, and topics."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category Group
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-slate-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Maximum Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pass Target Score (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={passPercentage}
                    onChange={(e) => setPassPercentage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Negative Marking Points (Wrong Ans)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={String(isPublished)}
                    onChange={(e) => setIsPublished(e.target.value === "true")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="false">Keep as Draft</option>
                    <option value="true">Publish Immediately</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Starts At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ends At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="col-span-2 flex flex-wrap gap-6 pt-2 text-sm">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={randomQuestions}
                      onChange={(e) => setRandomQuestions(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                    />
                    Randomize Question Order
                  </label>
                  
                  <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={randomOptions}
                      onChange={(e) => setRandomOptions(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                    />
                    Randomize Options Order
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-sm font-semibold rounded-xl text-slate-655 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Save Quiz Configuration
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageQuizzes;

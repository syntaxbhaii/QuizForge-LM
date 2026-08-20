import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../services/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Upload,
  Check,
  X,
  HelpCircle,
  AlertCircle
} from "lucide-react";

const ManageQuestions = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Question form states
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("single");
  const [points, setPoints] = useState(1.0);
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState([
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false }
  ]);

  // Bulk Import file states
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);

  const fetchQuestions = async () => {
    try {
      const response = await API.get(`/quizzes/${quizId}`);
      setQuiz(response.data);
      setQuestions(response.data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  // Sync boolean template options
  useEffect(() => {
    if (questionType === "boolean" && !editingQuestion) {
      setOptions([
        { option_text: "True", is_correct: true },
        { option_text: "False", is_correct: false }
      ]);
    } else if (questionType !== "boolean" && options.length === 2 && options[0].option_text === "True") {
      setOptions([
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false }
      ]);
    }
  }, [questionType]);

  const handleAddOptionField = () => {
    if (options.length >= 5) return;
    setOptions([...options, { option_text: "", is_correct: false }]);
  };

  const handleRemoveOptionField = (idx) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx, field, value) => {
    const updated = options.map((opt, i) => {
      if (i === idx) {
        return { ...opt, [field]: value };
      }
      // For single-choice / boolean, only one correct option allowed
      if (field === "is_correct" && value === true && (questionType === "single" || questionType === "boolean")) {
        return { ...opt, is_correct: false };
      }
      return opt;
    });
    setOptions(updated);
  };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setQuestionText("");
    setQuestionType("single");
    setPoints(1.0);
    setExplanation("");
    setOptions([
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false }
    ]);
    setShowForm(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setQuestionText(q.question_text);
    setQuestionType(q.question_type);
    setPoints(q.points);
    setExplanation(q.explanation || "");
    setOptions(q.options.map(opt => ({
      option_text: opt.option_text,
      is_correct: opt.is_correct
    })));
    setShowForm(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!questionText.trim()) return;
    
    const validOptions = options.filter(opt => opt.option_text.trim());
    if (validOptions.length < 2) {
      toast.error("Please add at least 2 valid option choices.");
      return;
    }

    const correctCount = validOptions.filter(o => o.is_correct).length;
    if (correctCount === 0) {
      toast.error("Please flag at least one option as correct.");
      return;
    }

    if ((questionType === "single" || questionType === "boolean") && correctCount !== 1) {
      toast.error("Single-choice and boolean questions must have exactly one correct option.");
      return;
    }

    const payload = {
      question_text: questionText,
      question_type: questionType,
      points: parseFloat(points),
      explanation: explanation || null,
      options: validOptions
    };

    try {
      if (editingQuestion) {
        await API.put(`/questions/${editingQuestion.id}`, payload);
        toast.success("Question updated successfully!");
      } else {
        await API.post(`/quizzes/${quizId}/questions`, payload);
        toast.success("Question created successfully!");
      }
      setShowForm(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question item?")) return;
    try {
      await API.delete(`/questions/${id}`);
      toast.success("Question removed!");
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportErrors([]);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      await API.post(`/quizzes/${quizId}/questions/import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("CSV import finished successfully!");
      setImportFile(null);
      setShowImport(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
      const errDetails = err.response?.data?.detail;
      if (errDetails && Array.isArray(errDetails.errors)) {
        setImportErrors(errDetails.errors);
      }
    } finally {
      setImporting(false);
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
      <Link
        to="/admin/quizzes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Quizzes
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {quiz?.title} Question Bank
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Questions: <span className="font-semibold">{questions.length}</span> | Pass Target: <span className="font-semibold">{quiz?.pass_percentage}%</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-slate-655 dark:text-slate-350 text-sm font-semibold rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Import CSV
          </button>
          
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold rounded-xl text-sm shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      {/* CSV Import Widget */}
      {showImport && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-premium space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              Upload Question CSV / Excel spreadsheet
            </h2>
            <button
              onClick={() => setShowImport(false)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="md:col-span-2 space-y-3">
              <p>
                Follow the standard upload column schema for questions. Supported headers: <code>question_text</code>, <code>question_type</code> (<code>single</code>, <code>multiple</code>, <code>boolean</code>), <code>points</code>, <code>explanation</code>, <code>option_1</code>, <code>option_1_correct</code> (<code>true</code>/<code>false</code>), etc.
              </p>
              <form onSubmit={handleImportSubmit} className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  required
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:bg-slate-950"
                />
                <button
                  type="submit"
                  disabled={importing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-amber-500 hover:opacity-85 text-white dark:text-slate-950 text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {importing ? "Importing..." : "Upload File"}
                </button>
              </form>

              {importErrors.length > 0 && (
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Validation error logs:
                  </div>
                  <ul className="text-xs text-red-500 list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Template actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Download Template</p>
                <p className="text-xs text-slate-400 mt-1">Get our sample CSV structure, pre-configured with examples, to organize your files.</p>
              </div>
              <a
                href="http://localhost:8000/api/v1/templates/questions"
                className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-amber-500 hover:bg-slate-50 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Template.csv
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Questions List Render */}
      {questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-premium space-y-4 relative overflow-hidden"
            >
              {/* Question card header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Question {idx + 1} • {q.question_type}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white mt-2">
                    {q.question_text}
                  </h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-655 px-2.5 py-1 rounded-lg shrink-0">
                    {q.points} pt
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-550 dark:text-slate-400 rounded-lg"
                      title="Edit Question"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Options list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 font-medium ${
                      opt.is_correct
                        ? "bg-emerald-500/5 border-emerald-550/30 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] font-black ${
                      opt.is_correct
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "border-slate-300 dark:border-slate-700"
                    }`}>
                      {opt.is_correct ? "✓" : " "}
                    </span>
                    {opt.option_text}
                  </div>
                ))}
              </div>

              {/* Explanation section */}
              {q.explanation && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-350">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center p-6 text-slate-400">
          <HelpCircle className="w-16 h-16 mb-4 stroke-1 text-slate-350" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Question bank is empty</p>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Construct questions manually using "Add Question" or import bulk lists from spreadsheet templates.
          </p>
        </div>
      )}

      {/* Manual Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-glass space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {editingQuestion ? "Edit Question Item" : "Create New Question"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Text
                </label>
                <textarea
                  required
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Which keyword is block-scoped in JavaScript?"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Question Response Type
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none dark:bg-slate-900"
                  >
                    <option value="single">Single Choice (MCQ)</option>
                    <option value="multiple">Multiple Choice (MRQ)</option>
                    <option value="boolean">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Graded Points
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    required
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Option Controls
                  </label>
                  {questionType !== "boolean" && (
                    <button
                      type="button"
                      disabled={options.length >= 5}
                      onClick={handleAddOptionField}
                      className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                    >
                      + Add Option Option
                    </button>
                  )}
                </div>
              </div>

              {/* Options details list */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Option Choices & Marking Keys
                </label>
                
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => handleOptionChange(idx, "is_correct", !opt.is_correct)}
                      className={`px-3 py-2 border rounded-xl text-xs font-semibold transition shrink-0 ${
                        opt.is_correct
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                          : "border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {opt.is_correct ? "Correct Choice" : "Incorrect"}
                    </button>

                    <input
                      type="text"
                      required
                      disabled={questionType === "boolean"}
                      placeholder={`Option Choice ${idx + 1}`}
                      value={opt.option_text}
                      onChange={(e) => handleOptionChange(idx, "option_text", e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                    />

                    {questionType !== "boolean" && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionField(idx)}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl shrink-0 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Explanation details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide reference explanation, shown to students during score reviews."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuestions;

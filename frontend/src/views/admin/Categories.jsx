import React, { useState, useEffect } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2, Check, X, Layers } from "lucide-react";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit state variables
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await API.get("/categories/");
      setCategories(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await API.post("/categories/", { name, description });
      toast.success("Category created successfully!");
      setName("");
      setDescription("");
      setShowAddForm(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await API.put(`/categories/${id}`, {
        name: editName,
        description: editDescription
      });
      toast.success("Category updated successfully!");
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category? This will delete all quizzes under this category!")) {
      return;
    }
    try {
      await API.delete(`/categories/${id}`);
      toast.success("Category deleted successfully!");
      fetchCategories();
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
            Quiz Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize assessments under custom topics.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-semibold rounded-xl shadow-md transition self-start"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {/* Inline Create Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-premium animate-fade-in">
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Algebra, Arithmetic, Logic"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition animate-fade-in"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List Table */}
      {categories.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="p-6 font-semibold">Category Name</th>
                  <th className="p-6 font-semibold">Description</th>
                  <th className="p-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-6">
                      {editingId === cat.id ? (
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {cat.name}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-slate-500 dark:text-slate-400">
                      {editingId === cat.id ? (
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      ) : (
                        cat.description || "No description provided."
                      )}
                    </td>
                    <td className="p-6 text-right">
                      {editingId === cat.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(cat.id)}
                            className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500/20"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-amber-500 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
          <Layers className="w-16 h-16 mb-4 stroke-1 text-slate-350" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No categories found</p>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Create categories to group quizzes and track performance trends.
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import toast from "react-hot-toast";
import { Sparkles, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Password reset request logged.");
    } catch (err) {
      // Handled by API client interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Quiz<span className="text-amber-500">Forge</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Recover your account password
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-premium">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Check your Inbox
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                If the email address <strong>{email}</strong> exists on our platform, we have sent a simulated email containing a password reset token. Check your server logs or backend console!
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Back to{" "}
          <Link
            to="/login"
            className="font-bold text-amber-500 hover:text-amber-600 transition"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

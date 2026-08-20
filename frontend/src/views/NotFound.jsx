import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full mb-6">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 font-sans">
        404 — Page Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
        The URL path you were looking for doesn't exist or has been shifted. Check the link or log in again.
      </p>
      <Link
        to="/login"
        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold rounded-xl shadow-lg transition"
      >
        Go to Login
      </Link>
    </div>
  );
};

export default NotFound;

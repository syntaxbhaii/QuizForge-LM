import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  Compass,
  History,
  Trophy,
  User,
  Sun,
  Moon,
  LogOut,
  Menu,
  X
} from "lucide-react";

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navigation = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Explore Quizzes", href: "/student/quizzes", icon: Compass },
    { name: "My Attempts", href: "/student/attempts", icon: History },
    { name: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
    { name: "My Profile", href: "/student/profile", icon: User },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-colors">
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-800">
          <Link to="/student/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Quiz<span className="text-amber-500">Forge</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-premium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer options */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
              {user?.full_name}
            </span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay and Menu) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-4/5 max-w-sm h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Quiz<span className="text-amber-500">Forge</span>
              </span>
            </div>

            <nav className="flex-1 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-premium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {user?.full_name}
                </span>
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md transition-colors">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden md:flex items-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Welcome back, {user?.full_name?.split(" ")[0]}!
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
              Student Panel
            </div>
          </div>
        </header>

        {/* Content Outlet scroll area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;

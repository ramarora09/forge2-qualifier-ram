import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';

// Pages
import DashboardPage from './pages/DashboardPage';
import BoardsListPage from './pages/BoardsListPage';
import BoardPage from './pages/BoardPage';
import TeamPage from './pages/TeamPage';

function Navigation() {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const isActive = (path) => {
    return location.pathname.startsWith(path)
      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 font-semibold'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800/60';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/80 transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5">
                <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-200">
              KanbanFlow
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link to="/dashboard" className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
            <Link to="/boards" className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isActive('/boards')}`}>
              Boards
            </Link>
            <Link to="/team" className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isActive('/team')}`}>
              Team Members
            </Link>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {/* Quick Info */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-800">
            <img 
              src="https://api.dicebear.com/7.x/adventurer/svg?seed=admin" 
              alt="User profile" 
              className="h-8 w-8 rounded-lg bg-slate-100 ring-2 ring-blue-500/10 dark:bg-slate-800"
            />
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 lg:inline-block">
              Workspace Admin
            </span>
          </div>
        </div>
      </div>

      {/* Mobile nav indicator bar */}
      <div className="md:hidden flex justify-around border-t border-slate-150 py-2 dark:border-slate-800">
        <Link to="/dashboard" className={`text-xs px-4 py-1 rounded-md ${isActive('/dashboard')}`}>
          Dashboard
        </Link>
        <Link to="/boards" className={`text-xs px-4 py-1 rounded-md ${isActive('/boards')}`}>
          Boards
        </Link>
        <Link to="/team" className={`text-xs px-4 py-1 rounded-md ${isActive('/team')}`}>
          Team
        </Link>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <Navigation />
        
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 mx-auto w-full max-w-7xl">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/boards" element={<BoardsListPage />} />
            <Route path="/boards/:id" element={<BoardPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-200/50 bg-white/40 py-6 text-center text-xs text-slate-400 dark:border-slate-800/40 dark:bg-slate-950/40">
          <p>© {new Date().getFullYear()} KanbanFlow SaaS platform. Built for deployment.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

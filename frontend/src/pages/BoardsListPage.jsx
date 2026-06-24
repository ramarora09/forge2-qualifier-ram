const DEFAULT_BG = 'from-blue-600 to-sky-500';

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { boardAPI } from '../services/api';

function BoardsListPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const data = await boardAPI.getAll();
      setBoards(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching boards:', err);
      setError('Failed to fetch project boards. Please check your API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await boardAPI.create(newTitle.trim(), newDescription.trim());
      setBoards(prev => [created, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating board:', err);
      alert('Failed to create board. Make sure the backend is reachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBoard = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the board "${title}"? This will delete all its lists and cards.`)) {
      return;
    }

    try {
      await boardAPI.delete(id);
      setBoards(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting board:', err);
      alert('Failed to delete board.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your boards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Project Boards</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage your team’s custom workspaces.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 hover:bg-blue-500 hover:scale-102 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Board
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grid of Boards */}
      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
          <div className="rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No boards found</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Get started by creating your very first workspace board.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 hover:scale-102 transition-all duration-200 cursor-pointer"
          >
            Create Board
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map(board => (
            <div 
              key={board.id} 
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Card visual banner */}
              <div className="h-20 bg-gradient-to-r from-blue-600 to-sky-500 relative flex items-end p-4">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleDeleteBoard(board.id, board.title)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition-colors cursor-pointer"
                    title="Delete board"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4.5 w-4.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Card body info */}
              <div className="flex-1 p-5 space-y-2">
                <Link to={`/boards/${board.id}`}>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors">
                    {board.title}
                  </h3>
                </Link>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {board.description || 'No description provided.'}
                </p>
              </div>

              {/* Card actions footer */}
              <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Created {new Date(board.created_at).toLocaleDateString()}
                </span>
                <Link
                  to={`/boards/${board.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Open Board
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.63l-3-3a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06l3-3H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Board Modal overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Create New Workspace Board</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="mt-4 space-y-4">
              <div>
                <label htmlFor="title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Board Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Marketing Campaign, Q4 Sprint"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="desc" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Description
                </label>
                <textarea
                  id="desc"
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summarize the board's purpose or project scope..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 hover:scale-102 transition-transform cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardsListPage;

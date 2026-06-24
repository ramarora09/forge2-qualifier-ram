import { useState, useEffect } from 'react';
import { memberAPI } from '../services/api';

function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await memberAPI.getAll();
      setMembers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load team directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setIsSubmitting(true);
      setFormError(null);
      const created = await memberAPI.create(name.trim(), email.trim(), avatarUrl.trim() || null);
      setMembers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setEmail('');
      setAvatarUrl('');
    } catch (err) {
      console.error('Error adding member:', err);
      const msg = err.response?.data?.error || 'Failed to add team member.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the team directory? This will unassign them from all cards.`)) {
      return;
    }

    try {
      await memberAPI.delete(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting member:', err);
      alert('Failed to remove team member.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Team Directory</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Register new team members and manage cards assignment targets.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Left Side: Add Team Member Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Add New Member
          </h2>

          <form onSubmit={handleAddMember} className="mt-4 space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Charlie Parker"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="charlie@company.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="avatar" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400 text-slate-500">
                Avatar Image URL <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="url"
                id="avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1.5 text-[10px] text-slate-400">
                If left blank, an avatar is auto-generated using their name seed.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 hover:bg-blue-500 disabled:opacity-50 hover:scale-102 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'Add Team Member'}
            </button>
          </form>
        </div>

        {/* Right Side: Active Members List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Active Directory ({members.length})</h2>
          </div>

          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">No team members registered yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {members.map(member => (
                <div 
                  key={member.id}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={member.avatar_url} 
                      alt={member.name}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(member.name)}`;
                      }}
                      className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 object-cover"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{member.name}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="opacity-0 group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 dark:hover:bg-red-950/20 transition-all duration-200 cursor-pointer"
                    title="Remove member"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4.5 w-4.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamPage;

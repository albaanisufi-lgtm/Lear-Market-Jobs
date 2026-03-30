'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { JobApplication, ApplicationStatus, AdminProfile, AdminRole, MarketLocation, ApplicationLabel, LABELS } from '@/lib/types';
import ApplicationModal from './ApplicationModal';
import PositionsManager from './PositionsManager';
import UsersManager from './UsersManager';

const STATUSES: ApplicationStatus[] = [
  'Pending',
  'Reviewing',
  'Accepted',
  'Rejected',
];

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Reviewing: 'bg-blue-100 text-blue-800',
  Accepted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

const STAT_CARDS = [
  { label: 'Gjithsej', key: 'total', color: 'border-l-4 border-[#0f2d5c]' },
  { label: 'Prikëse', key: 'pending', color: 'border-l-4 border-yellow-400' },
  { label: 'Në Shqyrtim', key: 'reviewing', color: 'border-l-4 border-blue-400' },
  { label: 'Pranuar', key: 'accepted', color: 'border-l-4 border-green-500' },
  { label: 'Refuzuar', key: 'rejected', color: 'border-l-4 border-red-400' },
] as const;

export default function AdminDashboard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState('Të gjitha Pozicionet');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLocation, setFilterLocation] = useState('Të gjitha Lokacionet');
  const [filterLabel, setFilterLabel] = useState('Të gjitha Etiketat');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState<'applications' | 'positions' | 'users'>('applications');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState<AdminRole>('editor');

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const fetchPositions = useCallback(async () => {
    const { data } = await supabase
      .from('job_positions')
      .select('title')
      .order('title');
    if (data) {
      setPositions(data.map((p: { title: string }) => p.title));
    }
  }, [supabase]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApplications(data as JobApplication[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchApplications();
    fetchPositions();
    // Fetch current user + their admin profile
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const email = data.user.email ?? '';
      setAdminEmail(email);
      supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (!profile) {
            // First login — auto-create editor profile
            supabase.from('admin_profiles').insert({
              user_id: data.user!.id,
              full_name: email.split('@')[0],
              role: 'editor',
            });
            setAdminRole('editor');
          } else {
            setAdminRole((profile as AdminProfile).role);
          }
        });
    });
  }, [fetchApplications, fetchPositions, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const clearFilters = () => {
    setSearch('');
    setFilterPosition('Të gjitha Pozicionet');
    setFilterStatus('All');
    setFilterLocation('Të gjitha Lokacionet');
    setFilterLabel('Të gjitha Etiketat');
    setFilterDate('');
  };

  const hasActiveFilters =
    search || filterPosition !== 'Të gjitha Pozicionet' || filterStatus !== 'All' || filterLocation !== 'Të gjitha Lokacionet' || filterLabel !== 'Të gjitha Etiketat' || filterDate;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      const matchSearch =
        !q ||
        app.full_name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.phone.includes(q);
      const matchPosition =
        filterPosition === 'Të gjitha Pozicionet' || app.position === filterPosition;
      const matchStatus =
        filterStatus === 'All' || app.status === filterStatus;
      const matchLocation =
        filterLocation === 'Të gjitha Lokacionet' || app.location === filterLocation;
      const matchLabel =
        filterLabel === 'Të gjitha Etiketat'
          ? true
          : filterLabel === 'Pa Etiketë'
          ? app.label == null
          : app.label === filterLabel;
      const matchDate =
        !filterDate || app.created_at.startsWith(filterDate);

      return matchSearch && matchPosition && matchStatus && matchLocation && matchLabel && matchDate;
    });
  }, [applications, search, filterPosition, filterStatus, filterLocation, filterLabel, filterDate]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === 'Pending').length,
      reviewing: applications.filter((a) => a.status === 'Reviewing').length,
      accepted: applications.filter((a) => a.status === 'Accepted').length,
      rejected: applications.filter((a) => a.status === 'Rejected').length,
    }),
    [applications]
  );

  const handleUpdated = (updated: JobApplication) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelectedApp(updated);
  };

  const handleDeleted = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setSelectedApp(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-[#0f2d5c] text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#0f2d5c] font-black text-xs">LM</span>
              </div>
              <div>
                <span className="font-bold text-base leading-tight">
                  LEAR MARKET
                </span>
                <span className="text-blue-300 text-xs ml-2">Paneli i Administrimit</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-0">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'applications'
                  ? 'border-[#0f2d5c] text-[#0f2d5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                Aplikimet
                {stats.pending > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold bg-red-500 text-white rounded-full">
                    {stats.pending}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'positions'
                  ? 'border-[#0f2d5c] text-[#0f2d5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pozitat e Punës
            </button>
            {adminRole === 'editor' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-[#0f2d5c] text-[#0f2d5c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Perdëoruesit
            </button>
            )}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Positions Manager Tab ── */}
        {activeTab === 'positions' && (
          <PositionsManager onPositionsChanged={fetchPositions} />
        )}

        {/* ── Users Manager Tab ── */}
        {activeTab === 'users' && adminRole === 'editor' && (
          <UsersManager currentUserId={adminEmail} />
        )}

        {activeTab === 'applications' && (<>
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {STAT_CARDS.map(({ label, key, color }) => (
            <div
              key={key}
              className={`bg-white rounded-xl shadow-sm p-4 ${color}`}
            >
              <p className="text-2xl font-bold text-gray-900">
                {stats[key]}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Kërkoni sipas emrit, emailit ose telefonit…"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Position filter */}
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Të gjitha Pozicionet">Të gjitha Pozicionet</option>
              {positions.map((p, i) => (
                <option key={i} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Location filter */}
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Të gjitha Lokacionet">Të gjitha Lokacionet</option>
              <option value="LEAR MARKET 1">LEAR MARKET 1</option>
              <option value="LEAR MARKET 2">LEAR MARKET 2</option>
            </select>

            {/* Label filter */}
            <select
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Të gjitha Etiketat">Të gjitha Etiketat</option>
              <option value="Pa Etiketë">Pa Etiketë</option>
              {LABELS.map((l) => (
                <option key={l.value} value={l.value}>{l.value}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Të gjitha Statuset</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Date filter */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Aplikimet{' '}
              <span className="text-gray-400 font-normal">
                ({filtered.length})
              </span>
            </h2>
            <button
              onClick={fetchApplications}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex items-center gap-3 text-gray-500">
                <svg
                  className="animate-spin h-6 w-6 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Duke ngarkuar aplikimet…
              </div>
            </div>
          ) : filtered.length === 0 ? (
            /* Empty State */
            <div className="text-center py-24">
              <svg
                className="mx-auto w-12 h-12 text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 font-medium">Nuk u gjetën aplikime</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Pastro filtrat
                </button>
              )}
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Aplikuesi</th>
                    <th className="px-6 py-3.5">Pozicioni</th>
                    <th className="px-6 py-3.5 hidden lg:table-cell">Lokacioni</th>
                    <th className="px-6 py-3.5">Kontakti</th>
                    <th className="px-6 py-3.5 hidden md:table-cell">Qyteti</th>
                    <th className="px-6 py-3.5 hidden lg:table-cell">
                      Disponueshmëria
                    </th>
                    <th className="px-6 py-3.5">Statusi</th>
                    <th className="px-6 py-3.5 hidden xl:table-cell">Etiketa</th>
                    <th className="px-6 py-3.5 hidden sm:table-cell">Data</th>
                    <th className="px-6 py-3.5">Veprim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Photo + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={app.profile_image_url}
                            alt={app.full_name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0"
                          />
                          <span className="font-medium text-gray-900 whitespace-nowrap">
                            {app.full_name}
                          </span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                        {app.position}
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
                          {(app as JobApplication & { location?: MarketLocation }).location ?? '—'}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-gray-800">{app.email}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {app.phone}
                        </p>
                      </td>

                      {/* City */}
                      <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                        {app.city ?? '—'}
                      </td>

                      {/* Availability */}
                      <td className="px-6 py-4 text-gray-500 capitalize hidden lg:table-cell">
                        {app.availability ?? '—'}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            STATUS_BADGE[app.status]
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      {/* Label Badge */}
                      <td className="px-6 py-4 hidden xl:table-cell">
                        {app.label ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            LABELS.find((l) => l.value === app.label)?.bg ?? 'bg-gray-100'
                          } ${
                            LABELS.find((l) => l.value === app.label)?.text ?? 'text-gray-700'
                          }`}>
                            {app.label}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-gray-400 whitespace-nowrap hidden sm:table-cell">
                        {new Date(app.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Shiko
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>)}
      </main>

      {/* Application Detail Modal */}
      {selectedApp && (
        <ApplicationModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          adminEmail={adminEmail}
          isEditor={adminRole === 'editor'}
        />
      )}
    </div>
  );
}

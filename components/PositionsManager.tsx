'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MarketLocation, LOCATIONS } from '@/lib/types';

interface Position {
  id: string;
  title: string;
  location: MarketLocation;
  created_at: string;
}

export default function PositionsManager({ onPositionsChanged }: { onPositionsChanged?: () => void }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState<MarketLocation>('LEAR MARKET 1');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_positions')
      .select('*')
      .order('location')
      .order('title');
    if (!error && data) setPositions(data as Position[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    setError(null);

    const title = newTitle.trim();
    if (!title) {
      setInputError('Emri i pozitÃ«s nuk mund tÃ« jetÃ« bosh.');
      return;
    }
    if (positions.some((p) => p.title.toLowerCase() === title.toLowerCase() && p.location === newLocation)) {
      setInputError('Kjo pozitÃ« ekziston tashmÃ« pÃ«r kÃ«tÃ« lokacion.');
      return;
    }

    setIsAdding(true);
    const { data, error } = await supabase
      .from('job_positions')
      .insert({ title, location: newLocation })
      .select()
      .single();

    if (error || !data) {
      setError('Ndodhi njÃ« gabim gjatÃ« shtimit. Provoni pÃ«rsÃ«ri.');
    } else {
      setPositions((prev) => [...prev, data as Position].sort((a, b) => a.location.localeCompare(b.location) || a.title.localeCompare(b.title)));
      setNewTitle('');
      onPositionsChanged?.();
    }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    const { error } = await supabase.from('job_positions').delete().eq('id', id);
    if (error) {
      setError('Ndodhi njÃ« gabim gjatÃ« fshirjes.');
    } else {
      setPositions((prev) => prev.filter((p) => p.id !== id));
      onPositionsChanged?.();
    }
    setDeletingId(null);
  };

  const grouped = LOCATIONS.map((loc) => ({
    ...loc,
    items: positions.filter((p) => p.location === loc.value),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Menaxho Pozitat e PunÃ«s</h2>
        <p className="text-sm text-gray-500 mt-1">
          Shtoni pozita ndamas pÃ«r secilÃ«n pikÃ« tÃ« marketit.
        </p>
      </div>

      {/* Add Position Form */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Shto PozitÃ« tÃ« Re</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Location selector */}
          <select
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value as MarketLocation)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
          >
            {LOCATIONS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <div className="flex-1 flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => { setNewTitle(e.target.value); setInputError(null); }}
                placeholder="p.sh. Menaxher Shitjesh"
                className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  inputError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {inputError && <p className="mt-1.5 text-xs text-red-600">{inputError}</p>}
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="px-5 py-2.5 bg-[#0f2d5c] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3d7a] disabled:opacity-60 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              {isAdding ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Shto
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Positions grouped by location */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Duke ngarkuarâ€¦
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {grouped.map((group) => (
            <div key={group.value} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-[#0f2d5c] text-white">
                <p className="text-sm font-bold">{group.value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{group.label.split('â€” ')[1]}</p>
              </div>
              <div className="px-5 py-2 text-xs text-gray-400 border-b border-gray-100">
                {group.items.length} pozita
              </div>
              {group.items.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Nuk ka pozita. Shtoni nga formulari lart.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {group.items.map((pos, i) => (
                    <li key={pos.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                        <span className="text-sm font-medium text-gray-800">{pos.title}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(pos.id)}
                        disabled={deletingId === pos.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === pos.id ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



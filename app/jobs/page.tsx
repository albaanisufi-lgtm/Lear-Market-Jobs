import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LOCATIONS, MarketLocation } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Position {
  id: string;
  title: string;
  location: MarketLocation;
  created_at: string;
}

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: positions } = await supabase
    .from('job_positions')
    .select('id, title, location, created_at')
    .order('location')
    .order('title');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0f2d5c] text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#0f2d5c] font-black text-xs">LM</span>
              </div>
              <span className="font-bold text-base">LEAR MARKET</span>
            </div>
            <Link
              href="/apply"
              prefetch={false}
              className="text-sm text-blue-200 hover:text-white transition-colors"
            >
              Apliko Tani →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Pozitat e Hapura
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-6">
            Bashkohu me ekipin tonë. Zgjidhni pozicionin që të intereson dhe
            dërgoni aplikimin tuaj.
          </p>
        </div>

        {/* Positions by Location */}
        {!positions || positions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-lg">
              Nuk ka pozita të hapura për momentin.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Kontrolloni përsëri së shpejti.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {LOCATIONS.map((loc) => {
              const locPositions = (positions as Position[]).filter(
                (p) => p.location === loc.value
              );
              if (locPositions.length === 0) return null;
              return (
                <div key={loc.value}>
                  {/* Location Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="bg-[#0f2d5c] text-white px-4 py-2 rounded-xl">
                      <p className="font-bold text-sm">{loc.value}</p>
                      <p className="text-xs text-blue-200">{loc.label.split('— ')[1]}</p>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-400">{locPositions.length} pozit{locPositions.length === 1 ? 'ë' : 'a'}</span>
                  </div>

                  {/* Position Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {locPositions.map((pos) => (
                      <div
                        key={pos.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-[#0f2d5c]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h2 className="font-semibold text-gray-900 text-base leading-snug">
                              {pos.title}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Pozitë e hapur
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/apply?location=${encodeURIComponent(loc.value)}&position=${encodeURIComponent(pos.title)}`}
                          prefetch={false}
                          className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f2d5c] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3d7a] transition-colors"
                        >
                          Apliko për këtë Pozitë
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
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Footer CTA */}
        {positions && positions.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Nuk gjeni pozitën tuaj?{' '}
              <Link
                href="/apply"
                prefetch={false}
                className="text-[#0f2d5c] font-semibold hover:underline"
              >
                Dërgoni aplikim të hapur
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

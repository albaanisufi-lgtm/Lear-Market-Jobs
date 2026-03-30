import type { Metadata } from 'next';
import Link from 'next/link';
import ApplicationFormClient from '@/components/ApplicationFormClient';

export const metadata: Metadata = {
  title: 'Apliko për Punë | LEAR MARKET',
  description:
    'Dërgoni aplikimin tuaj për punë në LEAR MARKET. Jemi duke punësuar — plotësoni formularin më poshtë.',
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-[#0f2d5c] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#0f2d5c] font-black text-sm">LM</span>
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">LEAR MARKET</p>
              <p className="text-blue-300 text-xs leading-tight">Portali i Karrierës</p>
            </div>
          </div>
          <Link
            href="/jobs"
            className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Shiko Pozitat
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-[#0f2d5c] text-white pb-12 pt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Bashkohu me Ekipin Tonë</h1>
          <p className="text-blue-200 text-lg max-w-2xl leading-relaxed">
            Kërkojmë individë të pasionuar dhe të dedicuar për të rritur së bashku.
            Plotësoni formularin më poshtë — nuk nevojitet llogari.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <ApplicationFormClient />
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} LEAR MARKET. Të gjitha të drejtat e rezervuara.
      </footer>
    </div>
  );
}

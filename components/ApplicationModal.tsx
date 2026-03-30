'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { JobApplication, ApplicationStatus, ApplicationLabel, LABELS } from '@/lib/types';
import NotesPanel from './NotesPanel';

interface Props {
  application: JobApplication;
  onClose: () => void;
  onUpdated: (updated: JobApplication) => void;
  onDeleted: (id: string) => void;
  adminEmail: string;
  isEditor: boolean;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Pending',
  'Reviewing',
  'Accepted',
  'Rejected',
];

const STATUS_STYLES: Record<ApplicationStatus, { badge: string; ring: string }> = {
  Pending: {
    badge: 'bg-yellow-100 text-yellow-800',
    ring: 'ring-yellow-400',
  },
  Reviewing: {
    badge: 'bg-blue-100 text-blue-800',
    ring: 'ring-blue-400',
  },
  Accepted: {
    badge: 'bg-green-100 text-green-800',
    ring: 'ring-green-400',
  },
  Rejected: {
    badge: 'bg-red-100 text-red-800',
    ring: 'ring-red-400',
  },
};

export default function ApplicationModal({
  application,
  onClose,
  onUpdated,
  onDeleted,
  adminEmail,
  isEditor,
}: Props) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [label, setLabel] = useState<ApplicationLabel | null>(application.label ?? null);
  const [showCvPreview, setShowCvPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supabase = createClient();

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    const { data, error } = await supabase
      .from('job_applications')
      .update({ status, label })
      .eq('id', application.id)
      .select()
      .single();

    if (error || !data) {
      setSaveError('Ndodhi një gabim. Provoni përsëri.');
    } else {
      onUpdated(data as JobApplication);
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', application.id);

    if (error) {
      setSaveError('Failed to delete application.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    } else {
      onDeleted(application.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            Detajet e Aplikimit
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Applicant Header */}
          <div className="flex items-start gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={application.profile_image_url}
              alt={application.full_name}
              className="w-24 h-24 rounded-xl object-cover ring-2 ring-gray-200 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-0.5">
                {application.full_name}
              </h3>
              <p className="text-[#0f2d5c] font-semibold mb-2">
                {application.position}
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_STYLES[application.status].badge
                  }`}
                >
                  {application.status}
                </span>
                {application.availability && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {application.availability}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Aplikoi{' '}
                {new Date(application.created_at).toLocaleString('sq-AL', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Contact & Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Email', value: application.email },
              { label: 'Telefon', value: application.phone },
              { label: 'Lokacioni', value: application.location ?? '—' },
              { label: 'Qyteti', value: application.city ?? '—' },
              {
                label: 'Disponueshmëria',
                value: application.availability ?? '—',
                capitalize: true,
              },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-400 mb-0.5">
                  {label}
                </p>
                <p
                  className={`text-sm text-gray-900 break-words ${capitalize ? 'capitalize' : ''}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Work Experience */}
          {application.experience && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Eksperienca e Punës
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {application.experience}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {application.cover_letter && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Letër Motivuese
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {application.cover_letter}
              </div>
            </div>
          )}

          {/* CV Preview */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Dokumentet
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <a
                href={application.cv_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
                Shkarko CV
              </a>
              <button
                type="button"
                onClick={() => setShowCvPreview((p) => !p)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
              >
                {showCvPreview ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Mbyll Preview
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Shiko PDF
                  </>
                )}
              </button>
            </div>
            {showCvPreview && (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <iframe
                  src={application.cv_file_url}
                  title="CV Preview"
                  className="w-full h-[540px]"
                />
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Status Selector */}
          {isEditor && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Ndrysho Statusin
            </h4>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    status === s
                      ? `${STATUS_STYLES[s].badge} border-transparent ring-2 ring-offset-1 ${STATUS_STYLES[s].ring}`
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Label Selector */}
          {isEditor && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Etiketa
            </h4>
            <div className="flex flex-wrap gap-2">
              {LABELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLabel(label === l.value ? null : l.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    label === l.value
                      ? `${l.bg} ${l.text} border-transparent ring-2 ring-offset-1 ${l.ring}`
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {l.value}
                </button>
              ))}
              {label && (
                <button
                  type="button"
                  onClick={() => setLabel(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-400 hover:bg-gray-50 transition-all"
                >
                  × Hiq Etiketën
                </button>
              )}
            </div>
          </div>
          )}

          {/* Internal Notes */}
          <NotesPanel
            applicationId={application.id}
            adminEmail={adminEmail}
            isEditor={isEditor}
          />

          {/* Error */}
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {/* Delete */}
            {isEditor && (!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Fshi Aplikimin
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Jeni të sigurt?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {isDeleting ? 'Duke fshirë…' : 'Po, Fshi'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Anulo
                </button>
              </div>
            ))}

            {/* Save / Close */}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Mbyll
              </button>
              {isEditor && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#0f2d5c] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3d7a] disabled:opacity-60 transition-colors inline-flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Duke ruajtur…
                  </>
                ) : (
                  'Ruaj Statusin'
                )}
              </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ApplicationNote } from '@/lib/types';

interface Props {
  applicationId: string;
  adminEmail: string;
  isEditor: boolean;
}

export default function NotesPanel({ applicationId, adminEmail, isEditor }: Props) {
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from('application_notes')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });
    if (data) setNotes(data as ApplicationNote[]);
    setLoading(false);
  }, [applicationId, supabase]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAdd = async () => {
    const content = newNote.trim();
    if (!content) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('application_notes')
      .insert({ application_id: applicationId, content, created_by: adminEmail })
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [...prev, data as ApplicationNote]);
      setNewNote('');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('application_notes').delete().eq('id', id);
    if (!error) setNotes((prev) => prev.filter((n) => n.id !== id));
    setDeletingId(null);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('sq-AL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">
        Shënime të Brendshme
        {notes.length > 0 && (
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({notes.length})
          </span>
        )}
      </h4>

      {/* Notes thread */}
      {loading ? (
        <p className="text-xs text-gray-400 py-2">Duke ngarkuar…</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 italic">
          Nuk ka shënime ende. {isEditor ? 'Shtoni shënimin e parë.' : ''}
        </p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 relative group"
            >
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400">
                  {note.created_by} · {formatTime(note.created_at)}
                </span>
                {isEditor && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {deletingId === note.id ? '…' : 'Fshi'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add note */}
      {isEditor && (
        <div className="flex gap-2 items-end">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd();
            }}
            rows={2}
            placeholder="Shtoni shënim privat… (Ctrl+Enter për ruajtje)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newNote.trim()}
            className="px-3 py-2 bg-[#0f2d5c] text-white rounded-lg text-sm font-medium hover:bg-[#1a3d7a] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {saving ? '…' : 'Shto'}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminProfile, AdminRole } from '@/lib/types';

interface Props {
  currentUserId: string; // current admin's email (used for display, not id)
}

export default function UsersManager({ currentUserId }: Props) {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const supabase = createClient();

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('admin_profiles')
      .select('*')
      .order('created_at');
    if (data) setProfiles(data as AdminProfile[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleRoleChange = async (userId: string, role: AdminRole) => {
    setUpdatingId(userId);
    await supabase
      .from('admin_profiles')
      .update({ role })
      .eq('user_id', userId);
    setProfiles((prev) =>
      prev.map((p) => (p.user_id === userId ? { ...p, role } : p))
    );
    setUpdatingId(null);
  };

  const handleInvite = async () => {
    if (!newEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    const { error } = await supabase.auth.admin.inviteUserByEmail(newEmail.trim());

    if (error) {
      // inviteUserByEmail requires service_role key (not available client-side)
      // Instead, use signUp with a temp password and flag profile
      setInviteError(
        'Ftesa direkte kërkon akses nga paneli Supabase. Krijoni llogarinë nga: supabase.com/dashboard → Authentication → Users → Invite.'
      );
    } else {
      setInviteSuccess(true);
      setNewEmail('');
      setNewName('');
    }
    setInviting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Si të shtoni admin të ri:</strong> Shkoni te{' '}
        <a
          href="https://supabase.com/dashboard/project/txvibsdlgzjyobtraior/auth/users"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Supabase → Authentication → Users → Invite
        </a>{' '}
        dhe futni emailin. Pasi të logohet për herë të parë, do të shfaqet këtu
        dhe mund të ndryshoni rolin e tij.
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Administratorët
            {profiles.length > 0 && (
              <span className="ml-2 text-gray-400 font-normal text-sm">
                ({profiles.length})
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Duke ngarkuar…
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Nuk ka profile admini. Logohuni dhe rifreskoni.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Emri</th>
                <th className="px-6 py-3.5">User ID</th>
                <th className="px-6 py-3.5">Roli</th>
                <th className="px-6 py-3.5">Shtuar më</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((p) => (
                <tr key={p.user_id} className="hover:bg-gray-50/70">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {p.full_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs truncate max-w-[140px]">
                    {p.user_id.slice(0, 8)}…
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={p.role}
                      disabled={updatingId === p.user_id}
                      onChange={(e) =>
                        handleRoleChange(p.user_id, e.target.value as AdminRole)
                      }
                      className={`px-2.5 py-1 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        p.role === 'editor'
                          ? 'border-green-300 text-green-700'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      <option value="editor">Editor (i plotë)</option>
                      <option value="viewer">Viewer (lexim)</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(p.created_at).toLocaleDateString('sq-AL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role legend */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
        <p>
          <span className="font-semibold text-green-700">Editor</span> — Akses
          i plotë: shiko, ndrysho status, shto shënime, fshi aplikime, menaxho
          pozitat dhe përdoruesit.
        </p>
        <p>
          <span className="font-semibold text-gray-700">Viewer</span> — Vetëm
          lexim: shiko aplikimet dhe shënimet, pa mundësi ndryshimi.
        </p>
      </div>
    </div>
  );
}

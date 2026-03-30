export type ApplicationStatus = 'Pending' | 'Reviewing' | 'Accepted' | 'Rejected';
export type AdminRole = 'editor' | 'viewer';
export type MarketLocation = 'LEAR MARKET 1' | 'LEAR MARKET 2';
export type ApplicationLabel = 'Prioritet i Lartë' | 'Kandidat i Mundshëm' | 'Në Pritje të Dokumenteve' | 'Shënuar';

export const LOCATIONS: { value: MarketLocation; label: string }[] = [
  { value: 'LEAR MARKET 1', label: 'LEAR MARKET 1 — rr. Nënë Tereza' },
  { value: 'LEAR MARKET 2', label: 'LEAR MARKET 2 — rr. Fehmi Agani' },
];

export const LABELS: { value: ApplicationLabel; bg: string; text: string; ring: string }[] = [
  { value: 'Prioritet i Lartë',          bg: 'bg-red-100',    text: 'text-red-800',    ring: 'ring-red-400' },
  { value: 'Kandidat i Mundshëm',         bg: 'bg-green-100',  text: 'text-green-800',  ring: 'ring-green-400' },
  { value: 'Në Pritje të Dokumenteve',    bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-400' },
  { value: 'Shënuar',                     bg: 'bg-blue-100',   text: 'text-blue-800',   ring: 'ring-blue-400' },
];

export interface JobApplication {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  city: string | null;
  position: string;
  location: MarketLocation;
  experience: string | null;
  cover_letter: string | null;
  availability: string | null;
  profile_image_url: string;
  cv_file_url: string;
  status: ApplicationStatus;
  label: ApplicationLabel | null;
  admin_notes: string | null;
  created_at: string;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface AdminProfile {
  user_id: string;
  full_name: string;
  role: AdminRole;
  created_at: string;
}

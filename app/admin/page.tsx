import type { Metadata } from 'next';
import AdminDashboard from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard | LEAR MARKET',
};

export default function AdminPage() {
  return <AdminDashboard />;
}

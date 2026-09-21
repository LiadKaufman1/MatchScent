import { checkAdminAuth } from '@/lib/actions';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAuthenticated = await checkAdminAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Fetch all perfumes and dupes
  const { data: perfumes } = await getSupabaseAdmin().from('perfumes').select('*').order('brand', { ascending: true });
  const { data: dupes } = await getSupabaseAdmin().from('dupes').select('*').order('similarity_score', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'var(--font-playfair)' }}>
          MatchScent Admin Dashboard
        </h1>
        <AdminDashboard perfumes={perfumes || []} dupes={dupes || []} />
      </div>
    </div>
  );
}

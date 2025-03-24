import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import AdminNav from '@/components/admin/AdminNav';
import SignOutButton from '@/components/admin/SignOutButton';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Islamic Trivia THR App',
  description: 'Manage Islamic Trivia THR games, questions, and rewards',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const session = await getSession();
  
  // If not logged in, middleware will handle redirect
  if (!session?.user) {
    redirect('/signin');
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold">Islamic Trivia Admin</span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative flex items-center space-x-4">
                <span>{session.user.name}</span>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex">
          <AdminNav />
          <main className="flex-1 bg-white shadow overflow-hidden sm:rounded-lg p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 
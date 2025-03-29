import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import AdminNav from '@/components/admin/AdminNav';
import SignOutButton from '@/components/admin/SignOutButton';
import AdminTutorial from '@/components/ui/AdminTutorial';

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                <img src="/thr-logo.svg" alt="Islamic Trivia Logo" className="h-8 w-8 mr-2" />
                <span className="text-xl font-semibold tracking-tight">Islamic Trivia Admin</span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white font-bold">
                    {session.user.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="text-sm font-medium">{session.user.name}</span>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          <AdminNav />
          <main className="flex-1">
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Islamic Trivia THR App © {new Date().getFullYear()} | Made with ❤️ for Eid al-Fitr
          </p>
        </div>
      </footer>

      {/* Admin Tutorial Component */}
      <AdminTutorial />
    </div>
  );
} 
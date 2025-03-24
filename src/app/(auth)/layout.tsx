import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Authentication - Islamic Trivia THR App',
  description: 'Sign in or create an account to manage your Islamic Trivia THR games',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const session = await getSession();
  
  // If already logged in, redirect to dashboard
  if (session?.user) {
    redirect('/admin/dashboard');
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 
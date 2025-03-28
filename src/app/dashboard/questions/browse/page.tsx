import { Metadata } from 'next';
import Link from 'next/link';
import QuestionBrowser from '@/components/admin/QuestionBrowser';
import dbConnect from '@/lib/db/connection';
import { getSession } from '@/lib/auth/session';
import { Question } from '@/lib/db/models';

export const metadata: Metadata = {
  title: 'Browse Questions - Islamic Trivia THR',
  description: 'Browse and explore questions from all users',
};

export default async function BrowseQuestionsPage() {
  await dbConnect();
  const session = await getSession();
  
  // Get available categories for filtering
  const categories = await Question.distinct('category');
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Browse All Questions</h1>
          <p className="text-gray-500">Explore questions from all rooms and users</p>
        </div>
        <Link 
          href="/dashboard/questions"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to My Questions
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <QuestionBrowser categories={categories} currentUserId={session?.user?.id || ''} />
      </div>
    </div>
  );
} 
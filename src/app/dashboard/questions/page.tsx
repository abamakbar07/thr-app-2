import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Question, Room } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Questions - Islamic Trivia THR',
  description: 'Manage your Islamic Trivia questions',
};

export default async function QuestionsPage() {
  await dbConnect();
  const session = await getSession();
  
  // Get rooms created by the user to filter questions
  const userRooms = await Room.find({ createdBy: session?.user?.id }).select('_id');
  const roomIds = userRooms.map(room => room._id);
  
  // Fetch questions for these rooms
  const questions = await Question.find({ roomId: { $in: roomIds } })
    .populate('roomId', 'name')
    .sort({ createdAt: -1 });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Questions</h1>
        <div className="flex space-x-3">
          <Link 
            href="/dashboard/questions/browse"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse All Questions
          </Link>
          <Link 
            href="/dashboard/questions/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Question
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {questions.length > 0 ? (
            questions.map((question) => (
              <li key={question._id.toString()}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-indigo-600 truncate">{question.text}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Room: {question.roomId ? question.roomId.name : 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          question.difficulty === 'bronze' ? 'bg-amber-100 text-amber-800' : 
                          question.difficulty === 'silver' ? 'bg-gray-200 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {question.category}
                        </span>
                        <Link
                          href={`/dashboard/questions/view/${question._id}`}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/rooms/${question.roomId._id}/questions/${question._id}/edit`}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new question or exploring others.
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <Link
                  href="/dashboard/questions/browse"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Browse Questions
                </Link>
                <Link
                  href="/dashboard/questions/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Question
                </Link>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
} 
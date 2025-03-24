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
        <h1 className="text-2xl font-bold">Questions</h1>
        <Link 
          href="/dashboard/questions/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Question
        </Link>
      </div>
      
      {questions.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {questions.map((question) => (
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
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {question.category}
                        </span>
                        <Link
                          href={`/dashboard/questions/${question._id}/edit`}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">Options:</p>
                        <ul className="mt-1 ml-4 list-disc">
                          {question.options.map((option: string, index: number) => (
                            <li key={index} className={option === question.correctAnswer ? 'text-green-600 font-semibold' : ''}>
                              {option} {option === question.correctAnswer && '(Correct)'}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Points: {question.points}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="mt-2 text-lg font-medium text-gray-900">No questions found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new question.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/questions/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create New Question
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db/connection';
import { Room, Question } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Room Questions - Islamic Trivia THR',
  description: 'Manage questions for your Islamic Trivia game room',
};

interface QuestionsPageProps {
  params: {
    roomId: string;
  };
}

export default async function QuestionsPage({ params }: QuestionsPageProps) {
  await dbConnect();
  const session = await getSession();

  // Fetch room and verify ownership
  const room = await Room.findOne({ 
    _id: params.roomId, 
    createdBy: session?.user?.id 
  });

  if (!room) {
    notFound();
  }

  // Fetch questions for this room
  const questions = await Question.find({ roomId: params.roomId })
    .sort({ createdAt: -1 });

  // Group questions by difficulty
  const questionsByDifficulty = {
    bronze: questions.filter(q => q.difficulty === 'bronze'),
    silver: questions.filter(q => q.difficulty === 'silver'),
    gold: questions.filter(q => q.difficulty === 'gold'),
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Questions for {room.name}</h1>
          <p className="text-gray-500">Manage questions in this game room</p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href={`/dashboard/rooms/${params.roomId}/questions/new`} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Question
          </Link>
          <Link 
            href={`/dashboard/rooms/${params.roomId}/questions/import`} 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Import Questions
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bronze Questions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
          <div className="bg-amber-100 px-4 py-2 border-b border-amber-200">
            <h2 className="font-semibold text-amber-800">Bronze (Easy)</h2>
            <p className="text-sm text-amber-700">{questionsByDifficulty.bronze.length} questions</p>
          </div>
          <div className="p-4">
            {questionsByDifficulty.bronze.length > 0 ? (
              <ul className="divide-y divide-amber-200">
                {questionsByDifficulty.bronze.map(question => (
                  <li key={question._id.toString()} className="py-3">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{question.text}</p>
                      <Link 
                        href={`/dashboard/rooms/${params.roomId}/questions/${question._id}/edit`}
                        className="ml-2 text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Category: {question.category}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No bronze questions yet</p>
            )}
          </div>
        </div>
        
        {/* Silver Questions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">Silver (Medium)</h2>
            <p className="text-sm text-gray-600">{questionsByDifficulty.silver.length} questions</p>
          </div>
          <div className="p-4">
            {questionsByDifficulty.silver.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {questionsByDifficulty.silver.map(question => (
                  <li key={question._id.toString()} className="py-3">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{question.text}</p>
                      <Link 
                        href={`/dashboard/rooms/${params.roomId}/questions/${question._id}/edit`}
                        className="ml-2 text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Category: {question.category}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No silver questions yet</p>
            )}
          </div>
        </div>
        
        {/* Gold Questions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
          <div className="bg-yellow-100 px-4 py-2 border-b border-yellow-200">
            <h2 className="font-semibold text-yellow-800">Gold (Hard)</h2>
            <p className="text-sm text-yellow-700">{questionsByDifficulty.gold.length} questions</p>
          </div>
          <div className="p-4">
            {questionsByDifficulty.gold.length > 0 ? (
              <ul className="divide-y divide-yellow-200">
                {questionsByDifficulty.gold.map(question => (
                  <li key={question._id.toString()} className="py-3">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{question.text}</p>
                      <Link 
                        href={`/dashboard/rooms/${params.roomId}/questions/${question._id}/edit`}
                        className="ml-2 text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Category: {question.category}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No gold questions yet</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-right">
        <Link 
          href={`/dashboard/rooms/${params.roomId}`} 
          className="text-sm text-indigo-600 hover:text-indigo-900"
        >
          Back to Room Details
        </Link>
      </div>
    </div>
  );
} 
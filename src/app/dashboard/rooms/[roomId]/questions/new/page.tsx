import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import QuestionForm from '@/components/admin/QuestionForm';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Add Question - Islamic Trivia THR',
  description: 'Add a new question to your Islamic Trivia game room',
};

interface NewQuestionPageProps {
  params: {
    roomId: string;
  };
}

export default async function NewQuestionPage({ params }: NewQuestionPageProps) {
  // Extract roomId to handle it properly
  const { roomId } = await params;
  
  await dbConnect();
  const session = await getSession();

  // Fetch room and verify ownership
  const room = await Room.findOne({ 
    _id: roomId, 
    createdBy: session?.user?.id 
  });

  if (!room) {
    notFound();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Add New Question</h1>
          <p className="text-gray-500">For room: {room.name}</p>
        </div>
        <Link 
          href={`/dashboard/rooms/${roomId}/questions/import`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import Questions
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> You can use the "Show Question Suggestions" button below to quickly start with an existing question from your other rooms.
              </p>
            </div>
          </div>
        </div>
        <QuestionForm roomId={roomId} />
      </div>
    </div>
  );
} 
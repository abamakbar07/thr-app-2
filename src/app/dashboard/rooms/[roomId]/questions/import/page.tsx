import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';
import QuestionImport from '@/components/admin/QuestionImport';


export const metadata: Metadata = {
  title: 'Import Questions - Islamic Trivia THR',
  description: 'Import questions from your other rooms to this game room',
};

interface ImportQuestionsPageProps {
  params: {
    roomId: string;
  };
}

export default async function ImportQuestionsPage({ params }: ImportQuestionsPageProps) {
  // Extract roomId to handle it properly
  const { roomId } = params;
  
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
          <h1 className="text-2xl font-bold">Import Questions</h1>
          <p className="text-gray-500 mb-2">For room: {room.name}</p>
          <p className="text-sm text-gray-600">
            Select questions from your other rooms to import into this room.
            You can modify them after importing.
          </p>
        </div>
        <Link 
          href={`/dashboard/rooms/${roomId}/questions`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Questions
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <QuestionImport roomId={roomId} />
      </div>
    </div>
  );
} 
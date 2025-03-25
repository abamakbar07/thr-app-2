import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
      <h1 className="text-2xl font-bold mb-6">Add New Question</h1>
      <p className="text-gray-500 mb-6">For room: {room.name}</p>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <QuestionForm roomId={roomId} />
      </div>
    </div>
  );
} 
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QuestionForm from '@/components/admin/QuestionForm';
import dbConnect from '@/lib/db/connection';
import { Room, Question } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Edit Question - Islamic Trivia THR',
  description: 'Edit a question in your Islamic Trivia game room',
};

interface EditQuestionPageProps {
  params: {
    roomId: string;
    questionId: string;
  };
}

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  // Extract params values
  const { roomId, questionId } = await params;
  
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

  // Fetch question
  const question = await Question.findOne({
    _id: questionId,
    roomId: roomId
  });

  if (!question) {
    notFound();
  }

  // Convert MongoDB _id to string and prepare data for the form
  const questionData = {
    _id: question._id.toString(),
    text: question.text,
    options: question.options,
    correctOptionIndex: question.correctOptionIndex,
    rupiah: question.rupiah,
    difficulty: question.difficulty as 'bronze' | 'silver' | 'gold',
    category: question.category,
    explanation: question.explanation,
    isDisabled: question.isDisabled,
    imageUrl: question.imageUrl,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Question</h1>
      <p className="text-gray-500 mb-6">For room: {room.name}</p>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <QuestionForm roomId={roomId} questionData={questionData} />
      </div>
    </div>
  );
} 
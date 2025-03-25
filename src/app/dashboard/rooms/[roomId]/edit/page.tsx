import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EditRoomForm from '@/components/admin/EditRoomForm';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Edit Game Room - Islamic Trivia THR',
  description: 'Edit an existing Islamic Trivia game room',
};

interface EditRoomPageProps {
  params: {
    roomId: string;
  };
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  // Extract roomId to handle it properly
  const { roomId } = params;
  
  await dbConnect();
  const session = await getSession();

  const room = await Room.findOne({ 
    _id: roomId, 
    createdBy: session?.user?.id 
  }).lean() as any;

  if (!room) {
    notFound();
  }

  // Convert MongoDB _id to string and prepare data for the form
  const roomData = {
    _id: room._id.toString(),
    name: room.name,
    description: room.description,
    startTime: room.startTime ? new Date(room.startTime).toISOString().slice(0, 16) : '',
    endTime: room.endTime ? new Date(room.endTime).toISOString().slice(0, 16) : '',
    timePerQuestion: room.timePerQuestion,
    showLeaderboard: room.showLeaderboard,
    allowRetries: room.allowRetries,
    showCorrectAnswers: room.showCorrectAnswers,
    accessCode: room.accessCode,
    isActive: room.isActive
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Game Room</h1>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <EditRoomForm roomData={roomData} />
      </div>
    </div>
  );
} 
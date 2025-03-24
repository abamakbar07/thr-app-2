import { Metadata } from 'next';
import NewRoomForm from '@/components/admin/NewRoomForm';

export const metadata: Metadata = {
  title: 'Create Game Room - Islamic Trivia THR',
  description: 'Create a new Islamic Trivia game room',
};

export default function NewRoomPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Game Room</h1>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <NewRoomForm />
      </div>
    </div>
  );
} 
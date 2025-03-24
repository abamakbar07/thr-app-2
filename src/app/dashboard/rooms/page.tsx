import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Game Rooms - Islamic Trivia THR',
  description: 'Manage your Islamic Trivia game rooms',
};

export default async function RoomsPage() {
  await dbConnect();
  const session = await getSession();
  
  // Fetch rooms created by the current user
  const rooms = await Room.find({ createdBy: session?.user?.id }).sort({ createdAt: -1 });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Game Rooms</h1>
        <Link 
          href="/dashboard/rooms/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Room
        </Link>
      </div>
      
      {rooms.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {rooms.map((room) => (
              <li key={room._id.toString()}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-indigo-600 truncate">{room.name}</p>
                        <p className="mt-1 flex items-center text-sm text-gray-500">
                          Access Code: <span className="ml-1 font-mono">{room.accessCode}</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          room.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {room.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Link
                          href={`/dashboard/rooms/${room._id}/edit`}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/rooms/${room._id}/questions`}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          Questions
                        </Link>
                        <Link
                          href={`/dashboard/rooms/${room._id}/participants`}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          Participants
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{room.description}</p>
                      <p className="mt-1">
                        {new Date(room.startTime).toLocaleString()} - {new Date(room.endTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="mt-2 text-lg font-medium text-gray-900">No game rooms found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new game room.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/rooms/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create New Room
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 
import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Game Rooms - Islamic Trivia THR',
  description: 'Manage your Islamic Trivia game rooms',
};

// Define the Room type
interface RoomType {
  _id: string;
  name: string;
  description: string;
  accessCode: string;
  isActive: boolean;
  startTime: Date;
  endTime: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any; // For any other properties
}

export default async function RoomsPage() {
  await dbConnect();
  const session = await getSession();
  
  // console.log("Full session object:", JSON.stringify(session, null, 2));
  
  // Make sure we have a valid session and user ID
  if (!session?.user?.id) {
    // Handle the case where user is not logged in
    return (
      <div className="text-center py-12 bg-white shadow rounded-lg">
        <h3 className="mt-2 text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-1 text-sm text-gray-500">Please log in to view your game rooms.</p>
      </div>
    );
  }
  
  // Fetch rooms created by the current user
  const rooms = await Room.find({ createdBy: session?.user?.id }).sort({ createdAt: -1 });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Game Rooms</h1>
        <Link 
          href="/dashboard/rooms/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E] transition-colors duration-150"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Room
        </Link>
      </div>
      
      {rooms.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-100">
          <ul className="divide-y divide-gray-100">
            {rooms.map((room) => (
              <li key={room._id}>
                <Link href={`/dashboard/rooms/${room._id}`}>
                  <div className="px-6 py-4 hover:bg-[#f0f2f5] transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{room.name}</h3>
                        <p className="text-sm text-gray-500">
                          Access Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{room.accessCode}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          room.isActive 
                            ? 'bg-[#25D366] text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {room.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow-sm rounded-lg border border-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No game rooms</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new game room.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/rooms/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#128C7E] hover:bg-[#075E54] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E] transition-colors duration-150"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Room
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 
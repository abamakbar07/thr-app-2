import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Room, Participant } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Game Sessions - Islamic Trivia THR',
  description: 'Monitor your active Islamic Trivia game sessions',
};

export default async function SessionsPage() {
  await dbConnect();
  const session = await getSession();
  
  // Fetch active rooms created by the current user
  const activeRooms = await Room.find({ 
    createdBy: session?.user?.id,
    isActive: true,
    startTime: { $lte: new Date() },
    endTime: { $gte: new Date() }
  }).sort({ startTime: 1 });
  
  // Fetch participant counts for each room
  const roomsWithCounts = await Promise.all(
    activeRooms.map(async (room) => {
      const participantCount = await Participant.countDocuments({ roomId: room._id });
      return {
        ...room.toObject(),
        _id: room._id.toString(),
        participantCount,
      };
    })
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Active Game Sessions</h1>
        <div className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Monitoring
        </div>
      </div>
      
      {roomsWithCounts.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {roomsWithCounts.map((room) => (
              <li key={room._id}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-indigo-600 truncate">{room.name}</p>
                        <div className="mt-1 flex items-center">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 mr-2">
                            Active
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(room.startTime).toLocaleTimeString()} - {new Date(room.endTime).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0 flex flex-col items-end">
                        <p className="text-sm text-gray-500">Participants</p>
                        <p className="text-lg font-medium text-gray-900">{room.participantCount}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between">
                      <div className="flex space-x-3">
                        <Link 
                          href={`/dashboard/sessions/${room._id}/leaderboard`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Leaderboard
                        </Link>
                        <Link 
                          href={`/dashboard/sessions/${room._id}/analytics`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200"
                        >
                          Analytics
                        </Link>
                      </div>
                      <div className="flex space-x-3">
                        <Link 
                          href={`/dashboard/sessions/${room._id}/manage`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Manage
                        </Link>
                        <button 
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          End Session
                        </button>
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
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No active game sessions</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have any ongoing game sessions right now.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/rooms"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Rooms
            </Link>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        {/* Similar UI for upcoming sessions */}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Past Sessions</h2>
        {/* Similar UI for past sessions */}
      </div>
    </div>
  );
} 
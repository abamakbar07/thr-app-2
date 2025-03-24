import { Metadata } from 'next';
import dbConnect from '@/lib/db/connection';
import { Room, Question, Participant, Reward } from '@/lib/db/models';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Islamic Trivia THR',
  description: 'Overview of your Islamic Trivia THR games and statistics',
};

export default async function AdminDashboard() {
  await dbConnect();
  
  // Get counts for dashboard stats
  const roomsCount = await Room.countDocuments();
  const questionsCount = await Question.countDocuments();
  const participantsCount = await Participant.countDocuments();
  const rewardsCount = await Reward.countDocuments();
  
  // Get recent rooms
  const recentRooms = await Room.find().sort({ createdAt: -1 }).limit(5);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Stats Cards */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Game Rooms</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{roomsCount}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Questions</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{questionsCount}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Participants</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{participantsCount}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Available Rewards</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{rewardsCount}</dd>
          </div>
        </div>
      </div>
      
      {/* Recent Game Rooms */}
      <h2 className="text-xl font-semibold mb-4">Recent Game Rooms</h2>
      <div className="bg-white shadow rounded-lg">
        {recentRooms.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {recentRooms.map((room) => (
              <li key={room._id.toString()} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      Access Code: <span className="font-mono">{room.accessCode}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(room.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    room.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {room.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-4 text-center text-gray-500">
            No game rooms created yet. Create your first game room to get started.
          </div>
        )}
      </div>
    </div>
  );
} 
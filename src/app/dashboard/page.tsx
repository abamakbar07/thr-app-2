import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Room, Question, Participant, Reward, Redemption } from '@/lib/db/models';
import { getCurrentUser } from '@/lib/auth/session';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Islamic Trivia THR',
  description: 'Overview of your Islamic Trivia THR games and statistics',
};

export default async function AdminDashboard() {
  await dbConnect();
  
  // Get current user
  const currentUser = await getCurrentUser();
  
  // Get counts for dashboard stats
  const roomsCount = await Room.countDocuments();
  const questionsCount = await Question.countDocuments();
  const participantsCount = await Participant.countDocuments();
  const rewardsCount = await Reward.countDocuments();
  
  // Get recent rooms
  const recentRooms = await Room.find().sort({ createdAt: -1 }).limit(5);
  
  // Get claims stats
  const claimedCount = await Participant.countDocuments({ thrClaimStatus: 'claimed' });
  const processingCount = await Participant.countDocuments({ thrClaimStatus: 'processing' });
  const unclaimedCount = await Participant.countDocuments({ thrClaimStatus: 'unclaimed' });
  
  // Get total THR distributed
  const totalThrDistributed = await Redemption.aggregate([
    { $match: { status: 'fulfilled' } },
    { $group: { _id: null, total: { $sum: '$rupiahSpent' } } }
  ]);
  
  const totalRupiah = totalThrDistributed.length > 0 ? totalThrDistributed[0].total : 0;
  
  return (
    <div>
      <div className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-100">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Welcome, {currentUser?.name || 'Admin'}</h1>
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="h-20 w-20 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-2xl font-semibold">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{currentUser?.name || 'Admin User'}</h2>
            <p className="text-gray-600">{currentUser?.email || 'No email provided'}</p>
            <div className="mt-2 flex space-x-3">
              <Link 
                href="/dashboard/profile" 
                className="text-sm px-3 py-1 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200"
              >
                Edit Profile
              </Link>
              <Link 
                href="/api/auth/signout" 
                className="text-sm px-3 py-1 bg-red-50 rounded-md text-red-600 hover:bg-red-100"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Stats Cards */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Game Rooms</dt>
            <dd className="mt-1 text-3xl font-semibold text-[#128C7E]">{roomsCount}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Participants</dt>
            <dd className="mt-1 text-3xl font-semibold text-[#128C7E]">{participantsCount}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Questions</dt>
            <dd className="mt-1 text-3xl font-semibold text-[#128C7E]">{questionsCount}</dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Available Rewards</dt>
            <dd className="mt-1 text-3xl font-semibold text-[#128C7E]">{rewardsCount}</dd>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* THR Claim Status */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">THR Claim Status</h3>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500">Claimed</div>
                <div className="mt-1 flex items-baseline">
                  <div className="text-2xl font-semibold text-green-600">{claimedCount}</div>
                  <div className="ml-2 text-sm text-gray-500">participants</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500">Processing</div>
                <div className="mt-1 flex items-baseline">
                  <div className="text-2xl font-semibold text-yellow-600">{processingCount}</div>
                  <div className="ml-2 text-sm text-gray-500">participants</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500">Unclaimed</div>
                <div className="mt-1 flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-600">{unclaimedCount}</div>
                  <div className="ml-2 text-sm text-gray-500">participants</div>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ 
                width: `${participantsCount > 0 ? (claimedCount / participantsCount) * 100 : 0}%` 
              }}></div>
            </div>
            <div className="text-sm text-gray-500 mt-2 text-right">
              {participantsCount > 0 ? 
                Math.round((claimedCount / participantsCount) * 100) : 0}% completion rate
            </div>
          </div>
        </div>
        
        {/* THR Distribution */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">THR Distribution</h3>
          </div>
          <div className="px-6 py-5">
            <div className="text-3xl font-bold text-[#128C7E] mb-2">
              {formatCurrency(totalRupiah)}
            </div>
            <p className="text-gray-600">Total THR distributed to participants</p>
            
            <div className="mt-6">
              <Link 
                href="/dashboard/participants" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#128C7E] hover:bg-[#0e6b5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E]"
              >
                View All Participants
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Game Rooms */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Game Rooms</h2>
      <div className="bg-white shadow-sm rounded-lg border border-gray-100">
        {recentRooms.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {recentRooms.map((room) => (
              <li key={room._id.toString()} className="px-6 py-4 hover:bg-[#f0f2f5] transition-colors duration-150">
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
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      room.isActive 
                        ? 'bg-[#25D366] text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {room.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Link
                      href={`/dashboard/rooms/${room._id}`}
                      className="text-[#128C7E] hover:text-[#0e6b5e] text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-4 text-center text-gray-500">
            No game rooms created yet. Create your first game room to get started.
          </div>
        )}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <Link 
            href="/dashboard/rooms"
            className="text-sm text-[#128C7E] hover:text-[#0e6b5e] font-medium"
          >
            View All Rooms →
          </Link>
        </div>
      </div>
    </div>
  );
} 
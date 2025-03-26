import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Participant, Room, Answer, Redemption } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Participants - Islamic Trivia THR',
  description: 'Manage and view participants in your Islamic Trivia games',
};

interface SearchParams {
  page?: string;
  roomId?: string;
  status?: string;
  search?: string;
}

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await dbConnect();
  const session = await getSession();
  
  // Parse search params
  const page = parseInt(searchParams.page || '1');
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  const roomIdFilter = searchParams.roomId;
  const statusFilter = searchParams.status;
  const searchQuery = searchParams.search;
  
  // Get rooms created by the user
  const userRooms = await Room.find({ createdBy: session?.user?.id }).select('_id name');
  const roomIds = userRooms.map(room => room._id);
  
  // Build filter
  const filter: any = { roomId: { $in: roomIds } };
  
  // Add additional filters if provided
  if (roomIdFilter && roomIdFilter !== 'all') {
    filter.roomId = roomIdFilter;
  }
  
  if (statusFilter && statusFilter !== 'all') {
    filter.thrClaimStatus = statusFilter;
  }
  
  if (searchQuery) {
    filter.name = { $regex: searchQuery, $options: 'i' };
  }
  
  // Get total count for pagination
  const totalParticipants = await Participant.countDocuments(filter);
  const totalPages = Math.ceil(totalParticipants / pageSize);
  
  // Get participants in these rooms with pagination
  const participants = await Participant.find(filter)
    .populate('roomId', 'name accessCode')
    .sort({ totalRupiah: -1 })
    .skip(skip)
    .limit(pageSize);
  
  // Get redemption status for each participant
  const participantStats = await Promise.all(
    participants.map(async (participant) => {
      const answers = await Answer.find({ participantId: participant._id });
      const totalAnswers = answers.length;
      const correctAnswers = answers.filter(answer => answer.isCorrect).length;
      
      const redemptions = await Redemption.find({ 
        participantId: participant._id,
        status: { $in: ['pending', 'fulfilled'] }
      });
      
      const claimedAmount = redemptions.reduce((sum, r) => sum + r.rupiahSpent, 0);
      const remainingAmount = participant.totalRupiah - claimedAmount;
      
      return {
        participant,
        totalAnswers,
        correctAnswers,
        claimedAmount,
        remainingAmount
      };
    })
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Participants</h1>
        <div className="flex gap-2">
          <Link 
            href="/dashboard/participants/export" 
            className="px-3 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
          >
            Export Data
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow mb-6">
        <form className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1">
              <input
                type="text"
                name="search"
                id="search"
                defaultValue={searchQuery}
                placeholder="Search by name..."
                className="shadow-sm focus:ring-[#128C7E] focus:border-[#128C7E] block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">Room</label>
            <div className="mt-1">
              <select
                id="roomId"
                name="roomId"
                defaultValue={roomIdFilter || 'all'}
                className="shadow-sm focus:ring-[#128C7E] focus:border-[#128C7E] block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="all">All Rooms</option>
                {userRooms.map(room => (
                  <option key={room._id.toString()} value={room._id.toString()}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">THR Status</label>
            <div className="mt-1">
              <select
                id="status"
                name="status"
                defaultValue={statusFilter || 'all'}
                className="shadow-sm focus:ring-[#128C7E] focus:border-[#128C7E] block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="unclaimed">Unclaimed</option>
                <option value="processing">Processing</option>
                <option value="claimed">Claimed</option>
              </select>
            </div>
          </div>
          
          <div className="w-full md:w-24 flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#128C7E] hover:bg-[#0e6b5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#128C7E]"
            >
              Filter
            </button>
          </div>
        </form>
      </div>
      
      {participants.length > 0 ? (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total THR
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participantStats.map(({ participant, totalAnswers, correctAnswers, claimedAmount, remainingAmount }) => (
                  <tr key={participant._id.toString()}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                      <div className="text-sm text-gray-500">
                        Joined {new Date(participant.joinedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{participant.roomId ? participant.roomId.name : 'Unknown'}</div>
                      <div className="text-sm text-gray-500">
                        Code: <span className="font-mono">{participant.accessCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{correctAnswers} / {totalAnswers} correct</div>
                      <div className="text-sm text-gray-500">
                        {totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0}% accuracy
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{formatCurrency(participant.totalRupiah)}</div>
                      {claimedAmount > 0 && (
                        <div className="text-sm text-gray-500">
                          {formatCurrency(remainingAmount)} remaining
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        participant.thrClaimStatus === 'claimed' ? 'bg-green-100 text-green-800' : 
                        participant.thrClaimStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.thrClaimStatus.charAt(0).toUpperCase() + participant.thrClaimStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/participants/${participant._id}`}
                        className="text-[#128C7E] hover:text-[#0e6b5e] mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/participants/${participant._id}/edit`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-md shadow">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{skip + 1}</span> to{' '}
                <span className="font-medium">{Math.min(skip + pageSize, totalParticipants)}</span> of{' '}
                <span className="font-medium">{totalParticipants}</span> participants
              </div>
              <div className="flex space-x-2">
                {page > 1 && (
                  <Link
                    href={{
                      pathname: '/dashboard/participants',
                      query: {
                        ...searchParams,
                        page: page - 1
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                
                {page < totalPages && (
                  <Link
                    href={{
                      pathname: '/dashboard/participants',
                      query: {
                        ...searchParams,
                        page: page + 1
                      }
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#128C7E] hover:bg-[#0e6b5e]"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="mt-2 text-lg font-medium text-gray-900">No participants found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || roomIdFilter !== 'all' || statusFilter !== 'all' ? 
              'Try adjusting your filters to see more results.' :
              'Once participants join your game rooms, they will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
} 
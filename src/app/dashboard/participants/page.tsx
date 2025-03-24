import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Participant, Room, Answer } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Participants - Islamic Trivia THR',
  description: 'Manage and view participants in your Islamic Trivia games',
};

export default async function ParticipantsPage() {
  await dbConnect();
  const session = await getSession();
  
  // Get rooms created by the user
  const userRooms = await Room.find({ createdBy: session?.user?.id }).select('_id name');
  const roomIds = userRooms.map(room => room._id);
  
  // Get participants in these rooms
  const participants = await Participant.find({ roomId: { $in: roomIds } })
    .populate('roomId', 'name accessCode')
    .sort({ createdAt: -1 });
  
  // Get answer stats for each participant
  const participantStats = await Promise.all(
    participants.map(async (participant) => {
      const answers = await Answer.find({ participantId: participant._id });
      const totalAnswers = answers.length;
      const correctAnswers = answers.filter(answer => answer.isCorrect).length;
      const totalPoints = answers.reduce((sum, answer) => sum + (answer.pointsEarned || 0), 0);
      
      return {
        participant,
        totalAnswers,
        correctAnswers,
        totalPoints
      };
    })
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Participants</h1>
      </div>
      
      {participants.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                  Questions Answered
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correct Answers
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Points
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participantStats.map(({ participant, totalAnswers, correctAnswers, totalPoints }) => (
                <tr key={participant._id.toString()}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                    <div className="text-sm text-gray-500">{participant.age} years old</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{participant.roomId ? participant.roomId.name : 'Unknown'}</div>
                    <div className="text-sm text-gray-500">
                      Code: <span className="font-mono">{participant.roomId ? participant.roomId.accessCode : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {totalAnswers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{correctAnswers}</div>
                    <div className="text-sm text-gray-500">
                      {totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0}% accuracy
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {totalPoints} points
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/dashboard/participants/${participant._id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="mt-2 text-lg font-medium text-gray-900">No participants found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Once participants join your game rooms, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
} 
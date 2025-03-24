import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LeaderboardClient from '@/components/admin/LeaderboardClient';
import dbConnect from '@/lib/db/connection';
import { Room, Participant, Answer } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Live Leaderboard - Islamic Trivia THR',
  description: 'Real-time leaderboard for your Islamic Trivia game',
};

interface LeaderboardPageProps {
  params: {
    roomId: string;
  };
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  await dbConnect();
  const session = await getSession();

  // Fetch room and verify ownership
  const room = await Room.findOne({ 
    _id: params.roomId, 
    createdBy: session?.user?.id 
  });

  if (!room) {
    notFound();
  }

  // Get participants and their answers for this room
  const participants = await Participant.find({ roomId: params.roomId }).lean();
  
  // Calculate initial scores by processing answers
  const participantScores = await Promise.all(
    participants.map(async (participant: any) => {
      const answers = await Answer.find({ 
        participantId: participant._id,
        roomId: params.roomId,
        isCorrect: true
      });
      
      const totalPoints = answers.reduce((sum, answer: any) => sum + answer.pointsAwarded, 0);
      const correctAnswers = answers.length;
      
      return {
        id: participant._id.toString(),
        name: participant.name,
        displayName: participant.displayName || participant.name,
        avatar: participant.avatar || null,
        score: totalPoints,
        correctAnswers,
        lastAnsweredAt: answers.length > 0 
          ? Math.max(...answers.map((a: any) => a.createdAt.getTime())) 
          : null
      };
    })
  );
  
  // Sort by score (descending) and then by last answered time (ascending)
  const sortedScores = participantScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.lastAnsweredAt && b.lastAnsweredAt) {
      return a.lastAnsweredAt - b.lastAnsweredAt;
    }
    return 0;
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Live Leaderboard</h1>
          <p className="text-gray-500">Room: {room.name}</p>
        </div>
        <div className="flex items-center">
          <div className="inline-flex items-center px-3 py-1 mr-3 text-sm rounded-full bg-green-100 text-green-800">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live
          </div>
          <Link 
            href={`/dashboard/sessions/${params.roomId}`}
            className="px-4 py-1 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Back to Session
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* Client component for real-time updates */}
        <LeaderboardClient 
          initialData={sortedScores} 
          roomId={params.roomId} 
          updateIntervalMs={3000} 
        />
      </div>
    </div>
  );
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import dbConnect from '@/lib/db/connection';
import { Room, Participant, Answer } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify that room exists and belongs to user
    const room = await Room.findOne({
      _id: params.roomId,
      createdBy: session.user.id
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Get participants and their answers for this room
    const participants = await Participant.find({ roomId: params.roomId }).lean();
    
    // Calculate scores by processing answers
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
    
    return NextResponse.json(sortedScores);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 
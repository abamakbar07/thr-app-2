import { NextRequest, NextResponse } from 'next/server';
// import { getSession } from '@/lib/auth/session';
import dbConnect from '@/lib/db/connection';
import { Room, Participant, Answer } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  context: { params: { roomId: string } }
) {
  try {
    await dbConnect();
    
    // Await params before destructuring
    const params = await context.params;
    const { roomId } = params;
    
    // Verify that room exists
    const room = await Room.findOne({
      _id: roomId
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Get participants and their answers for this room
    const participants = await Participant.find({ roomId }).lean();
    
    // Calculate scores by processing answers
    const participantScores = await Promise.all(
      participants.map(async (participant: any) => {
        const answers = await Answer.find({ 
          participantId: participant._id,
          roomId,
          isCorrect: true
        });
        
        const totalRupiah = answers.reduce((sum, answer: any) => sum + answer.rupiahAwarded, 0);
        const correctAnswers = answers.length;
        
        return {
          _id: participant._id.toString(),
          name: participant.name,
          displayName: participant.displayName || participant.name,
          avatar: participant.avatar || null,
          totalRupiah: totalRupiah,
          score: totalRupiah, // Keep for backwards compatibility
          correctAnswers,
          lastAnsweredAt: answers.length > 0 
            ? Math.max(...answers.map((a: any) => a.createdAt.getTime())) 
            : null
        };
      })
    );
    
    // Sort by score (descending) and then by last answered time (ascending)
    const sortedScores = participantScores.sort((a, b) => {
      if (b.totalRupiah !== a.totalRupiah) return b.totalRupiah - a.totalRupiah;
      if (a.lastAnsweredAt && b.lastAnsweredAt) {
        return a.lastAnsweredAt - b.lastAnsweredAt;
      }
      return 0;
    });
    
    // Format response to match what the component expects
    return NextResponse.json({
      participants: sortedScores
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 
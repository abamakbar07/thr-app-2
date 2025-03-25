import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Participant, Answer } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { participantId: string } }
) {
  try {
    await dbConnect();
    
    // Find participant
    const participant = await Participant.findById(params.participantId);
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Get participant's answers and calculate total points
    const answers = await Answer.find({ participantId: params.participantId });
    const totalPoints = answers.reduce((sum, answer) => sum + (answer.pointsEarned || 0), 0);
    
    // Return participant data with points
    return NextResponse.json({
      id: participant._id,
      name: participant.name,
      roomId: participant.roomId,
      joinedAt: participant.joinedAt,
      score: participant.score,
      totalPoints: totalPoints
    });
    
  } catch (error) {
    console.error('Error fetching participant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant' },
      { status: 500 }
    );
  }
} 
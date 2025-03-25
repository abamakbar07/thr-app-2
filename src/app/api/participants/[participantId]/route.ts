import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Participant, Answer } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { participantId: string } }
) {
  try {
    // Extract participantId to handle it properly
    const { participantId } = params;
    
    await dbConnect();
    
    // Find participant
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Get participant's answers and calculate total rupiah
    const answers = await Answer.find({ participantId });
    const totalRupiah = answers.reduce((sum, answer) => sum + (answer.rupiahEarned || 0), 0);
    
    // Return participant data with rupiah
    return NextResponse.json({
      id: participant._id,
      name: participant.name,
      roomId: participant.roomId,
      joinedAt: participant.joinedAt,
      score: participant.score,
      totalRupiah
    });
    
  } catch (error) {
    console.error('Error fetching participant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant' },
      { status: 500 }
    );
  }
} 
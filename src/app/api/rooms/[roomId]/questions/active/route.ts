import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Question, Participant } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    await dbConnect();
    
    // Get participant ID from query params
    const url = new URL(request.url);
    const participantId = url.searchParams.get('pid');
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID required' },
        { status: 400 }
      );
    }
    
    // Verify the participant exists and belongs to this room
    const participant = await Participant.findOne({
      _id: participantId,
      roomId: params.roomId
    });
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Invalid participant for this room' },
        { status: 403 }
      );
    }
    
    // Fetch the active questions for this room
    const questions = await Question.find({ 
      roomId: params.roomId,
      isDisabled: { $ne: true }
    }).sort({ difficulty: 1, createdAt: -1 });
    
    return NextResponse.json({ 
      questions,
      message: 'Active questions retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching active questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active questions' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Participant } from '@/lib/db/models';

export async function POST(req: NextRequest) {
  try {
    const { roomId, name } = await req.json();

    // Validate input
    if (!roomId || !name) {
      return NextResponse.json(
        { message: 'Room ID and name are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify room exists and is active
    const room = await Room.findOne({ _id: roomId, isActive: true });
    if (!room) {
      return NextResponse.json(
        { message: 'Room not found or inactive' },
        { status: 404 }
      );
    }

    // Create new participant
    const participant = await Participant.create({
      name,
      roomId,
      score: 0,
      answeredQuestions: [],
      joinedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Successfully joined the room',
        participant: {
          _id: participant._id.toString(),
          name: participant.name,
          roomId: participant.roomId.toString(),
          score: participant.score,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Participant } from '@/lib/db/models';

export async function POST(req: NextRequest) {
  try {
    const { roomId, name, accessCode } = await req.json();

    // Validate input
    if (!roomId || !name || !accessCode) {
      return NextResponse.json(
        { message: 'Room ID, name, and access code are required' },
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

    // Check if access code is already in use
    const existingParticipant = await Participant.findOne({ accessCode });
    if (existingParticipant) {
      // If participant with this code exists and is linked to this room, update name
      if (existingParticipant.roomId.toString() === roomId) {
        existingParticipant.name = name;
        existingParticipant.currentStatus = 'active';
        await existingParticipant.save();

        return NextResponse.json(
          {
            message: 'Successfully rejoined the room',
            participant: {
              _id: existingParticipant._id.toString(),
              name: existingParticipant.name,
              roomId: existingParticipant.roomId.toString(),
              totalRupiah: existingParticipant.totalRupiah,
            },
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { message: 'Access code is already in use for another room' },
          { status: 400 }
        );
      }
    }

    // Create new participant
    const participant = await Participant.create({
      name,
      roomId,
      totalRupiah: 0,
      accessCode,
      joinedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Successfully joined the room',
        participant: {
          _id: participant._id.toString(),
          name: participant.name,
          roomId: participant.roomId.toString(),
          totalRupiah: participant.totalRupiah,
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
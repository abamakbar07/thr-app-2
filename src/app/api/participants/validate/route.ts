import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Participant } from '@/lib/db/models';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { roomId, accessCode } = body;

    if (!roomId || !accessCode) {
      return NextResponse.json(
        { message: 'Room ID and access code are required' },
        { status: 400 }
      );
    }

    // Check if room exists and is active
    const room = await Room.findOne({
      _id: roomId,
      isActive: true,
    });

    if (!room) {
      return NextResponse.json({ message: 'Room not found or inactive' }, { status: 404 });
    }

    // Check if the access code exists
    const participant = await Participant.findOne({
      accessCode: accessCode,
    });

    // If participant exists with this access code, return their details
    if (participant) {
      if (participant.roomId.toString() !== roomId) {
        return NextResponse.json(
          { message: 'Access code is not valid for this room' },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        message: 'Access code is valid',
        participant: {
          _id: participant._id,
          name: participant.name,
          totalRupiah: participant.totalRupiah,
          currentStatus: participant.currentStatus
        },
        isExisting: true
      });
    }

    // If no participant exists with this access code but it's a valid format
    if (accessCode.length === 6) {
      return NextResponse.json({ 
        message: 'Access code is valid but not used yet',
        isExisting: false 
      });
    }

    return NextResponse.json({ message: 'Invalid access code' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to validate access code' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Participant } from '@/lib/db/models';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const { accessCode, name } = await req.json();
    
    if (!accessCode || !name) {
      return new NextResponse(JSON.stringify({ message: 'Access code and name are required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Find the room with the given access code
    const room = await Room.findOne({ accessCode });
    
    if (!room) {
      return new NextResponse(JSON.stringify({ message: 'Invalid access code' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Create a new participant
    const participant = await Participant.create({
      roomId: room._id,
      name,
      joinedAt: new Date(),
      totalPoints: 0,
      currentStatus: 'active',
    });
    
    return new NextResponse(JSON.stringify({ 
      message: 'Successfully joined the room',
      roomId: room._id,
      participantId: participant._id,
      roomName: room.name
    }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to join the room' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
} 
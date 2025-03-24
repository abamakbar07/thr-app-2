import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Participant } from '@/lib/db/models';

interface Params {
  params: {
    roomId: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { roomId } = params;
    
    // Verify that the room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return new NextResponse(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Get all active participants in the room, sorted by total points
    const participants = await Participant.find({
      roomId,
      currentStatus: 'active',
    })
      .select('_id name totalPoints')
      .sort({ totalPoints: -1 })
      .lean();
    
    return new NextResponse(JSON.stringify({ 
      participants,
      showLeaderboard: room.settings.showLeaderboard,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch leaderboard' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
} 
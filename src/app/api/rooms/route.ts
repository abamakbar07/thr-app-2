import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    const { name, description, startTime, endTime, timePerQuestion, showLeaderboard, allowRetries, showCorrectAnswers } = await req.json();
    
    // Generate a unique 6-character access code
    const accessCode = uuidv4().substring(0, 6).toUpperCase();
    
    const room = await Room.create({
      name,
      description,
      accessCode,
      createdBy: user.id,
      isActive: true,
      startTime,
      endTime,
      settings: {
        timePerQuestion: parseInt(timePerQuestion),
        showLeaderboard,
        allowRetries,
        showCorrectAnswers,
      },
    });
    
    return new NextResponse(JSON.stringify({ roomId: room._id, accessCode }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to create room' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    const rooms = await Room.find({ createdBy: user.id }).sort({ createdAt: -1 });
    
    return new NextResponse(JSON.stringify(rooms), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch rooms' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
} 
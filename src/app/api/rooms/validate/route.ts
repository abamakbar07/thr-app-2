import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { message: 'Access code is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find room by access code and check if it's active
    const room = await Room.findOne({ 
      accessCode: code
    });

    if (!room) {
      return NextResponse.json(
        { message: 'Invalid access code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Room found',
      room: {
        _id: room._id.toString(),
        name: room.name,
        accessCode: room.accessCode,
      },
    });
  } catch (error) {
    console.error('Error validating room:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
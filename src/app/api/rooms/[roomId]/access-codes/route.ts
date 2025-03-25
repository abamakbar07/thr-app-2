import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Room, Participant } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

function generateAccessCode() {
  // Generate a random 6-character alphanumeric code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    // Extract roomId to handle it properly
    const { roomId } = params;
    
    await dbConnect();
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify room exists and belongs to the user
    const room = await Room.findOne({ 
      _id: roomId, 
      createdBy: session.user.id 
    });

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    // Generate a unique access code
    let accessCode;
    let isUnique = false;
    
    while (!isUnique) {
      accessCode = generateAccessCode();
      
      // Check if the code already exists
      const existingParticipant = await Participant.findOne({ accessCode });
      
      if (!existingParticipant) {
        isUnique = true;
      }
    }

    return NextResponse.json({ accessCode });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to generate access code' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    // Extract roomId to handle it properly
    const { roomId } = params;
    
    await dbConnect();
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify room exists and belongs to the user
    const room = await Room.findOne({ 
      _id: roomId, 
      createdBy: session.user.id 
    });

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    // Get all access codes for the room
    const participants = await Participant.find(
      { roomId },
      { accessCode: 1, name: 1, totalRupiah: 1, _id: 1 }
    );

    return NextResponse.json({ participants });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch access codes' },
      { status: 500 }
    );
  }
} 
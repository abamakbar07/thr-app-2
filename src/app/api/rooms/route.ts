import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import mongoose from 'mongoose';

interface User {
  _id: string;
  name: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as User;
    
    if (!user || !user._id) {
      return NextResponse.json({ error: 'User authentication issue - Please sign out and sign in again' }, { status: 401 });
    }
    
    const { name, description, startTime, endTime, timePerQuestion, showLeaderboard, allowRetries, showCorrectAnswers } = await req.json();
    
    // Generate a unique 6-character access code
    const accessCode = uuidv4().substring(0, 6).toUpperCase();
    
    await dbConnect();
    
    const room = await Room.create({
      name,
      description,
      accessCode,
      createdBy: new mongoose.Types.ObjectId(user._id),
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
    
    return NextResponse.json({ roomId: room._id, accessCode }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to create room';
    if (error instanceof Error) {
      // Check for Mongoose validation errors
      if (error.name === 'ValidationError') {
        errorMessage = `Validation error: ${error.message}`;
      } else if (error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
        errorMessage = 'A room with this name already exists';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as User;
    
    if (!user || !user._id) {
      return NextResponse.json({ error: 'User authentication issue - Please sign out and sign in again' }, { status: 401 });
    }
    
    await dbConnect();
    
    const rooms = await Room.find({ createdBy: new mongoose.Types.ObjectId(user._id) }).sort({ createdAt: -1 });
    
    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    
    let errorMessage = 'Failed to fetch rooms';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
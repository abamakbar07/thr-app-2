import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Question, Room } from '@/lib/db/models';
import { getCurrentUser } from '@/lib/auth/session';

interface Params {
  params: {
    roomId: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { roomId } = params;
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Check if the room exists and belongs to the user
    const room = await Room.findOne({ _id: roomId, createdBy: user.id });
    if (!room) {
      return new NextResponse(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    const questions = await Question.find({ roomId }).sort({ createdAt: -1 });
    
    return new NextResponse(JSON.stringify(questions), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch questions' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { roomId } = params;
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Check if the room exists and belongs to the user
    const room = await Room.findOne({ _id: roomId, createdBy: user.id });
    if (!room) {
      return new NextResponse(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    const { text, options, correctOptionIndex, points, difficulty, category, explanation, imageUrl } = await req.json();
    
    const question = await Question.create({
      roomId,
      text,
      options,
      correctOptionIndex,
      points,
      difficulty,
      category,
      explanation,
      isDisabled: false,
      imageUrl,
    });
    
    return new NextResponse(JSON.stringify(question), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to create question' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
} 
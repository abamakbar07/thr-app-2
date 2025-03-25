import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import dbConnect from '@/lib/db/connection';
import { Room, Question } from '@/lib/db/models';

const questionSchema = z.object({
  roomId: z.string(),
  text: z.string().min(3),
  options: z.array(z.string()).min(2).max(6),
  correctOptionIndex: z.number().min(0),
  rupiah: z.number().min(100),
  difficulty: z.enum(['bronze', 'silver', 'gold']),
  category: z.string().min(1),
  explanation: z.string().min(1),
  isDisabled: z.boolean().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    // Extract roomId to handle it properly
    const { roomId } = params;
    
    await dbConnect();
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify that room exists and belongs to user
    const room = await Room.findOne({
      _id: roomId,
      createdBy: session.user.id
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    const questions = await Question.find({ roomId })
      .sort({ createdAt: -1 });
    
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    // Extract roomId to handle it properly
    const { roomId } = params;
    
    await dbConnect();
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify that room exists and belongs to user
    const room = await Room.findOne({
      _id: roomId,
      createdBy: session.user.id
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const validation = questionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    // Create the question
    const question = await Question.create({
      ...body,
      roomId,
    });
    
    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
} 
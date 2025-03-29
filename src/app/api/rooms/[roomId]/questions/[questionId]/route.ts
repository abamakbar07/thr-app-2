import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import dbConnect from '@/lib/db/connection';
import { Room, Question } from '@/lib/db/models';

const questionUpdateSchema = z.object({
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
  { params }: { params: { roomId: string, questionId: string } }
) {
  try {
    // Extract parameters to handle them properly
    const { roomId, questionId } = params;
    
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
    
    const question = await Question.findOne({
      _id: questionId,
      roomId
    });
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { roomId: string, questionId: string } }
) {
  try {
    // Extract parameters to handle them properly
    const { roomId, questionId } = await params;
    
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
    const validation = questionUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    // Verify that question exists and belongs to the room
    const existingQuestion = await Question.findOne({
      _id: questionId,
      roomId
    });
    
    if (!existingQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // Update the question
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      {
        ...body,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { roomId: string, questionId: string } }
) {
  try {
    // Extract parameters to handle them properly
    const { roomId, questionId } = params;
    
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
    
    // Verify that question exists and belongs to the room
    const existingQuestion = await Question.findOne({
      _id: questionId,
      roomId
    });
    
    if (!existingQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // Delete the question
    await Question.findByIdAndDelete(questionId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
} 
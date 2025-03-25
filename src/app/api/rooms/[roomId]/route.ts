import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import dbConnect from '@/lib/db/connection';
import { Room } from '@/lib/db/models';

const roomUpdateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(5).max(500),
  startTime: z.string().refine((val: string) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: "Invalid start time format" }),
  endTime: z.string().refine((val: string) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: "Invalid end time format" }),
  timePerQuestion: z.number().min(5).max(60),
  showLeaderboard: z.boolean(),
  allowRetries: z.boolean(),
  showCorrectAnswers: z.boolean(),
  isActive: z.boolean(),
}).refine((data: {startTime: string, endTime: string}) => {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  return endTime > startTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    // Extract roomId to handle it properly
    const { roomId } = params;
    
    await dbConnect();
    
    // Get participant ID from query params if available
    const url = new URL(request.url);
    const participantId = url.searchParams.get('pid');
    
    // If participant ID is provided, we'll use that for access
    if (participantId) {
      // Find the room without checking creator
      const room = await Room.findOne({ _id: roomId });
      
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      
      return NextResponse.json({ room });
    }
    
    // If no participant ID, proceed with normal admin authentication
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const room = await Room.findOne({ 
      _id: roomId,
      createdBy: session.user.id
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    const body = await request.json();
    
    // Validate request body
    const validation = roomUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    // Check if room exists and belongs to current user
    const room = await Room.findOne({
      _id: roomId,
      createdBy: session.user.id
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Update the room
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        name: body.name,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        timePerQuestion: body.timePerQuestion,
        showLeaderboard: body.showLeaderboard,
        allowRetries: body.allowRetries,
        showCorrectAnswers: body.showCorrectAnswers,
        isActive: body.isActive,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // Check if room exists and belongs to current user
    const room = await Room.findOne({
      _id: roomId,
      createdBy: session.user.id
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Delete the room
    await Room.findByIdAndDelete(roomId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
} 
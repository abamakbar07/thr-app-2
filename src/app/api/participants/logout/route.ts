import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/connection';
import { Participant } from '@/lib/db/models';

// Schema validation for logout
const logoutSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate request body
    const validation = logoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Invalid request data', 
        errors: validation.error.format() 
      }, { status: 400 });
    }

    const { participantId } = validation.data;

    // Find the participant and update their status
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return NextResponse.json({ message: 'Participant not found' }, { status: 404 });
    }

    // Update the participant status to inactive
    participant.currentStatus = 'inactive';
    await participant.save();

    return NextResponse.json({
      message: 'Logged out successfully',
      participantId: participant._id,
      accessCode: participant.accessCode // Return the access code for future reference
    });
  } catch (error: any) {
    return NextResponse.json({ 
      message: error.message || 'Failed to log out participant' 
    }, { status: 500 });
  }
} 
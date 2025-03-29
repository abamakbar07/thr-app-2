import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Participant, Room } from '@/lib/db/models';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { z } from 'zod';

// Schema validation for THR adjustment
const thrAdjustmentSchema = z.object({
  participantId: z.string().min(1),
  adjustment: z.number(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate admin/organizer
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Parse and validate request body
    const body = await req.json();
    const validation = thrAdjustmentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { participantId, adjustment, reason } = validation.data;
    
    // Find the participant
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    
    // Find the room and verify that the current user is the owner
    const room = await Room.findOne({
      _id: participant.roomId,
      createdBy: authSession.user.id
    });
    
    if (!room) {
      return NextResponse.json({ 
        error: 'Unauthorized: You do not have permission to adjust THR for this participant' 
      }, { status: 403 });
    }
    
    // Calculate new THR balance
    const currentTHR = participant.totalRupiah || 0;
    const newTHR = currentTHR + adjustment;
    
    // Prevent negative balances
    if (newTHR < 0) {
      return NextResponse.json({ 
        error: 'Cannot reduce THR below zero', 
        currentTHR,
        requested: adjustment
      }, { status: 400 });
    }
    
    // Update participant's THR balance
    await Participant.findByIdAndUpdate(
      participantId,
      { 
        totalRupiah: newTHR,
        $push: { 
          adjustments: {
            amount: adjustment,
            reason: reason || 'Manual adjustment',
            adminId: authSession.user.id,
            createdAt: new Date()
          }
        }
      }
    );
    
    return NextResponse.json({
      success: true,
      message: `THR balance adjusted ${adjustment > 0 ? 'up' : 'down'} by ${Math.abs(adjustment)}`,
      previousBalance: currentTHR,
      newBalance: newTHR,
      participantId,
      participantName: participant.name
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error adjusting THR balance:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation error', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Server error while processing THR adjustment'
    }, { status: 500 });
  }
} 
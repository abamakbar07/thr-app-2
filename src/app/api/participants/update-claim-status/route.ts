import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Participant, Room, Redemption } from '@/lib/db/models';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { z } from 'zod';

// Schema validation for claim status update
const claimStatusSchema = z.object({
  participantId: z.string().min(1),
  claimStatus: z.enum(['unclaimed', 'processing', 'claimed']),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  
  try {
    // Authenticate admin/organizer
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Parse and validate request body
    const body = await req.json();
    const validation = claimStatusSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { participantId, claimStatus, notes } = validation.data;
    
    // Find the participant
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    
    // Verify the admin has permission to update this participant
    const room = await Room.findOne({
      _id: participant.roomId,
      createdBy: authSession.user.id
    });
    
    if (!room) {
      return NextResponse.json({ 
        error: 'Unauthorized: You do not have permission to update this participant' 
      }, { status: 403 });
    }
    
    // Start transaction
    session.startTransaction();
    
    try {
      // Update participant's THR claim status
      const updatedParticipant = await Participant.findByIdAndUpdate(
        participantId,
        { 
          thrClaimStatus: claimStatus,
          $push: {
            statusHistory: {
              status: claimStatus,
              notes: notes || `Status updated to ${claimStatus}`,
              updatedBy: authSession.user.id,
              updatedAt: new Date()
            }
          }
        },
        { new: true, session }
      );
      
      // If status is being set to 'claimed', create a redemption record
      if (claimStatus === 'claimed') {
        try {
          // Check if a system redemption already exists
          const existingRedemption = await Redemption.findOne({
            participantId,
            systemCreated: true,
            status: { $ne: 'cancelled' }
          });
          
          // Only create if no existing system redemption
          if (!existingRedemption) {
            await Redemption.create([{
              participantId,
              roomId: participant.roomId,
              rewardId: null, // System-generated redemption
              rupiahSpent: participant.totalRupiah,
              claimedAt: new Date(),
              status: 'fulfilled',
              notes: notes || 'THR claimed via admin status update',
              systemCreated: true,
              createdBy: authSession.user.id
            }], { session });
          }
        } catch (redemptionError) {
          console.error('Error creating redemption record:', redemptionError);
          // Continue with the status update even if redemption creation fails
          // This prevents the entire transaction from failing
        }
      }
      
      await session.commitTransaction();
      
      return NextResponse.json({
        success: true,
        message: `THR claim status updated to ${claimStatus}`,
        participant: {
          id: updatedParticipant._id,
          name: updatedParticipant.name,
          thrClaimStatus: updatedParticipant.thrClaimStatus
        }
      }, { status: 200 });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    }
  } catch (error) {
    // Ensure we abort transaction if it's still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    
    console.error('Error updating THR claim status:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation error', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Server error while updating THR claim status'
    }, { status: 500 });
  } finally {
    // End session
    session.endSession();
  }
} 
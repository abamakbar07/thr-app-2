import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Participant, Room, Redemption } from '@/lib/db/models';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { z } from 'zod';

// Schema validation for batch status update
const batchUpdateSchema = z.object({
  roomId: z.string().min(1),
  targetStatus: z.enum(['unclaimed', 'processing', 'claimed']).nullable(),
  newStatus: z.enum(['unclaimed', 'processing', 'claimed']),
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
    const validation = batchUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { roomId, targetStatus, newStatus, notes } = validation.data;
    
    // Verify the admin has permission to update participants in this room
    const room = await Room.findOne({
      _id: roomId,
      createdBy: authSession.user.id
    });
    
    if (!room) {
      return NextResponse.json({ 
        error: 'Unauthorized: You do not have permission to update participants in this room' 
      }, { status: 403 });
    }
    
    // Build the filter for participants to update
    const filter: any = { roomId };
    
    // Add target status if specified
    if (targetStatus) {
      filter.thrClaimStatus = targetStatus;
    }
    
    // Don't update participants who already have the target status
    filter.thrClaimStatus = { $ne: newStatus };
    
    // Get count of participants that will be updated
    const participantCount = await Participant.countDocuments(filter);
    
    if (participantCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No participants found that need updating',
        updatedCount: 0
      }, { status: 200 });
    }
    
    // Start transaction
    session.startTransaction();
    
    try {
      // Update all matching participants
      const updateResult = await Participant.updateMany(
        filter,
        { 
          thrClaimStatus: newStatus,
          $push: {
            statusHistory: {
              status: newStatus,
              notes: notes || `Batch updated to ${newStatus}`,
              updatedBy: authSession.user.id,
              updatedAt: new Date()
            }
          }
        },
        { session }
      );
      
      // If setting status to 'claimed', create redemption records
      if (newStatus === 'claimed') {
        // Get participants that were updated
        const updatedParticipants = await Participant.find(filter, null, { session });
        
        // Create redemption records for each participant
        if (updatedParticipants.length > 0) {
          // First, check which participants already have system redemptions
          const participantIds = updatedParticipants.map(p => p._id);
          const existingRedemptions = await Redemption.find({
            participantId: { $in: participantIds },
            systemCreated: true,
            status: { $ne: 'cancelled' }
          }, null, { session });
          
          // Create set of participant IDs with existing redemptions for easy lookup
          const participantsWithRedemptions = new Set(
            existingRedemptions.map(r => r.participantId.toString())
          );
          
          // Filter participants that don't have redemptions yet
          const participantsNeedingRedemptions = updatedParticipants.filter(
            p => !participantsWithRedemptions.has(p._id.toString())
          );
          
          // Create redemption records
          if (participantsNeedingRedemptions.length > 0) {
            try {
              const redemptionDocs = participantsNeedingRedemptions.map(participant => ({
                participantId: participant._id,
                roomId: participant.roomId,
                rewardId: null, // System-generated redemption
                rupiahSpent: participant.totalRupiah,
                claimedAt: new Date(),
                status: 'fulfilled',
                notes: notes || 'THR claimed via batch status update',
                systemCreated: true,
                createdBy: authSession.user.id
              }));
              
              await Redemption.insertMany(redemptionDocs, { session });
            } catch (redemptionError) {
              console.error('Error creating batch redemption records:', redemptionError);
              // Continue with the status update even if redemption creation fails
            }
          }
        }
      }
      
      await session.commitTransaction();
      
      return NextResponse.json({
        success: true,
        message: `Updated ${updateResult.modifiedCount} participants to ${newStatus} status`,
        updatedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount,
        redemptionsCreated: newStatus === 'claimed' ? true : false
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
    
    console.error('Error batch updating participants:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation error', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Server error while batch updating participants'
    }, { status: 500 });
  } finally {
    // End session
    session.endSession();
  }
} 
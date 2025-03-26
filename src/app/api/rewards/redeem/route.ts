import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Reward, Participant, Redemption } from '@/lib/db/models';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { z } from 'zod';

// Schema validation for redemption
const redemptionSchema = z.object({
  rewardId: z.string().min(1),
  participantId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // Start MongoDB session for transaction
  const dbSession = await mongoose.startSession();
  
  try {
    // Authenticate admin/organizer
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Parse and validate request body
    const body = await req.json();
    const validation = redemptionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { rewardId, participantId } = validation.data;
    
    // Convert string IDs to ObjectIds
    const rewardObjectId = new mongoose.Types.ObjectId(rewardId);
    const participantObjectId = new mongoose.Types.ObjectId(participantId);
    
    // Begin transaction
    dbSession.startTransaction();
    
    try {
      // Find the reward and check if it's available
      const reward = await Reward.findById(rewardObjectId).session(dbSession);
      
      if (!reward) {
        throw new Error('Reward not found');
      }
      
      if (!reward.isActive) {
        throw new Error('Reward is not active');
      }
      
      if (reward.remainingQuantity <= 0) {
        throw new Error('Reward is out of stock');
      }
      
      // Find the participant
      const participant = await Participant.findById(participantObjectId).session(dbSession);
      
      if (!participant) {
        throw new Error('Participant not found');
      }
      
      // Verify participant is in the same room as the reward
      if (participant.roomId.toString() !== reward.roomId.toString()) {
        throw new Error('Participant and reward are not in the same room');
      }
      
      // Check if the participant has enough rupiah
      if (participant.totalRupiah < reward.rupiahRequired) {
        throw new Error(`Not enough Rupiah to claim this reward (needed: ${reward.rupiahRequired}, available: ${participant.totalRupiah})`);
      }
      
      // Deduct rupiah and update remaining quantity
      const updatedParticipant = await Participant.findByIdAndUpdate(
        participantObjectId,
        { $inc: { totalRupiah: -reward.rupiahRequired } },
        { session: dbSession, new: true }
      );
      
      await Reward.findByIdAndUpdate(
        rewardObjectId,
        { $inc: { remainingQuantity: -1 } },
        { session: dbSession }
      );
      
      // Create redemption record
      const redemption = await Redemption.create(
        [{
          rewardId: rewardObjectId,
          participantId: participantObjectId,
          roomId: reward.roomId,
          rupiahSpent: reward.rupiahRequired,
          claimedAt: new Date(),
          status: 'pending',
        }],
        { session: dbSession }
      );
      
      // Commit the transaction
      await dbSession.commitTransaction();
      
      return NextResponse.json({
        success: true,
        message: 'Reward successfully redeemed',
        redemptionId: redemption[0]._id,
        newRupiahTotal: updatedParticipant.totalRupiah
      }, { status: 200 });
    } catch (error: any) {
      // Abort the transaction on error
      await dbSession.abortTransaction();
      
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to redeem reward'
      }, { status: 400 });
    }
  } catch (error) {
    // Ensure transaction is aborted on outer errors
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }
    
    console.error('Error redeeming reward:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation error', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Server error while processing redemption'
    }, { status: 500 });
  } finally {
    // End the session
    dbSession.endSession();
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Reward, Participant, Redemption } from '@/lib/db/models';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const { rewardId, participantId } = await req.json();
    
    if (!rewardId || !participantId) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find the reward and check if it's available
      const reward = await Reward.findById(rewardId).session(session);
      
      if (!reward) {
        throw new Error('Reward not found');
      }
      
      if (reward.remainingQuantity <= 0) {
        throw new Error('Reward is out of stock');
      }
      
      // Find the participant
      const participant = await Participant.findById(participantId).session(session);
      
      if (!participant) {
        throw new Error('Participant not found');
      }
      
      // Check if the participant has enough rupiah
      if (participant.totalRupiah < reward.rupiahRequired) {
        throw new Error('Not enough Rupiah to claim this reward');
      }
      
      // Deduct rupiah and update remaining quantity
      await Participant.findByIdAndUpdate(
        participantId,
        { $inc: { totalRupiah: -reward.rupiahRequired } },
        { session }
      );
      
      await Reward.findByIdAndUpdate(
        rewardId,
        { $inc: { remainingQuantity: -1 } },
        { session }
      );
      
      // Create redemption record
      const redemption = await Redemption.create(
        [{
          rewardId,
          participantId,
          roomId: reward.roomId,
          rupiahSpent: reward.rupiahRequired,
          claimedAt: new Date(),
          status: 'pending',
        }],
        { session }
      );
      
      // Commit the transaction
      await session.commitTransaction();
      
      return new NextResponse(JSON.stringify({
        success: true,
        message: 'Reward successfully redeemed',
        redemptionId: redemption[0]._id,
        newRupiahTotal: participant.totalRupiah - reward.rupiahRequired
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (error: any) {
      // Abort the transaction on error
      await session.abortTransaction();
      
      return new NextResponse(JSON.stringify({
        success: false,
        error: error.message || 'Failed to redeem reward'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return new NextResponse(JSON.stringify({
      success: false,
      error: 'Server error while processing redemption'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
} 
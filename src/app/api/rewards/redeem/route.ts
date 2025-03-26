import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Reward, Participant, Redemption } from '@/lib/db/models';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

interface User {
  _id: string;
  name: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authSession.user as User;
    
    if (!user || !user._id) {
      return NextResponse.json({ error: 'User authentication issue - Please sign out and sign in again' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { rewardId, participantId } = await req.json();
    
    if (!rewardId || !participantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Start a session for transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();
    
    try {
      // Find the reward and check if it's available
      const reward = await Reward.findById(rewardId).session(dbSession);
      
      if (!reward) {
        throw new Error('Reward not found');
      }
      
      if (reward.remainingQuantity <= 0) {
        throw new Error('Reward is out of stock');
      }
      
      // Find the participant
      const participant = await Participant.findById(participantId).session(dbSession);
      
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
        { session: dbSession }
      );
      
      await Reward.findByIdAndUpdate(
        rewardId,
        { $inc: { remainingQuantity: -1 } },
        { session: dbSession }
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
        { session: dbSession }
      );
      
      // Commit the transaction
      await dbSession.commitTransaction();
      
      return NextResponse.json({
        success: true,
        message: 'Reward successfully redeemed',
        redemptionId: redemption[0]._id,
        newRupiahTotal: participant.totalRupiah - reward.rupiahRequired
      }, { status: 200 });
    } catch (error: any) {
      // Abort the transaction on error
      await dbSession.abortTransaction();
      
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to redeem reward'
      }, { status: 400 });
    } finally {
      // End the session
      dbSession.endSession();
    }
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error while processing redemption'
    }, { status: 500 });
  }
} 
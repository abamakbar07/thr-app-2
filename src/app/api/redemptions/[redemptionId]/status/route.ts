import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { Redemption, Participant, Reward } from '@/lib/db/models';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { z } from 'zod';

// Schema validation for redemption status update
const redemptionStatusSchema = z.object({
  status: z.enum(['pending', 'fulfilled', 'cancelled']),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { redemptionId: string } }
) {
  try {
    // Authenticate admin/organizer
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { redemptionId } = await params;
    
    // Parse and validate request body
    const body = await req.json();
    const validation = redemptionStatusSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { status, notes } = validation.data;
    
    // Find the redemption
    const redemption = await Redemption.findById(redemptionId);
    
    if (!redemption) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 });
    }
    
    // Can only update from pending status
    if (redemption.status !== 'pending') {
      return NextResponse.json({ 
        error: `Cannot update redemption that is already ${redemption.status}` 
      }, { status: 400 });
    }
    
    // Start a MongoDB session for potential transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // If cancelling, refund the rupiah to the participant
      if (status === 'cancelled') {
        // Get the participant
        const participant = await Participant.findById(redemption.participantId);
        
        if (!participant) {
          throw new Error('Participant not found');
        }
        
        // Update participant's THR balance
        await Participant.findByIdAndUpdate(
          redemption.participantId,
          { 
            $inc: { totalRupiah: redemption.rupiahSpent },
            $push: { 
              adjustments: {
                amount: redemption.rupiahSpent,
                reason: 'Refund from cancelled redemption',
                adminId: authSession.user.id,
                createdAt: new Date()
              }
            }
          },
          { session }
        );
        
        // Increase the reward's quantity
        await Reward.findByIdAndUpdate(
          redemption.rewardId,
          { $inc: { remainingQuantity: 1 } },
          { session }
        );
      }
      
      // Update redemption status
      const updatedRedemption = await Redemption.findByIdAndUpdate(
        redemptionId,
        { 
          status,
          notes: notes || undefined,
          updatedBy: authSession.user.id,
          updatedAt: new Date()
        },
        { session, new: true }
      );
      
      await session.commitTransaction();
      
      return NextResponse.json({
        success: true,
        message: `Redemption status updated to ${status}`,
        redemption: {
          id: updatedRedemption._id,
          status: updatedRedemption.status
        }
      }, { status: 200 });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End session
      session.endSession();
    }
  } catch (error) {
    console.error('Error updating redemption status:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation error', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Server error while updating redemption status'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import { 
  validateDatabaseRelationships,
  validateParticipantRupiah,
  validateRewardQuantities,
  findDuplicateAnswers
} from '@/lib/db/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { Participant, Answer, Reward, Redemption } from '@/lib/db/models';
import mongoose from 'mongoose';

/**
 * API endpoint to fix database consistency issues
 * Only accessible to admin users
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const authSession = await getServerSession(authOptions);
    if (!authSession || authSession.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Connect to database
    await dbConnect();
    
    // Get request body to determine what to fix
    const body = await req.json();
    const { 
      fixParticipantRupiah = false,
      fixRewardQuantities = false,
      removeDuplicateAnswers = false
    } = body;
    
    const results: {
      participantRupiah: { fixed: number, details: Array<any> },
      rewardQuantities: { fixed: number, details: Array<any> },
      duplicateAnswers: { removed: number, details: Array<any> }
    } = {
      participantRupiah: { fixed: 0, details: [] },
      rewardQuantities: { fixed: 0, details: [] },
      duplicateAnswers: { removed: 0, details: [] }
    };
    
    // Start a session for transaction
    const dbSession = await mongoose.startSession();
    
    try {
      dbSession.startTransaction();
      
      // Fix participant rupiah balances
      if (fixParticipantRupiah) {
        const inconsistentParticipants = await validateParticipantRupiah();
        
        for (const participant of inconsistentParticipants) {
          await Participant.findByIdAndUpdate(
            participant.participantId,
            { totalRupiah: participant.calculatedBalance },
            { session: dbSession }
          );
          
          results.participantRupiah.fixed++;
          results.participantRupiah.details.push({
            participantId: participant.participantId,
            oldBalance: participant.reportedBalance,
            newBalance: participant.calculatedBalance,
            difference: participant.difference
          });
        }
      }
      
      // Fix reward quantities
      if (fixRewardQuantities) {
        const inconsistentRewards = await validateRewardQuantities();
        
        for (const reward of inconsistentRewards) {
          await Reward.findByIdAndUpdate(
            reward.rewardId,
            { remainingQuantity: reward.calculatedRemaining },
            { session: dbSession }
          );
          
          results.rewardQuantities.fixed++;
          results.rewardQuantities.details.push({
            rewardId: reward.rewardId,
            oldRemaining: reward.reportedRemaining,
            newRemaining: reward.calculatedRemaining,
            difference: reward.difference
          });
        }
      }
      
      // Remove duplicate answers
      if (removeDuplicateAnswers) {
        const duplicates = await findDuplicateAnswers();
        
        for (const duplicate of duplicates) {
          // Keep the first answer, remove the rest
          const answersToKeep = duplicate.answers.slice(0, 1);
          const answersToRemove = duplicate.answers.slice(1);
          
          // Remove duplicates
          await Answer.deleteMany(
            { _id: { $in: answersToRemove } },
            { session: dbSession }
          );
          
          results.duplicateAnswers.removed += answersToRemove.length;
          results.duplicateAnswers.details.push({
            participantId: duplicate._id.participantId,
            questionId: duplicate._id.questionId,
            keptAnswerId: answersToKeep[0],
            removedAnswerIds: answersToRemove
          });
        }
      }
      
      // Commit the transaction
      await dbSession.commitTransaction();
      
      return NextResponse.json({
        success: true,
        results
      });
    } catch (error) {
      // Abort the transaction on error
      await dbSession.abortTransaction();
      throw error;
    } finally {
      // End the session
      dbSession.endSession();
    }
  } catch (error) {
    console.error('Database fix error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fix database inconsistencies', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
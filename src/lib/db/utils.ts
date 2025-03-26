import mongoose from 'mongoose';
import { 
  User, Room, Question, Participant,
  Answer, Reward, Redemption, AccessCode
} from './models';

/**
 * Check if an ObjectId reference exists in the target collection
 * @param id The ObjectId to check
 * @param model The mongoose model to query
 * @returns Promise<boolean> indicating if the reference exists
 */
export async function validateIdReference(
  id: mongoose.Types.ObjectId | string,
  model: mongoose.Model<any>
): Promise<boolean> {
  if (!id) return false;
  if (!mongoose.isValidObjectId(id)) return false;
  
  try {
    const doc = await model.findById(id).select('_id').lean();
    return !!doc;
  } catch (error) {
    console.error('Error validating reference:', error);
    return false;
  }
}

/**
 * Validate relationships between collections to ensure data integrity
 * @returns Object containing validation results for each relationship
 */
export async function validateDatabaseRelationships() {
  const results = {
    rooms: { valid: 0, invalid: 0, details: [] as any[] },
    questions: { valid: 0, invalid: 0, details: [] as any[] },
    participants: { valid: 0, invalid: 0, details: [] as any[] },
    answers: { valid: 0, invalid: 0, details: [] as any[] },
    rewards: { valid: 0, invalid: 0, details: [] as any[] },
    redemptions: { valid: 0, invalid: 0, details: [] as any[] },
    accessCodes: { valid: 0, invalid: 0, details: [] as any[] },
  };

  // Validate Room -> User (createdBy) relationships
  const rooms = await Room.find().lean();
  for (const room of rooms) {
    const isValid = await validateIdReference(room.createdBy, User);
    if (isValid) {
      results.rooms.valid++;
    } else {
      results.rooms.invalid++;
      results.rooms.details.push({
        roomId: room._id,
        invalidReference: { field: 'createdBy', value: room.createdBy }
      });
    }
  }

  // Validate Question -> Room relationships
  const questions = await Question.find().lean();
  for (const question of questions) {
    const isValid = await validateIdReference(question.roomId, Room);
    if (isValid) {
      results.questions.valid++;
    } else {
      results.questions.invalid++;
      results.questions.details.push({
        questionId: question._id,
        invalidReference: { field: 'roomId', value: question.roomId }
      });
    }
  }

  // Validate Participant -> Room relationships
  const participants = await Participant.find().lean();
  for (const participant of participants) {
    const isValid = await validateIdReference(participant.roomId, Room);
    if (isValid) {
      results.participants.valid++;
    } else {
      results.participants.invalid++;
      results.participants.details.push({
        participantId: participant._id,
        invalidReference: { field: 'roomId', value: participant.roomId }
      });
    }
  }

  // Validate other collections (you can add more detailed validations as needed)

  return results;
}

/**
 * Check for duplicate answers from a participant for the same question
 * @returns Array of duplicated answers
 */
export async function findDuplicateAnswers() {
  const duplicates = await Answer.aggregate([
    {
      $group: {
        _id: { participantId: '$participantId', questionId: '$questionId' },
        count: { $sum: 1 },
        answers: { $push: '$_id' }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ]);
  
  return duplicates;
}

/**
 * Ensure reward quantities are consistent with remaining quantities
 * @returns Array of rewards with inconsistent quantities
 */
export async function validateRewardQuantities() {
  const rewards = await Reward.find().lean();
  const inconsistentRewards = [];
  
  for (const reward of rewards) {
    // Count redemptions for this reward
    const redemptionCount = await Redemption.countDocuments({
      rewardId: reward._id,
      status: { $ne: 'cancelled' } // Don't count cancelled redemptions
    });
    
    const expectedRemaining = reward.quantity - redemptionCount;
    if (reward.remainingQuantity !== expectedRemaining) {
      inconsistentRewards.push({
        rewardId: reward._id,
        reportedRemaining: reward.remainingQuantity,
        calculatedRemaining: expectedRemaining,
        difference: reward.remainingQuantity - expectedRemaining
      });
    }
  }
  
  return inconsistentRewards;
}

/**
 * Ensure participant rupiah balance is consistent with their answers
 * @returns Array of participants with inconsistent rupiah balances
 */
export async function validateParticipantRupiah() {
  const participants = await Participant.find().lean();
  const inconsistentParticipants = [];
  
  for (const participant of participants) {
    // Sum all rupiah awarded from answers
    const earnedRupiah = await Answer.aggregate([
      { $match: { participantId: participant._id } },
      { $group: { _id: null, total: { $sum: '$rupiahAwarded' } } }
    ]);
    
    // Sum all rupiah spent on redemptions
    const spentRupiah = await Redemption.aggregate([
      { 
        $match: { 
          participantId: participant._id,
          status: { $ne: 'cancelled' } // Don't count cancelled redemptions
        } 
      },
      { $group: { _id: null, total: { $sum: '$rupiahSpent' } } }
    ]);
    
    const totalEarned = earnedRupiah[0]?.total || 0;
    const totalSpent = spentRupiah[0]?.total || 0;
    const expectedBalance = totalEarned - totalSpent;
    
    if (participant.totalRupiah !== expectedBalance) {
      inconsistentParticipants.push({
        participantId: participant._id,
        reportedBalance: participant.totalRupiah,
        calculatedBalance: expectedBalance,
        difference: participant.totalRupiah - expectedBalance
      });
    }
  }
  
  return inconsistentParticipants;
}

/**
 * Recalculate and update a single participant's rupiah balance
 * @param participantId The participant's ObjectId
 * @param session Optional mongoose session for transactions
 * @returns Object with old and new balance
 */
export async function recalculateParticipantRupiah(
  participantId: mongoose.Types.ObjectId | string,
  session?: mongoose.ClientSession
) {
  // Convert to ObjectId if string
  const participantObjectId = typeof participantId === 'string' 
    ? new mongoose.Types.ObjectId(participantId)
    : participantId;
    
  // Find the participant
  const participant = await Participant.findById(participantObjectId);
  if (!participant) {
    throw new Error(`Participant with ID ${participantId} not found`);
  }
  
  // Calculate earned rupiah
  const earnedResults = await Answer.aggregate([
    { 
      $match: { 
        participantId: participantObjectId 
      } 
    },
    { 
      $group: { 
        _id: null, 
        total: { $sum: '$rupiahAwarded' } 
      } 
    }
  ]);
  
  // Calculate spent rupiah
  const spentResults = await Redemption.aggregate([
    { 
      $match: { 
        participantId: participantObjectId,
        status: { $ne: 'cancelled' }
      } 
    },
    { 
      $group: { 
        _id: null, 
        total: { $sum: '$rupiahSpent' } 
      } 
    }
  ]);
  
  const totalEarned = earnedResults[0]?.total || 0;
  const totalSpent = spentResults[0]?.total || 0;
  const calculatedBalance = totalEarned - totalSpent;
  
  // Update the participant's balance if different
  if (participant.totalRupiah !== calculatedBalance) {
    const oldBalance = participant.totalRupiah;
    
    if (session) {
      await Participant.findByIdAndUpdate(
        participantObjectId,
        { totalRupiah: calculatedBalance },
        { session }
      );
    } else {
      participant.totalRupiah = calculatedBalance;
      await participant.save();
    }
    
    return {
      participantId: participantObjectId,
      oldBalance,
      newBalance: calculatedBalance,
      difference: oldBalance - calculatedBalance
    };
  }
  
  return {
    participantId: participantObjectId,
    oldBalance: participant.totalRupiah,
    newBalance: participant.totalRupiah,
    difference: 0
  };
}

/**
 * Check for answers with invalid questionId references
 * @returns Array of invalid answers
 */
export async function findInvalidAnswers() {
  const answers = await Answer.find().lean();
  const invalidAnswers = [];
  
  for (const answer of answers) {
    // Check if question exists
    const questionExists = await Question.exists({ _id: answer.questionId });
    
    if (!questionExists) {
      invalidAnswers.push({
        answerId: answer._id,
        invalidReference: {
          field: 'questionId',
          value: answer.questionId
        }
      });
      continue;
    }
    
    // Check if participant exists
    const participantExists = await Participant.exists({ _id: answer.participantId });
    
    if (!participantExists) {
      invalidAnswers.push({
        answerId: answer._id,
        invalidReference: {
          field: 'participantId',
          value: answer.participantId
        }
      });
    }
  }
  
  return invalidAnswers;
} 
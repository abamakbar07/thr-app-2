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
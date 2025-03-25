import mongoose, { Schema } from 'mongoose';

export interface IRedemption {
  _id?: string;
  rewardId: string;
  participantId: string;
  roomId: string;
  rupiahSpent: number;
  claimedAt: Date;
  status: 'pending' | 'fulfilled' | 'cancelled';
  notes?: string;
}

const RedemptionSchema = new Schema<IRedemption>({
  rewardId: {
    type: String,
    ref: 'Reward',
    required: true,
  },
  participantId: {
    type: String,
    ref: 'Participant',
    required: true,
  },
  roomId: {
    type: String,
    ref: 'Room',
    required: true,
  },
  rupiahSpent: {
    type: Number,
    required: true,
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'fulfilled', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
  },
});

export default mongoose.models.Redemption || mongoose.model<IRedemption>('Redemption', RedemptionSchema); 
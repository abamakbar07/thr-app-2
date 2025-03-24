import mongoose, { Schema } from 'mongoose';

export interface IRedemption {
  _id?: string;
  rewardId: string;
  participantId: string;
  roomId: string;
  pointsSpent: number;
  claimedAt: Date;
  status: 'pending' | 'fulfilled' | 'cancelled';
  notes?: string;
}

const RedemptionSchema = new Schema<IRedemption>({
  rewardId: {
    type: Schema.Types.ObjectId,
    ref: 'Reward',
    required: true,
  },
  participantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  pointsSpent: {
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
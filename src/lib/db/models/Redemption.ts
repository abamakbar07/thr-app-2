import mongoose, { Schema } from 'mongoose';

export interface IRedemption {
  _id?: string;
  rewardId: mongoose.Types.ObjectId;
  participantId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  rupiahSpent: number;
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
    index: true,
  },
  rupiahSpent: {
    type: Number,
    required: true,
    min: 0,
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'fulfilled', 'cancelled'],
    default: 'pending',
    index: true,
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

// Compound indexes for common queries
RedemptionSchema.index({ roomId: 1, status: 1 });
RedemptionSchema.index({ participantId: 1, status: 1 });
RedemptionSchema.index({ rewardId: 1, status: 1 });

export default mongoose.models.Redemption || mongoose.model<IRedemption>('Redemption', RedemptionSchema); 
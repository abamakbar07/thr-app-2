import mongoose, { Schema } from 'mongoose';

export interface IRedemption {
  _id?: string;
  participantId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  rewardId?: mongoose.Types.ObjectId | null;
  rupiahSpent: number;
  claimedAt: Date;
  status: 'pending' | 'fulfilled' | 'cancelled';
  notes?: string;
  updatedAt?: Date;
  updatedBy?: mongoose.Types.ObjectId;
  systemCreated?: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

const RedemptionSchema = new Schema<IRedemption>({
  participantId: {
    type: Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
    index: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  rewardId: {
    type: Schema.Types.ObjectId,
    ref: 'Reward',
    required: false,
    default: null,
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
  },
  notes: {
    type: String,
  },
  updatedAt: {
    type: Date,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  systemCreated: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

// Compound indexes for queries
RedemptionSchema.index({ participantId: 1, claimedAt: -1 });
RedemptionSchema.index({ roomId: 1, status: 1 });
RedemptionSchema.index({ participantId: 1, systemCreated: 1, status: 1 });

export default mongoose.models.Redemption || mongoose.model<IRedemption>('Redemption', RedemptionSchema); 
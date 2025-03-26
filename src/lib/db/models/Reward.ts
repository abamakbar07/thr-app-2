import mongoose, { Schema } from 'mongoose';

export interface IReward {
  _id?: string;
  roomId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  rupiahRequired: number;
  imageUrl: string;
  quantity: number;
  remainingQuantity: number;
  isActive?: boolean;
}

const RewardSchema = new Schema<IReward>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    required: true,
    index: true,
  },
  rupiahRequired: {
    type: Number,
    required: true,
    min: 0,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  remainingQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  }
}, { timestamps: true });

// Compound indexes for common queries
RewardSchema.index({ roomId: 1, tier: 1 });
RewardSchema.index({ roomId: 1, rupiahRequired: 1 });

export default mongoose.models.Reward || mongoose.model<IReward>('Reward', RewardSchema); 
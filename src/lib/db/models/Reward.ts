import mongoose, { Schema } from 'mongoose';

export interface IReward {
  _id?: string;
  roomId: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  rupiahRequired: number;
  imageUrl: string;
  quantity: number;
  remainingQuantity: number;
}

const RewardSchema = new Schema<IReward>({
  roomId: {
    type: String,
    ref: 'Room',
    required: true,
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
  },
  rupiahRequired: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  remainingQuantity: {
    type: Number,
    required: true,
  },
});

export default mongoose.models.Reward || mongoose.model<IReward>('Reward', RewardSchema); 
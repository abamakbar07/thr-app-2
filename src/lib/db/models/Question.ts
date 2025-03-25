import mongoose, { Schema } from 'mongoose';

export interface IQuestion {
  _id?: string;
  roomId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  rupiah: number;
  difficulty: 'bronze' | 'silver' | 'gold';
  category: string;
  explanation: string;
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    roomId: {
      type: String,
      ref: 'Room',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctOptionIndex: {
      type: Number,
      required: true,
    },
    rupiah: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['bronze', 'silver', 'gold'],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema); 
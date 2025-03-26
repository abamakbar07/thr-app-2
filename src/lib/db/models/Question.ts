import mongoose, { Schema } from 'mongoose';

export interface IQuestion {
  _id?: string;
  roomId: mongoose.Types.ObjectId;
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
      type: Schema.Types.ObjectId,
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
      validate: {
        validator: function(options: string[]) {
          return options.length >= 2; // Ensure at least 2 options
        },
        message: 'Questions must have at least 2 options'
      }
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      validate: {
        validator: function(this: IQuestion, value: number) {
          return value >= 0 && value < this.options.length;
        },
        message: 'Correct option index must be within the range of available options'
      }
    },
    rupiah: {
      type: Number,
      required: true,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['bronze', 'silver', 'gold'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for room-based queries
QuestionSchema.index({ roomId: 1, isDisabled: 1 });
QuestionSchema.index({ roomId: 1, difficulty: 1 });

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema); 
import mongoose, { Schema } from 'mongoose';

export interface IAnswer {
  _id?: string;
  questionId: mongoose.Types.ObjectId;
  participantId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeToAnswer: number;
  rupiahAwarded: number;
  answeredAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
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
  selectedOptionIndex: {
    type: Number,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
    index: true,
  },
  timeToAnswer: {
    type: Number,
    required: true,
    min: 0,
  },
  rupiahAwarded: {
    type: Number,
    required: true,
    min: 0,
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Create compound indexes for common queries
AnswerSchema.index({ participantId: 1, questionId: 1 }, { unique: true }); // Ensure one answer per question per participant
AnswerSchema.index({ roomId: 1, questionId: 1 });
AnswerSchema.index({ roomId: 1, participantId: 1 });

export default mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema); 
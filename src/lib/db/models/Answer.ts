import mongoose, { Schema } from 'mongoose';

export interface IAnswer {
  _id?: string;
  questionId: string;
  participantId: string;
  roomId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeToAnswer: number;
  pointsAwarded: number;
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
  },
  selectedOptionIndex: {
    type: Number,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  timeToAnswer: {
    type: Number,
    required: true,
  },
  pointsAwarded: {
    type: Number,
    required: true,
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema); 
import mongoose, { Schema } from 'mongoose';

export interface IAnswer {
  _id?: string;
  questionId: string;
  participantId: string;
  roomId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeToAnswer: number;
  rupiahAwarded: number;
  answeredAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: {
    type: String,
    ref: 'Question',
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
  rupiahAwarded: {
    type: Number,
    required: true,
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema); 
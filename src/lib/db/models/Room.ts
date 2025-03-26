import mongoose, { Schema } from 'mongoose';

export interface IRoom {
  _id?: string;
  name: string;
  description: string;
  accessCode: string;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    timePerQuestion: number;
    showLeaderboard: boolean;
    allowRetries: boolean;
    showCorrectAnswers: boolean;
  };
}

const RoomSchema = new Schema<IRoom>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    accessCode: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    settings: {
      timePerQuestion: {
        type: Number,
        default: 15,
      },
      showLeaderboard: {
        type: Boolean,
        default: true,
      },
      allowRetries: {
        type: Boolean,
        default: false,
      },
      showCorrectAnswers: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema); 
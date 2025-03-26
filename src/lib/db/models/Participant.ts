import mongoose, { Schema } from 'mongoose';

export interface IParticipant {
  _id?: string;
  roomId: mongoose.Types.ObjectId;
  name: string;
  joinedAt: Date;
  totalRupiah: number;
  accessCode: string;
  currentStatus: 'active' | 'inactive';
}

const ParticipantSchema = new Schema<IParticipant>({
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
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  totalRupiah: {
    type: Number,
    default: 0,
    min: 0,
  },
  accessCode: {
    type: String,
    required: true,
    unique: true,
  },
  currentStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
}, { timestamps: true });

// Compound index for leaderboard queries
ParticipantSchema.index({ roomId: 1, totalRupiah: -1 });
ParticipantSchema.index({ roomId: 1, currentStatus: 1 });

export default mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema); 
import mongoose, { Schema } from 'mongoose';

export interface IParticipant {
  _id?: string;
  roomId: string;
  name: string;
  joinedAt: Date;
  totalRupiah: number;
  accessCode: string;
  currentStatus: 'active' | 'inactive';
}

const ParticipantSchema = new Schema<IParticipant>({
  roomId: {
    type: String,
    ref: 'Room',
    required: true,
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
  },
});

export default mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema); 
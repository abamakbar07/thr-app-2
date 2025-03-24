import mongoose, { Schema } from 'mongoose';

export interface IParticipant {
  _id?: string;
  roomId: string;
  name: string;
  joinedAt: Date;
  totalPoints: number;
  currentStatus: 'active' | 'inactive';
}

const ParticipantSchema = new Schema<IParticipant>({
  roomId: {
    type: Schema.Types.ObjectId,
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
  totalPoints: {
    type: Number,
    default: 0,
  },
  currentStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
});

export default mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema); 
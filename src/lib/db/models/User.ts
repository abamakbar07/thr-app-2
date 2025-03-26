import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  providers?: {
    providerId: string;
    providerType: string;
  }[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String 
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    providers: [
      {
        providerId: String,
        providerType: String,
      },
    ],
  },
  { 
    timestamps: true 
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 
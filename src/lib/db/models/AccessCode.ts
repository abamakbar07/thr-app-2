import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccessCode extends Document {
  code: string;
  isActive: boolean;
  roomId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
}

const AccessCodeSchema = new Schema<IAccessCode>(
  {
    code: {
      type: String,
      required: [true, "Access code is required"],
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const AccessCode = (mongoose.models.AccessCode ||
  mongoose.model<IAccessCode>("AccessCode", AccessCodeSchema)) as Model<IAccessCode>;

export default AccessCode; 
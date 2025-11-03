import { Schema, model, Document } from 'mongoose';

export interface ResetCodeDocument extends Document {
  userId: number;
  code: string;
  createdAt: Date;
  expiresAt: Date;
}

const resetCodeSchema = new Schema<ResetCodeDocument>({
  userId: { type: Number, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

resetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ResetCode = model<ResetCodeDocument>('ResetCode', resetCodeSchema);

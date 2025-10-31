import { Schema, model, Document } from 'mongoose';

export interface ActivationCodeDocument extends Document {
  userId: number;
  code: string;
  createdAt: Date;
  expiresAt: Date;
}

const activationCodeSchema = new Schema<ActivationCodeDocument>({
  userId: { type: Number, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

activationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ActivationCode = model<ActivationCodeDocument>(
  'ActivationCode',
  activationCodeSchema,
);

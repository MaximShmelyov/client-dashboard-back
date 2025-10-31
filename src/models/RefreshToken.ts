import { Schema, model, Document } from 'mongoose';

export interface RefreshTokenDocument extends Document {
  userId: number;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>({
  userId: { type: Number, required: true, index: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<RefreshTokenDocument>(
  'RefreshToken',
  refreshTokenSchema,
);

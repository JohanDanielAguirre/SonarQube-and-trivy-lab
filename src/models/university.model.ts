import { Schema, model } from 'mongoose';

export interface IUniversity {
  name: string;
  country?: string;
  city?: string;
}

const schema = new Schema<IUniversity>({
  name: { type: String, required: true, trim: true, unique: true },
  country: { type: String, trim: true },
  city: { type: String, trim: true }
}, { timestamps: true });

export const UniversityModel = model<IUniversity>('University', schema);
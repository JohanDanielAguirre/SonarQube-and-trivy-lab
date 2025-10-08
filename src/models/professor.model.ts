import { Schema, model, Types } from 'mongoose';

export interface IProfessor {
  name: string;
  department?: string;
  university: Types.ObjectId; // ref University
}

const schema = new Schema<IProfessor>({
  name: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  university: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true }
}, { timestamps: true });

export const ProfessorModel = model<IProfessor>('Professor', schema);
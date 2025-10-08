import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  universidad: mongoose.Types.ObjectId;
  carrera: string;
  semestre: number;
  activo: boolean;
}

const studentSchema = new Schema<IStudent>({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  universidad: {
    type: Schema.Types.ObjectId,
    ref: 'University',
    required: true
  },
  carrera: {
    type: String,
    required: true,
    trim: true
  },
  semestre: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Student = mongoose.model<IStudent>('Student', studentSchema);

export default Student;
import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export type Role = 'superadmin' | 'user';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 160,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'user'], default: 'user', index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash; // ocultar hash en respuestas
        return ret;
      },
    },
  }
);

// Método de instancia para validar contraseña
UserSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const UserModel = model<IUser>('User', UserSchema);
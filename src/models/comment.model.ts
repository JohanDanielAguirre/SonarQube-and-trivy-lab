import { Schema, model, Types, Document } from 'mongoose';

export interface IComment extends Document {
  id?: string;                // id legible (mapeado desde _id en toJSON)
  user: Types.ObjectId;        // ref User
  professor: Types.ObjectId;   // ref Professor
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  professor: { type: Schema.Types.ObjectId, ref: 'Professor', required: true, index: true },
  content: { type: String, required: true, trim: true, minlength: 2, maxlength: 1000 }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform(_doc, ret) {
      ret.id = ret._id?.toString();
      // Mantener _id para compatibilidad
      return ret;
    }
  }
});

schema.index({ professor: 1, createdAt: -1 });

export const CommentModel = model<IComment>('Comment', schema);

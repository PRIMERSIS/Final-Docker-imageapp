import mongoose, { Document, Schema } from "mongoose";

export interface ILike extends Document {
  user: mongoose.Types.ObjectId;
  image: mongoose.Types.ObjectId;
}

const LikeSchema = new Schema<ILike>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: Schema.Types.ObjectId, ref: "Image", required: true },
  },
  { timestamps: true }
);

LikeSchema.index({ user: 1, image: 1 }, { unique: true });

export const Like = mongoose.model<ILike>("Like", LikeSchema);

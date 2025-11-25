import mongoose, { Document, Schema } from "mongoose";

export interface IImage extends Document {
  user: mongoose.Types.ObjectId;

  imageUrl: string;
  publicId: string;

  // fileName: string;

  description: string;
  visibility: "public" | "private";
  status: "pending" | "approved";
  createdAt: Date;
}

const ImageSchema = new Schema<IImage>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },

  imageUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  // fileName: { type: String, required: true },
  description: { type: String },
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export const Image = mongoose.model<IImage>("Image", ImageSchema);

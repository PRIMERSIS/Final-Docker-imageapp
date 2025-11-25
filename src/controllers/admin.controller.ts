import { Request, Response } from "express";
import { User } from "../models/User";
import { Image } from "../models/Image";
import { cloudinary } from "../config/cloudinary";

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await User.find().select("-password");
  res.json({ users });
};

export const approveImage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await Image.findByIdAndUpdate(
    id,
    { status: "approved" },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Image not found!" });
  res.json({ message: "Image Approved", image: updated });
};

export const deleteImage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const image = await Image.findById(id);
  if (!image) return res.status(404).json({ error: "Image not found!" });
  await cloudinary.uploader.destroy(image.publicId);
  await image.deleteOne();
  res.json({ message: "Image deleted!" });
};

export const getPendingImage = async (req: Request, res: Response) => {
  const images = await Image.find({ status: "pending" }).populate(
    "user",
    "email"
  );
  res.json({ images });
};

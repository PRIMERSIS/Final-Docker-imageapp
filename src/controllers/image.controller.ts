import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middlewares";
import { Image } from "../models/Image";
import { cloudinary } from "../config/cloudinary";

export const uploadImage = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing image file" });
  }

  const { description, visibility } = req.body;

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "myImages",
    },
    async (error, result) => {
      if (error || !result) {
        return res.status(500).json({ error: "Upload to Cloudinary failed!" });
      }

      const newImage = new Image({
        user: req.user?.id,
        imageUrl: result.secure_url,
        publicId: result.public_id,
        description,
        visibility: visibility === "private" ? "private" : "public",
        status: "pending",
      });

      const saved = await newImage.save();
      res.status(201).json({
        message: "image uploaded. Awaiting admin approval!",
        image: saved,
      });
    }
  );
  uploadStream.end(req.file.buffer);
};
export const getPublicImage = async (req: AuthRequest, res: Response) => {
  const images = await Image.find({
    status: "approved",
    visibility: "public",
  })
    .populate("user", "email")
    .sort({ createdAt: -1 });

  res.json({ images });
};

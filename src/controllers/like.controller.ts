import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middlewares";
import { Like } from "../models/Like";

export const toggleLike = async (req: AuthRequest, res: Response) => {
  const { imageId } = req.params;
  const userId = req.user?.id;

  const existing = await Like.findOne({ user: userId, image: imageId });

  if (!existing) {
    const like = new Like({ user: userId, image: imageId });
    await like.save();
    return res.json({ liked: true });
  }
  await existing.deleteOne();
  return res.json({ liked: false });
};

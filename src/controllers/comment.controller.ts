import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middlewares";
import { Comment } from "../models/Comment";

export const postComment = async (req: AuthRequest, res: Response) => {
  const { imageId } = req.params;
  const { content } = req.body;

  const comment = new Comment({
    user: req.user?.id,
    image: imageId,
    content,
  });

  await comment.save();
  res.status(201).json({ comment });
};

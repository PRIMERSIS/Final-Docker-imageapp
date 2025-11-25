import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middlewares";
import { User } from "../models/User";

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.user?.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Access dinied. Admin only" });
  }
  next();
};

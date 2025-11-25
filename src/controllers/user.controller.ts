import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middlewares";
import { User } from "../models/User";

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?.id).select("-password");
  res.json({ user });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;
  const updated = await User.findByIdAndUpdate(
    req.user?.id,
    { name, email },
    { new: true }
  );

  res.json({ user: updated });
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  await User.findByIdAndDelete(req.user?.id);
  res.json({ message: "User Deleted!" });
};

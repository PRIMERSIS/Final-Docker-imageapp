import jwt from "jsonwebtoken";
import { IUser, User } from "../models/User";
import { comparePassword, hashPassword } from "../utils/hash";
import dotenv from "dotenv";

dotenv.config();

interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}
interface LoginDTO {
  email: string;
  password: string;
}

// const function_name = (name:string):string => {return name}
export const register = async ({
  name,
  email,
  password,
}: RegisterDTO): Promise<IUser> => {
  const existing = await User.findOne({ email });

  if (existing) {
    throw new Error("Email already exists!");
  }

  const hashed = await hashPassword(password);

  const newUser = new User({
    name,
    email,
    password: hashed,
  });

  return await newUser.save();
};

export const login = async ({
  email,
  password,
}: LoginDTO): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid Email.");

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new Error("Invalid Password.");

  const payload = { id: user._id, email: user.email };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

export const refreshToken = async (token: string): Promise<string> => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== token) {
    throw new Error("Invalid Refresh Token");
  }

  const newAccessToken = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
  return newAccessToken;
};

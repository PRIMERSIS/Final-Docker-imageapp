import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
 
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_ATLAS_URI || "mongodb://localhost:27017/imageapp";
  
  if (!mongoUri) {
    throw new Error("MongoDB URI is not defined. Please set MONGO_URI or MONGO_ATLAS_URI in your .env file");
  }
  
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected!!!");
};

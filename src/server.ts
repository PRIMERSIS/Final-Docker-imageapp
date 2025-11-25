import dotenv from "dotenv";
import { connectDB } from "./config/db";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT;

connectDB().then(() =>
  app.listen(PORT, () =>
    console.log("Server is running on http://localhost:9999/")
  )
);

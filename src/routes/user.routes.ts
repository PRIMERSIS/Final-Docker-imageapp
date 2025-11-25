import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middlewares";
import {
  deleteAccount,
  getProfile,
  updateProfile,
} from "../controllers/user.controller";

const router = Router();

router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.delete("/me", authMiddleware, deleteAccount);

export default router;

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middlewares";
import { toggleLike } from "../controllers/like.controller";

const router = Router();

router.post("/:imageId", authMiddleware, toggleLike);

export default router;

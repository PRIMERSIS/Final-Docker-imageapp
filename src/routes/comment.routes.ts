import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middlewares";
import { postComment } from "../controllers/comment.controller";

const router = Router();

router.post("/:imageId", authMiddleware, postComment);

export default router;

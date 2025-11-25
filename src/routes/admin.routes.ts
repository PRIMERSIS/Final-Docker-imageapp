import { Router } from "express";
import { requireAdmin } from "../middlewares/admin.middlewares";
import { authMiddleware } from "../middlewares/auth.middlewares";
import { approveImage, deleteImage, getAllUsers, getPendingImage } from "../controllers/admin.controller";

const router = Router();

router.get("/users", authMiddleware, requireAdmin, getAllUsers);

router.get("/images/pending", authMiddleware, requireAdmin, getPendingImage);
router.patch("/images/:id/approve", authMiddleware, requireAdmin, approveImage);
router.delete("/images/:id", authMiddleware, requireAdmin, deleteImage);

export default router;

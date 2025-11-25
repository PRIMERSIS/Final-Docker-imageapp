import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middlewares";
import { getPublicImage, uploadImage } from "../controllers/image.controller";
import { cloudinaryUpload } from "../utils/cloudinaryUpload";

const router = Router();

router.post(
  "/upload",
  authMiddleware,
  cloudinaryUpload.single("image"),
  uploadImage
);

router.get("/public", getPublicImage)

export default router;

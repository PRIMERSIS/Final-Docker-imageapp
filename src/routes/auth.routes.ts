import { Router } from "express";
import {
  login,
  register,
  refreshTokenHandler,
  logout,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshTokenHandler);
router.post("/logout", logout);

export default router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../middlewares/auth.middlewares");
const like_controller_1 = require("../controllers/like.controller");
const router = (0, express_1.Router)();
router.post("/:imageId", auth_middlewares_1.authMiddleware, like_controller_1.toggleLike);
exports.default = router;

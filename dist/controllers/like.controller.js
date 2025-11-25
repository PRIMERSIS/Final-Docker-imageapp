"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleLike = void 0;
const Like_1 = require("../models/Like");
const toggleLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { imageId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const existing = yield Like_1.Like.findOne({ user: userId, image: imageId });
    if (!existing) {
        const like = new Like_1.Like({ user: userId, image: imageId });
        yield like.save();
        return res.json({ liked: true });
    }
    yield existing.deleteOne();
    return res.json({ liked: false });
});
exports.toggleLike = toggleLike;

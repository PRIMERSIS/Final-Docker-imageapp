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
exports.postComment = void 0;
const Comment_1 = require("../models/Comment");
const postComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { imageId } = req.params;
    const { content } = req.body;
    const comment = new Comment_1.Comment({
        user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        image: imageId,
        content,
    });
    yield comment.save();
    res.status(201).json({ comment });
});
exports.postComment = postComment;

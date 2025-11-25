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
exports.getPendingImage = exports.deleteImage = exports.approveImage = exports.getAllUsers = void 0;
const User_1 = require("../models/User");
const Image_1 = require("../models/Image");
const cloudinary_1 = require("../config/cloudinary");
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield User_1.User.find().select("-password");
    res.json({ users });
});
exports.getAllUsers = getAllUsers;
const approveImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updated = yield Image_1.Image.findByIdAndUpdate(id, { status: "approved" }, { new: true });
    if (!updated)
        return res.status(404).json({ error: "Image not found!" });
    res.json({ message: "Image Approved", image: updated });
});
exports.approveImage = approveImage;
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const image = yield Image_1.Image.findById(id);
    if (!image)
        return res.status(404).json({ error: "Image not found!" });
    yield cloudinary_1.cloudinary.uploader.destroy(image.publicId);
    yield image.deleteOne();
    res.json({ message: "Image deleted!" });
});
exports.deleteImage = deleteImage;
const getPendingImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const images = yield Image_1.Image.find({ status: "pending" }).populate("user", "email");
    res.json({ images });
});
exports.getPendingImage = getPendingImage;

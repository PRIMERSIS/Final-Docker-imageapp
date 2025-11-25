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
exports.deleteAccount = exports.updateProfile = exports.getProfile = void 0;
const User_1 = require("../models/User");
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ user: req.user });
});
exports.getProfile = getProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, email } = req.body;
    const updated = yield User_1.User.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, { name, email }, { new: true });
    res.json({ user: updated });
});
exports.updateProfile = updateProfile;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield User_1.User.findByIdAndDelete((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    res.json({ message: "User Deleted!" });
});
exports.deleteAccount = deleteAccount;

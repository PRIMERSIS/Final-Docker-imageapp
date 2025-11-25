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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const hash_1 = require("../utils/hash");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const register = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, email, password, }) {
    const existing = yield User_1.User.findOne({ email });
    if (existing) {
        throw new Error("Email already exists!");
    }
    const hashed = yield (0, hash_1.hashPassword)(password);
    const newUser = new User_1.User({
        name,
        email,
        password: hashed,
    });
    return yield newUser.save();
});
exports.register = register;
const login = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, password, }) {
    const user = yield User_1.User.findOne({ email });
    if (!user)
        throw new Error("Invalid Email.");
    const isMatch = yield (0, hash_1.comparePassword)(password, user.password);
    if (!isMatch)
        throw new Error("Invalid Password.");
    const payload = { id: user._id, email: user.email };
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
    user.refreshToken = refreshToken;
    yield user.save();
    return { accessToken, refreshToken };
});
exports.login = login;
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const user = yield User_1.User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
        throw new Error("Invalid Refresh Token");
    }
    const newAccessToken = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
    return newAccessToken;
});
exports.refreshToken = refreshToken;

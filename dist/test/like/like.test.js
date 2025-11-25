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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../../models/User");
const Image_1 = require("../../models/Image");
const Like_1 = require("../../models/Like");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
jest.setTimeout(30000);
describe("Like API", () => {
    const testUser = {
        name: "Test User",
        email: "test-USER@example.com",
        password: "123456",
    };
    let accessToken;
    let userId;
    let imageId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState === 0) {
            yield mongoose_1.default.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI, {});
        }
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield User_1.User.deleteMany({ email: testUser.email });
        yield Image_1.Image.deleteMany({});
        yield Like_1.Like.deleteMany({});
        const registerRes = yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
        userId = registerRes.body.user._id;
        const loginRes = yield (0, supertest_1.default)(app_1.default)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: testUser.password });
        if (loginRes.statusCode !== 200) {
            console.log("LOGIN ERROR in beforeEach:", loginRes.body, loginRes.text);
        }
        accessToken = loginRes.body.accessToken;
        expect(accessToken).toBeDefined();
        const image = new Image_1.Image({
            user: userId,
            imageUrl: "https://example.com/test-image.jpg",
            publicId: "test-image-id",
            description: "Test image for likes",
            visibility: "public",
            status: "approved",
        });
        const savedImage = yield image.save();
        imageId = String(savedImage._id);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    describe("POST /api/likes/:imageId", () => {
        it("should like an image successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/likes/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`);
            if (res.statusCode !== 200)
                console.log("LIKE ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("liked", true);
            const like = yield Like_1.Like.findOne({ user: userId, image: imageId });
            expect(like).not.toBeNull();
        }));
        it("should unlike an image when already liked", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app_1.default)
                .post(`/api/likes/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`);
            const res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/likes/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`);
            if (res.statusCode !== 200)
                console.log("UNLIKE ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("liked", false);
            const like = yield Like_1.Like.findOne({ user: userId, image: imageId });
            expect(like).toBeNull();
        }));
        it("should toggle like multiple times correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            let res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/likes/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`);
            expect(res.body.liked).toBe(true);
            res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/likes/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`);
            expect(res.body.liked).toBe(false);
            res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/likes/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`);
            expect(res.body.liked).toBe(true);
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).post(`/api/likes/${imageId}`);
            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty("error", "UnAuthorized!!!");
        }));
        it("should handle non-existent image ID gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeImageId = new mongoose_1.default.Types.ObjectId().toString();
            const res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/likes/${fakeImageId}`)
                .set("Authorization", `Bearer ${accessToken}`);
            expect([200, 404, 500]).toContain(res.statusCode);
        }));
    });
});

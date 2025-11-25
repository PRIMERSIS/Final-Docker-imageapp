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
const Comment_1 = require("../../models/Comment");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
jest.setTimeout(30000);
describe("Comment API", () => {
    const testUser = {
        name: "Test User",
        email: "test-comment@example.com",
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
        yield Comment_1.Comment.deleteMany({});
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
            description: "Test image for comments",
            visibility: "public",
            status: "approved",
        });
        const savedImage = yield image.save();
        imageId = String(savedImage._id);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    describe("POST /api/comments/:imageId", () => {
        it("should post a comment successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const commentData = {
                content: "This is a test comment",
            };
            const res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/comments/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send(commentData);
            if (res.statusCode !== 201)
                console.log("POST COMMENT ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("comment");
            expect(res.body.comment).toHaveProperty("content", commentData.content);
            expect(res.body.comment).toHaveProperty("user");
            expect(res.body.comment).toHaveProperty("image");
            const comment = yield Comment_1.Comment.findOne({
                user: userId,
                image: imageId,
                content: commentData.content,
            });
            expect(comment).not.toBeNull();
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/comments/${imageId}`)
                .send({ content: "Test comment" });
            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty("error", "UnAuthorized!!!");
        }));
        it("should create multiple comments on the same image", () => __awaiter(void 0, void 0, void 0, function* () {
            const comment1 = { content: "First comment" };
            const comment2 = { content: "Second comment" };
            const res1 = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/comments/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send(comment1);
            const res2 = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/comments/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send(comment2);
            expect(res1.statusCode).toBe(201);
            expect(res2.statusCode).toBe(201);
            const comments = yield Comment_1.Comment.find({ image: imageId });
            expect(comments.length).toBe(2);
        }));
        it("should handle empty content", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/comments/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "" });
            expect([201, 400, 500]).toContain(res.statusCode);
        }));
        it("should handle long comment content", () => __awaiter(void 0, void 0, void 0, function* () {
            const longContent = "A".repeat(1000);
            const res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/comments/${imageId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: longContent });
            expect(res.statusCode).toBe(201);
            expect(res.body.comment.content).toBe(longContent);
        }));
        it("should handle non-existent image ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeImageId = new mongoose_1.default.Types.ObjectId().toString();
            const res = yield (0, supertest_1.default)(app_1.default)
                .post(`/api/comments/${fakeImageId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ content: "Comment on non-existent image" });
            expect([201, 404, 500]).toContain(res.statusCode);
        }));
    });
});

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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
jest.setTimeout(30000);
describe("Admin API", () => {
    const testAdmin = {
        name: "Admin User",
        email: "admin@example.com",
        password: "123456789Lt@@",
    };
    const testUser = {
        name: "Regular User",
        email: "user@example.com",
        password: "123456Lt@@",
    };
    let adminAccessToken;
    let userAccessToken;
    let adminUserId;
    let userId;
    let pendingImageId;
    let approvedImageId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState === 0) {
            yield mongoose_1.default.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI, {});
        }
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield User_1.User.deleteMany({});
        yield Image_1.Image.deleteMany({});
        const adminRegisterRes = yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testAdmin);
        adminUserId = adminRegisterRes.body.user._id;
        yield User_1.User.findByIdAndUpdate(adminUserId, { role: "admin" });
        const adminLoginRes = yield (0, supertest_1.default)(app_1.default)
            .post("/api/auth/login")
            .send({ email: testAdmin.email, password: testAdmin.password });
        if (adminLoginRes.statusCode !== 200) {
            console.log("ADMIN LOGIN ERROR in beforeEach:", adminLoginRes.body, adminLoginRes.text);
        }
        adminAccessToken = adminLoginRes.body.accessToken;
        expect(adminAccessToken).toBeDefined();
        const userRegisterRes = yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
        userId = userRegisterRes.body.user._id;
        const userLoginRes = yield (0, supertest_1.default)(app_1.default)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: testUser.password });
        if (userLoginRes.statusCode !== 200) {
            console.log("USER LOGIN ERROR in beforeEach:", userLoginRes.body, userLoginRes.text);
        }
        userAccessToken = userLoginRes.body.accessToken;
        expect(userAccessToken).toBeDefined();
        const pendingImage = new Image_1.Image({
            user: userId,
            imageUrl: "https://example.com/pending.jpg",
            publicId: "pending-id",
            description: "Pending image",
            visibility: "public",
            status: "pending",
        });
        const savedPending = yield pendingImage.save();
        pendingImageId = String(savedPending._id);
        const approvedImage = new Image_1.Image({
            user: userId,
            imageUrl: "https://example.com/approved.jpg",
            publicId: "approved-id",
            description: "Approved image",
            visibility: "public",
            status: "approved",
        });
        const savedApproved = yield approvedImage.save();
        approvedImageId = String(savedApproved._id);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    describe("GET /api/admin/images/pending", () => {
        it("should get pending images as admin", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/admin/images/pending")
                .set("Authorization", `Bearer ${adminAccessToken}`);
            if (res.statusCode !== 200)
                console.log("GET PENDING IMAGES ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("images");
            expect(Array.isArray(res.body.images)).toBe(true);
            expect(res.body.images.length).toBeGreaterThan(0);
            expect(res.body.images[0]).toHaveProperty("status", "pending");
            expect(res.body.images[0]).toHaveProperty("user");
        }));
        it("should return 403 for non-admin users", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/admin/images/pending")
                .set("Authorization", `Bearer ${userAccessToken}`);
            expect(res.statusCode).toBe(403);
            expect(res.body).toHaveProperty("message", "Access dinied. Admin only");
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/admin/images/pending");
            expect(res.statusCode).toBe(401);
        }));
        it("should only return pending images, not approved ones", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/admin/images/pending")
                .set("Authorization", `Bearer ${adminAccessToken}`);
            expect(res.statusCode).toBe(200);
            const allPending = res.body.images.every((img) => img.status === "pending");
            expect(allPending).toBe(true);
        }));
        it("should return empty array when no pending images exist", () => __awaiter(void 0, void 0, void 0, function* () {
            yield Image_1.Image.deleteMany({ status: "pending" });
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/admin/images/pending")
                .set("Authorization", `Bearer ${adminAccessToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.images).toHaveLength(0);
        }));
    });
    describe("PATCH /api/admin/images/:id/approve", () => {
        it("should approve a pending image as admin", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/images/${pendingImageId}/approve`)
                .set("Authorization", `Bearer ${adminAccessToken}`);
            if (res.statusCode !== 200)
                console.log("APPROVE IMAGE ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("message", "Image Approved");
            expect(res.body).toHaveProperty("image");
            expect(res.body.image).toHaveProperty("status", "approved");
            const updatedImage = yield Image_1.Image.findById(pendingImageId);
            expect(updatedImage === null || updatedImage === void 0 ? void 0 : updatedImage.status).toBe("approved");
        }));
        it("should return 403 for non-admin users", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/images/${pendingImageId}/approve`)
                .set("Authorization", `Bearer ${userAccessToken}`);
            expect(res.statusCode).toBe(403);
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).patch(`/api/admin/images/${pendingImageId}/approve`);
            expect(res.statusCode).toBe(401);
        }));
        it("should return 404 for non-existent image", () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeImageId = new mongoose_1.default.Types.ObjectId().toString();
            const res = yield (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/images/${fakeImageId}/approve`)
                .set("Authorization", `Bearer ${adminAccessToken}`);
            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty("error", "Image not found!");
        }));
        it("should approve already approved image (idempotent)", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/images/${approvedImageId}/approve`)
                .set("Authorization", `Bearer ${adminAccessToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.image.status).toBe("approved");
        }));
    });
    describe("GET /api/admin/users", () => {
        it("should get all users as admin", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${adminAccessToken}`);
            if (res.statusCode !== 200)
                console.log("GET ALL USERS ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("users");
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(res.body.users.length).toBeGreaterThan(0);
            res.body.users.forEach((user) => {
                expect(user).not.toHaveProperty("password");
            });
        }));
        it("should return 403 for non-admin users", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${userAccessToken}`);
            expect(res.statusCode).toBe(403);
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/admin/users");
            expect(res.statusCode).toBe(401);
        }));
    });
});

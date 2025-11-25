"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv_1.default.config();
jest.setTimeout(30000);
describe("Image API", () => {
    const testUser = {
        name: "Test User",
        email: "test-image@example.com",
        password: "1234563367",
    };
    let accessToken;
    let userId;
    let sampleImagePath;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState === 0) {
            yield mongoose_1.default.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI, {});
        }
        sampleImagePath = path.join(__dirname, "../sample.jpg");
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield User_1.User.deleteMany({ email: testUser.email });
        yield Image_1.Image.deleteMany({});
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
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    describe("POST /api/images/upload", () => {
        it("should upload image successfully with valid file and data", () => __awaiter(void 0, void 0, void 0, function* () {
            let imageBuffer;
            if (fs.existsSync(sampleImagePath)) {
                imageBuffer = fs.readFileSync(sampleImagePath);
            }
            else {
                imageBuffer = Buffer.from("/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A", "base64");
            }
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/images/upload")
                .set("Authorization", `Bearer ${accessToken}`)
                .field("description", "Test image description")
                .field("visibility", "public")
                .attach("image", imageBuffer, "test.jpg");
            if (res.statusCode !== 201)
                console.log("UPLOAD IMAGE ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("message", "image uploaded. Awaiting admin approval!");
            expect(res.body).toHaveProperty("image");
            expect(res.body.image).toHaveProperty("imageUrl");
            expect(res.body.image).toHaveProperty("publicId");
            expect(res.body.image).toHaveProperty("status", "pending");
            expect(res.body.image).toHaveProperty("visibility", "public");
        }));
        it("should return 400 when image file is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/images/upload")
                .set("Authorization", `Bearer ${accessToken}`)
                .field("description", "Test description");
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty("error", "Missing image file");
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            let imageBuffer;
            if (fs.existsSync(sampleImagePath)) {
                imageBuffer = fs.readFileSync(sampleImagePath);
            }
            else {
                imageBuffer = Buffer.from("/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A", "base64");
            }
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/images/upload")
                .attach("image", imageBuffer, "test.jpg");
            expect(res.statusCode).toBe(401);
        }));
        it("should upload image with private visibility", () => __awaiter(void 0, void 0, void 0, function* () {
            let imageBuffer;
            if (fs.existsSync(sampleImagePath)) {
                imageBuffer = fs.readFileSync(sampleImagePath);
            }
            else {
                imageBuffer = Buffer.from("/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A", "base64");
            }
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/images/upload")
                .set("Authorization", `Bearer ${accessToken}`)
                .field("description", "Private image")
                .field("visibility", "private")
                .attach("image", imageBuffer, "test.jpg");
            expect(res.statusCode).toBe(201);
            expect(res.body.image).toHaveProperty("visibility", "private");
        }));
    });
    describe("GET /api/images/public", () => {
        it("should get empty array when no approved public images exist", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/images/public");
            if (res.statusCode !== 200)
                console.log("GET PUBLIC IMAGES ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("images");
            expect(Array.isArray(res.body.images)).toBe(true);
            expect(res.body.images.length).toBe(0);
        }));
        it("should get approved public images", () => __awaiter(void 0, void 0, void 0, function* () {
            const image = new Image_1.Image({
                user: userId,
                imageUrl: "https://example.com/image.jpg",
                publicId: "test-public-id",
                description: "Test public image",
                visibility: "public",
                status: "approved",
            });
            yield image.save();
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/images/public");
            expect(res.statusCode).toBe(200);
            expect(res.body.images).toHaveLength(1);
            expect(res.body.images[0]).toHaveProperty("status", "approved");
            expect(res.body.images[0]).toHaveProperty("visibility", "public");
            expect(res.body.images[0]).toHaveProperty("user");
        }));
        it("should not return pending images", () => __awaiter(void 0, void 0, void 0, function* () {
            const pendingImage = new Image_1.Image({
                user: userId,
                imageUrl: "https://example.com/pending.jpg",
                publicId: "test-pending-id",
                description: "Pending image",
                visibility: "public",
                status: "pending",
            });
            yield pendingImage.save();
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/images/public");
            expect(res.statusCode).toBe(200);
            expect(res.body.images).toHaveLength(0);
        }));
        it("should not return private images even if approved", () => __awaiter(void 0, void 0, void 0, function* () {
            yield Image_1.Image.deleteMany({});
            const privateImage = new Image_1.Image({
                user: userId,
                imageUrl: "https://example.com/private.jpg",
                publicId: "test-private-id",
                description: "Private image",
                visibility: "private",
                status: "approved",
            });
            yield privateImage.save();
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/images/public");
            expect(res.statusCode).toBe(200);
            expect(res.body.images).toHaveLength(0);
        }));
        it("should return images sorted by createdAt descending", () => __awaiter(void 0, void 0, void 0, function* () {
            const image1 = new Image_1.Image({
                user: userId,
                imageUrl: "https://example.com/image1.jpg",
                publicId: "test-id-1",
                description: "First image",
                visibility: "public",
                status: "approved",
                createdAt: new Date("2024-01-01"),
            });
            yield image1.save();
            const image2 = new Image_1.Image({
                user: userId,
                imageUrl: "https://example.com/image2.jpg",
                publicId: "test-id-2",
                description: "Second image",
                visibility: "public",
                status: "approved",
                createdAt: new Date("2024-01-02"),
            });
            yield image2.save();
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/images/public");
            expect(res.statusCode).toBe(200);
            expect(res.body.images).toHaveLength(2);
            expect(res.body.images[0].description).toBe("Second image");
            expect(res.body.images[1].description).toBe("First image");
        }));
    });
});

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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
jest.setTimeout(30000);
describe("Auth API - Refresh Token & Logout", () => {
    const testUser = {
        name: "Test User",
        email: "test-refresh@example.com",
        password: "123456",
    };
    let refreshToken;
    let accessToken;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState === 0) {
            yield mongoose_1.default.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI, {});
        }
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield User_1.User.deleteMany({ email: testUser.email });
        yield (0, supertest_1.default)(app_1.default).post("/api/auth/register").send(testUser);
        const loginRes = yield (0, supertest_1.default)(app_1.default)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: testUser.password });
        if (loginRes.statusCode !== 200) {
            console.log("LOGIN ERROR in beforeEach:", loginRes.body, loginRes.text);
        }
        accessToken = loginRes.body.accessToken;
        refreshToken = loginRes.body.refreshToken;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    describe("POST /api/auth/refresh", () => {
        it("should refresh access token with valid refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/refresh")
                .send({ refreshToken });
            if (res.statusCode !== 200)
                console.log("REFRESH ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("accessToken");
            expect(res.body.accessToken).toBeDefined();
            expect(typeof res.body.accessToken).toBe("string");
        }));
        it("should return 400 when refresh token is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).post("/api/auth/refresh").send({});
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty("message", "Missing refresh token");
        }));
        it("should return error with invalid refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/refresh")
                .send({ refreshToken: "invalid-token" });
            expect(res.statusCode).toBe(500);
        }));
    });
    describe("POST /api/auth/logout", () => {
        it("should logout successfully with valid refresh token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/logout")
                .send({ refreshToken });
            if (res.statusCode !== 200)
                console.log("LOGOUT ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("message", "Logged Out Success!");
        }));
        it("should return 400 when refresh token is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).post("/api/auth/logout").send({});
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty("message", "Missing refresh token");
        }));
        it("should clear refresh token from user after logout", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app_1.default)
                .post("/api/auth/logout")
                .send({ refreshToken });
            const user = yield User_1.User.findOne({ email: testUser.email });
            expect(user === null || user === void 0 ? void 0 : user.refreshToken).toBeFalsy();
        }));
    });
});

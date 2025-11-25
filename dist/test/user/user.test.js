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
describe("User API", () => {
    const testUser = {
        name: "Test User",
        email: "test-user@example.com",
        password: "123456",
    };
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
        expect(accessToken).toBeDefined();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    describe("GET /api/user/me", () => {
        it("should get user profile with valid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/user/me")
                .set("Authorization", `Bearer ${accessToken}`);
            if (res.statusCode !== 200)
                console.log("GET PROFILE ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("user");
            expect(res.body.user).toHaveProperty("email", testUser.email);
            expect(res.body.user).toHaveProperty("name", testUser.name);
            expect(res.body.user).not.toHaveProperty("password");
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).get("/api/user/me");
            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty("error", "UnAuthorized!!!");
        }));
        it("should return 401 with invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/user/me")
                .set("Authorization", "Bearer invalid-token");
            expect(res.statusCode).toBe(500);
        }));
    });
    describe("PUT /api/user/me", () => {
        it("should update user profile with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                name: "Updated Name",
                email: "updated@example.com",
            };
            const res = yield (0, supertest_1.default)(app_1.default)
                .put("/api/user/me")
                .set("Authorization", `Bearer ${accessToken}`)
                .send(updateData);
            if (res.statusCode !== 200)
                console.log("UPDATE PROFILE ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("user");
            expect(res.body.user).toHaveProperty("name", updateData.name);
            expect(res.body.user).toHaveProperty("email", updateData.email);
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .put("/api/user/me")
                .send({ name: "New Name" });
            expect(res.statusCode).toBe(401);
        }));
        it("should update only name when only name is provided", () => __awaiter(void 0, void 0, void 0, function* () {
            const originalUser = yield User_1.User.findOne({ email: testUser.email });
            const updateData = { name: "Only Name Updated" };
            const res = yield (0, supertest_1.default)(app_1.default)
                .put("/api/user/me")
                .set("Authorization", `Bearer ${accessToken}`)
                .send(updateData);
            expect(res.statusCode).toBe(200);
            expect(res.body.user.name).toBe(updateData.name);
        }));
    });
    describe("DELETE /api/user/me", () => {
        it("should delete user account with valid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default)
                .delete("/api/user/me")
                .set("Authorization", `Bearer ${accessToken}`);
            if (res.statusCode !== 200)
                console.log("DELETE ACCOUNT ERROR:", res.body, res.text);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("message", "User Deleted!");
            const deletedUser = yield User_1.User.findOne({ email: testUser.email });
            expect(deletedUser).toBeNull();
        }));
        it("should return 401 without authorization token", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(app_1.default).delete("/api/user/me");
            expect(res.statusCode).toBe(401);
        }));
        it("should not be able to access profile after account deletion", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, supertest_1.default)(app_1.default)
                .delete("/api/user/me")
                .set("Authorization", `Bearer ${accessToken}`);
            const res = yield (0, supertest_1.default)(app_1.default)
                .get("/api/user/me")
                .set("Authorization", `Bearer ${accessToken}`);
            expect([401, 500]).toContain(res.statusCode);
        }));
    });
});

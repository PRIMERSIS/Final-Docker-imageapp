import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(30000);

describe("Auth API - Refresh Token & Logout", () => {
  const testUser = {
    name: "Test User",
    email: "test-refresh@example.com",
    password: "123456",
  };

  let refreshToken: string;
  let accessToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI!, {});
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });
    // Register and login to get tokens
    await request(app).post("/api/auth/register").send(testUser);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    
    if (loginRes.statusCode !== 200) {
      console.log("LOGIN ERROR in beforeEach:", loginRes.body, loginRes.text);
    }
    
    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;
    
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh access token with valid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      if (res.statusCode !== 200)
        console.log("REFRESH ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe("string");
    });

    it("should return 400 when refresh token is missing", async () => {
      const res = await request(app).post("/api/auth/refresh").send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "Missing refresh token");
    });

    it("should return error with invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(res.statusCode).toBe(500);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully with valid refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .send({ refreshToken });

      if (res.statusCode !== 200)
        console.log("LOGOUT ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Logged Out Success!");
    });

    it("should return 400 when refresh token is missing", async () => {
      const res = await request(app).post("/api/auth/logout").send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "Missing refresh token");
    });

    it("should clear refresh token from user after logout", async () => {
      await request(app)
        .post("/api/auth/logout")
        .send({ refreshToken });

      const user = await User.findOne({ email: testUser.email });
      expect(user?.refreshToken).toBeFalsy();
    });
  });
});


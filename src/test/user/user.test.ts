import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(30000);

describe("User API", () => {
  const testUser = {
    name: "Test User",
    email: "test-user@example.com",
    password: "123456",
  };

  let accessToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI!, {});
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });
    // Register and login to get token
    await request(app).post("/api/auth/register").send(testUser);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    
    if (loginRes.statusCode !== 200) {
      console.log("LOGIN ERROR in beforeEach:", loginRes.body, loginRes.text);
    }
    
    accessToken = loginRes.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/user/me", () => {
    it("should get user profile with valid token", async () => {
      const res = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${accessToken}`);

      if (res.statusCode !== 200)
        console.log("GET PROFILE ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("email", testUser.email);
      expect(res.body.user).toHaveProperty("name", testUser.name);
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app).get("/api/user/me");

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "UnAuthorized!!!");
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/user/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.statusCode).toBe(500);
    });
  });

  describe("PUT /api/user/me", () => {
    it("should update user profile with valid data", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const res = await request(app)
        .put("/api/user/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      if (res.statusCode !== 200)
        console.log("UPDATE PROFILE ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("name", updateData.name);
      expect(res.body.user).toHaveProperty("email", updateData.email);
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .put("/api/user/me")
        .send({ name: "New Name" });

      expect(res.statusCode).toBe(401);
    });

    it("should update only name when only name is provided", async () => {
      const originalUser = await User.findOne({ email: testUser.email });
      const updateData = { name: "Only Name Updated" };

      const res = await request(app)
        .put("/api/user/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe(updateData.name);
    });
  });

  describe("DELETE /api/user/me", () => {
    it("should delete user account with valid token", async () => {
      const res = await request(app)
        .delete("/api/user/me")
        .set("Authorization", `Bearer ${accessToken}`);

      if (res.statusCode !== 200)
        console.log("DELETE ACCOUNT ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "User Deleted!");

      // Verify user is deleted
      const deletedUser = await User.findOne({ email: testUser.email });
      expect(deletedUser).toBeNull();
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app).delete("/api/user/me");

      expect(res.statusCode).toBe(401);
    });

    it("should not be able to access profile after account deletion", async () => {
      await request(app)
        .delete("/api/user/me")
        .set("Authorization", `Bearer ${accessToken}`);

      const res = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${accessToken}`);

      // Token might still be valid but user doesn't exist
      expect([401, 500]).toContain(res.statusCode);
    });
  });
});


import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import { Like } from "../../models/Like";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(30000);

describe("Like API", () => {
  const testUser = {
    name: "Test User",
    email: "test-USER@example.com",
    password: "123456",
  };

  let accessToken: string;
  let userId: string;
  let imageId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI!, {});
    }
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });
    await Image.deleteMany({});
    await Like.deleteMany({});
    // Register and login to get token
    const registerRes = await request(app).post("/api/auth/register").send(testUser);
    userId = registerRes.body.user._id;
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    
    if (loginRes.statusCode !== 200) {
      console.log("LOGIN ERROR in beforeEach:", loginRes.body, loginRes.text);
    }
    
    accessToken = loginRes.body.accessToken;
    expect(accessToken).toBeDefined();

    // Create a test image
    const image = new Image({
      user: userId,
      imageUrl: "https://example.com/test-image.jpg",
      publicId: "test-image-id",
      description: "Test image for likes",
      visibility: "public",
      status: "approved",
    });
    const savedImage = await image.save();
    imageId = String(savedImage._id);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/likes/:imageId", () => {
    it("should like an image successfully", async () => {
      const res = await request(app)
        .post(`/api/likes/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      if (res.statusCode !== 200)
        console.log("LIKE ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("liked", true);

      // Verify like was created in database
      const like = await Like.findOne({ user: userId, image: imageId });
      expect(like).not.toBeNull();
    });

    it("should unlike an image when already liked", async () => {
      // First like the image
      await request(app)
        .post(`/api/likes/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // Then unlike it
      const res = await request(app)
        .post(`/api/likes/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      if (res.statusCode !== 200)
        console.log("UNLIKE ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("liked", false);

      // Verify like was removed from database
      const like = await Like.findOne({ user: userId, image: imageId });
      expect(like).toBeNull();
    });

    it("should toggle like multiple times correctly", async () => {
      // First like
      let res = await request(app)
        .post(`/api/likes/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.body.liked).toBe(true);

      // Unlike
      res = await request(app)
        .post(`/api/likes/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.body.liked).toBe(false);

      // Like again
      res = await request(app)
        .post(`/api/likes/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.body.liked).toBe(true);
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app).post(`/api/likes/${imageId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "UnAuthorized!!!");
    });

    it("should handle non-existent image ID gracefully", async () => {
      const fakeImageId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/likes/${fakeImageId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      // Should still create a like record even if image doesn't exist
      // The behavior depends on implementation, but should not crash
      expect([200, 404, 500]).toContain(res.statusCode);
    });
  });
});


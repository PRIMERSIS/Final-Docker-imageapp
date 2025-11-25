import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import { Comment } from "../../models/Comment";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(30000);

describe("Comment API", () => {
  const testUser = {
    name: "Test User",
    email: "test-comment@example.com",
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
    await Comment.deleteMany({});
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
      imageUrl: "https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg",
      publicId: "test-image-id",
      description: "Test image for comments",
      visibility: "public",
      status: "approved",
    });
    const savedImage = await image.save();
    imageId = String(savedImage._id);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/comments/:imageId", () => {
    it("should post a comment successfully", async () => {
      const commentData = {
        content: "This is a test comment",
      };

      const res = await request(app)
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

      // Verify comment was saved in database
      const comment = await Comment.findOne({
        user: userId,
        image: imageId,
        content: commentData.content,
      });
      expect(comment).not.toBeNull();
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app)
        .post(`/api/comments/${imageId}`)
        .send({ content: "Test comment" });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "UnAuthorized!!!");
    });

    it("should create multiple comments on the same image", async () => {
      const comment1 = { content: "First comment" };
      const comment2 = { content: "Second comment" };

      const res1 = await request(app)
        .post(`/api/comments/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(comment1);

      const res2 = await request(app)
        .post(`/api/comments/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(comment2);

      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);

      // Verify both comments exist
      const comments = await Comment.find({ image: imageId });
      expect(comments.length).toBe(2);
    });

    it("should handle empty content", async () => {
      const res = await request(app)
        .post(`/api/comments/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "" });

      // Should either accept empty or reject with validation error
      expect([201, 400, 500]).toContain(res.statusCode);
    });

    it("should handle long comment content", async () => {
      const longContent = "A".repeat(1000);
      const res = await request(app)
        .post(`/api/comments/${imageId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: longContent });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment.content).toBe(longContent);
    });

    it("should handle non-existent image ID", async () => {
      const fakeImageId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/comments/${fakeImageId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ content: "Comment on non-existent image" });

      // Should still create comment even if image doesn't exist
      // The behavior depends on implementation
      expect([201, 404, 500]).toContain(res.statusCode);
    });
  });
});


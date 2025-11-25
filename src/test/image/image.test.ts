import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config();

jest.setTimeout(30000);

describe("Image API", () => {
  const testUser = {
    name: "Test User",
    email: "test-image@example.com",
    password: "1234563367",
  };

  let accessToken: string;
  let userId: string;
  let sampleImagePath: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI!, {});
    }
    // Get sample image path
    sampleImagePath = path.join(__dirname, "../sample.jpg");
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });
    await Image.deleteMany({});
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
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/images/upload", () => {
    it("should upload image successfully with valid file and data", async () => {
      // Check if sample image exists, if not create a dummy buffer
      let imageBuffer: Buffer;
      if (fs.existsSync(sampleImagePath)) {
        imageBuffer = fs.readFileSync(sampleImagePath);
      } else {
        // Create a minimal valid JPEG buffer
        imageBuffer = Buffer.from(
          "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A",
          "base64"
        );
      }

      const res = await request(app)
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
    });

    it("should return 400 when image file is missing", async () => {
      const res = await request(app)
        .post("/api/images/upload")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("description", "Test description");

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "Missing image file");
    });

    it("should return 401 without authorization token", async () => {
      let imageBuffer: Buffer;
      if (fs.existsSync(sampleImagePath)) {
        imageBuffer = fs.readFileSync(sampleImagePath);
      } else {
        imageBuffer = Buffer.from(
          "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A",
          "base64"
        );
      }

      const res = await request(app)
        .post("/api/images/upload")
        .attach("image", imageBuffer, "test.jpg");

      expect(res.statusCode).toBe(401);
    });

    it("should upload image with private visibility", async () => {
      let imageBuffer: Buffer;
      if (fs.existsSync(sampleImagePath)) {
        imageBuffer = fs.readFileSync(sampleImagePath);
      } else {
        imageBuffer = Buffer.from(
          "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A",
          "base64"
        );
      }

      const res = await request(app)
        .post("/api/images/upload")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("description", "Private image")
        .field("visibility", "private")
        .attach("image", imageBuffer, "test.jpg");

      expect(res.statusCode).toBe(201);
      expect(res.body.image).toHaveProperty("visibility", "private");
    });
  });

  describe("GET /api/images/public", () => {
    it("should get empty array when no approved public images exist", async () => {
      const res = await request(app).get("/api/images/public");

      if (res.statusCode !== 200)
        console.log("GET PUBLIC IMAGES ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("images");
      expect(Array.isArray(res.body.images)).toBe(true);
      expect(res.body.images.length).toBe(0);
    });

    it("should get approved public images", async () => {
      // Create an approved public image
      const image = new Image({
        user: userId,
        imageUrl: "https://example.com/image.jpg",
        publicId: "test-public-id",
        description: "Test public image",
        visibility: "public",
        status: "approved",
      });
      await image.save();

      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body.images).toHaveLength(1);
      expect(res.body.images[0]).toHaveProperty("status", "approved");
      expect(res.body.images[0]).toHaveProperty("visibility", "public");
      expect(res.body.images[0]).toHaveProperty("user");
    });

    it("should not return pending images", async () => {
      // Create a pending image
      const pendingImage = new Image({
        user: userId,
        imageUrl: "https://example.com/pending.jpg",
        publicId: "test-pending-id",
        description: "Pending image",
        visibility: "public",
        status: "pending",
      });
      await pendingImage.save();

      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body.images).toHaveLength(0);
    });

    it("should not return private images even if approved", async () => {
      // Clean up any existing images first
      await Image.deleteMany({});
      
      // Create an approved private image
      const privateImage = new Image({
        user: userId,
        imageUrl: "https://example.com/private.jpg",
        publicId: "test-private-id",
        description: "Private image",
        visibility: "private",
        status: "approved",
      });
      await privateImage.save();

      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body.images).toHaveLength(0);
    });

    it("should return images sorted by createdAt descending", async () => {
      // Create multiple approved images
      const image1 = new Image({
        user: userId,
        imageUrl: "https://example.com/image1.jpg",
        publicId: "test-id-1",
        description: "First image",
        visibility: "public",
        status: "approved",
        createdAt: new Date("2024-01-01"),
      });
      await image1.save();

      const image2 = new Image({
        user: userId,
        imageUrl: "https://example.com/image2.jpg",
        publicId: "test-id-2",
        description: "Second image",
        visibility: "public",
        status: "approved",
        createdAt: new Date("2024-01-02"),
      });
      await image2.save();

      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body.images).toHaveLength(2);
      // Most recent should be first
      expect(res.body.images[0].description).toBe("Second image");
      expect(res.body.images[1].description).toBe("First image");
    });
  });
});


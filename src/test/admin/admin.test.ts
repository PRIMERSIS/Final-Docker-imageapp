import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import dotenv from "dotenv";
dotenv.config();

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

  let adminAccessToken: string;
  let userAccessToken: string;
  let adminUserId: string;
  let userId: string;
  let pendingImageId: string;
  let approvedImageId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_ATLAS_URI || process.env.MONGO_URI!, {});
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Image.deleteMany({});

    // Create admin user
    const adminRegisterRes = await request(app).post("/api/auth/register").send(testAdmin);
    adminUserId = adminRegisterRes.body.user._id;
    // Set admin role
    await User.findByIdAndUpdate(adminUserId, { role: "admin" });
    const adminLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testAdmin.email, password: testAdmin.password });
    
    if (adminLoginRes.statusCode !== 200) {
      console.log("ADMIN LOGIN ERROR in beforeEach:", adminLoginRes.body, adminLoginRes.text);
    }
    
    adminAccessToken = adminLoginRes.body.accessToken;
    expect(adminAccessToken).toBeDefined();

    // Create regular user
    const userRegisterRes = await request(app).post("/api/auth/register").send(testUser);
    userId = userRegisterRes.body.user._id;
    const userLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    
    if (userLoginRes.statusCode !== 200) {
      console.log("USER LOGIN ERROR in beforeEach:", userLoginRes.body, userLoginRes.text);
    }
    
    userAccessToken = userLoginRes.body.accessToken;
    expect(userAccessToken).toBeDefined();

    // Create pending image
    const pendingImage = new Image({
      user: userId,
      imageUrl: "https://example.com/pending.jpg",
      publicId: "pending-id",
      description: "Pending image",
      visibility: "public",
      status: "pending",
    });
    const savedPending = await pendingImage.save();
    pendingImageId = String(savedPending._id);

    // Create approved image
    const approvedImage = new Image({
      user: userId,
      imageUrl: "https://example.com/approved.jpg",
      publicId: "approved-id",
      description: "Approved image",
      visibility: "public",
      status: "approved",
    });
    const savedApproved = await approvedImage.save();
    approvedImageId = String(savedApproved._id);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/admin/images/pending", () => {
    it("should get pending images as admin", async () => {
      const res = await request(app)
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
    });

    it("should return 403 for non-admin users", async () => {
      const res = await request(app)
        .get("/api/admin/images/pending")
        .set("Authorization", `Bearer ${userAccessToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty("message", "Access dinied. Admin only");
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app).get("/api/admin/images/pending");

      expect(res.statusCode).toBe(401);
    });

    it("should only return pending images, not approved ones", async () => {
      const res = await request(app)
        .get("/api/admin/images/pending")
        .set("Authorization", `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toBe(200);
      const allPending = res.body.images.every(
        (img: any) => img.status === "pending"
      );
      expect(allPending).toBe(true);
    });

    it("should return empty array when no pending images exist", async () => {
      // Delete all pending images
      await Image.deleteMany({ status: "pending" });

      const res = await request(app)
        .get("/api/admin/images/pending")
        .set("Authorization", `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.images).toHaveLength(0);
    });
  });

  describe("PATCH /api/admin/images/:id/approve", () => {
    it("should approve a pending image as admin", async () => {
      const res = await request(app)
        .patch(`/api/admin/images/${pendingImageId}/approve`)
        .set("Authorization", `Bearer ${adminAccessToken}`);

      if (res.statusCode !== 200)
        console.log("APPROVE IMAGE ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Image Approved");
      expect(res.body).toHaveProperty("image");
      expect(res.body.image).toHaveProperty("status", "approved");

      // Verify image was updated in database
      const updatedImage = await Image.findById(pendingImageId);
      expect(updatedImage?.status).toBe("approved");
    });

    it("should return 403 for non-admin users", async () => {
      const res = await request(app)
        .patch(`/api/admin/images/${pendingImageId}/approve`)
        .set("Authorization", `Bearer ${userAccessToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app).patch(
        `/api/admin/images/${pendingImageId}/approve`
      );

      expect(res.statusCode).toBe(401);
    });

    it("should return 404 for non-existent image", async () => {
      const fakeImageId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/admin/images/${fakeImageId}/approve`)
        .set("Authorization", `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error", "Image not found!");
    });

    it("should approve already approved image (idempotent)", async () => {
      const res = await request(app)
        .patch(`/api/admin/images/${approvedImageId}/approve`)
        .set("Authorization", `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.image.status).toBe("approved");
    });
  });

  describe("GET /api/admin/users", () => {
    it("should get all users as admin", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminAccessToken}`);

      if (res.statusCode !== 200)
        console.log("GET ALL USERS ERROR:", res.body, res.text);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
      // Users should not have password field
      res.body.users.forEach((user: any) => {
        expect(user).not.toHaveProperty("password");
      });
    });

    it("should return 403 for non-admin users", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${userAccessToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should return 401 without authorization token", async () => {
      const res = await request(app).get("/api/admin/users");

      expect(res.statusCode).toBe(401);
    });
  });
});


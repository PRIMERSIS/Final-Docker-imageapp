import multer from "multer";

const storage = multer.memoryStorage();

export const cloudinaryUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5mb
  },
});

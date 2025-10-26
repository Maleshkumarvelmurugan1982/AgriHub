const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'my_project_uploads',
    format: async (req, file) => {
      const ext = file.mimetype.split("/")[1];
      if (["jpeg", "jpg", "png", "webp"].includes(ext)) return ext;
      throw new Error(`${ext} not allowed`);
    },
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
  res.json({
    success: true,
    message: 'Image uploaded successfully!',
    imageUrl: req.file.path, // Cloudinary URL
  });
});

module.exports = router;

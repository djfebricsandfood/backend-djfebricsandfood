const mongoose = require("mongoose");

const galleryImageSchema = new mongoose.Schema(
  {
    title: String,
    imageUrl: String,
  },
  { timestamps: true }
);

const GalleryImage = mongoose.model("GalleryImage", galleryImageSchema);

module.exports = GalleryImage; 

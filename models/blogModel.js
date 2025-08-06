const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true,
      
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String, 
    },
    isDeleted: {
      type: Boolean,
      default: false, 
    },
  },
  {
    timestamps: true, 
  }
);

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;

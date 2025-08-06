const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  heading: {
    type: String,
    required: true
  },
  subheading: {
    type: String,
    required: true
  },
  backgroundImage: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CarouselSection', sectionSchema);

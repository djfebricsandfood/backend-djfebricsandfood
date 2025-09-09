const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    number: {
      type: String, 
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    message: {
      type: String,
    }
  },
  { timestamps: true } 
);

module.exports = mongoose.model("Contact", contactSchema);

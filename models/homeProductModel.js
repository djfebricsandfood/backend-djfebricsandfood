const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const homeProductSchema =  new Schema(
  {
    image: {
      type: String, 
      required: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model("HomeProductModel", homeProductSchema);

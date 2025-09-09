const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], 
  category: {
  type: String,
},
  subProducts: [{
    name: { type: String, required: true },
    image: { type: String}, 
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDeleted : { type: Boolean, default: false },
});


 
module.exports = mongoose.model('Product', ProductSchema);

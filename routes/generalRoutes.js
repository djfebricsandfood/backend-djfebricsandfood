const express = require("express");
const { getAllProductsForUser, createContact, getProductById, getAllBlogs } = require("../controller/generalContoller");
const { uploadProductImages } = require("../functions/upload");
const router = express.Router();


  
router.get("/products/:category",  getAllProductsForUser)
router.post("/contact" , createContact)

router.get("/get-product-by-id/:id",  getProductById )
router.get("/blog" , getAllBlogs)

module.exports = router
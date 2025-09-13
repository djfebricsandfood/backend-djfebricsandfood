const express = require("express");
const { getAllProductsForUser, createContact, getProductById, getAllBlogs, getCategory, getAllHomeProducts } = require("../controller/generalContoller");
const { uploadProductImages } = require("../functions/upload");
const router = express.Router();


  
router.get("/products/:category",  getAllProductsForUser)
router.post("/contact" , createContact)

router.get("/get-product-by-id/:id",  getProductById )
router.get("/blog" , getAllBlogs)

router.get("/get-category" , getCategory)

router.get("/get-home-data" , getAllHomeProducts)

module.exports = router
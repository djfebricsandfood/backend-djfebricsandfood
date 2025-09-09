const express = require("express");
const { getAllProductsForUser, createContact } = require("../controller/generalContoller");
const { uploadProductImages } = require("../functions/upload");
const router = express.Router();


  
router.get("/products",  getAllProductsForUser)
router.post("/contact" , createContact)

module.exports = router
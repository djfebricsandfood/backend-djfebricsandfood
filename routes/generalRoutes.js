const express = require("express");
const { getAllProductsForUser } = require("../controller/generalContoller");
const router = express.Router();


  
router.get("/products",  getAllProductsForUser)

module.exports = router
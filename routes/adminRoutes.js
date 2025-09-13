const express = require("express");
const validateAdminToken = require("../middleware/adminValidateToken");
const { sendLoginOTP, validateOTP, resendOTP, logOut, testAdmin, createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, createBlogPost, getAllBlogPost, getBlogPostById, updateBlogPost, deleteSingleBLogPost, updateCrousel, deleteCrousel, createCarousel, getCarouselById, getAllCrousel , createGalleryImage, getAllContacts, createHomeProduct, updateHomeProduct, deleteHomeProduct, getAllHomeProducts, addCategory, getCategory } = require("../controller/adminController");
const { loginData } = require("../validation/validator");
const { handleMulterUpload } = require("../functions/upload");


const router = express.Router();

router.post("/send-login-otp", loginData, sendLoginOTP);

router.post("/validate-otp", validateOTP);

router.post("/resend-otp", resendOTP);

router.patch("/logout", validateAdminToken, logOut);

router.get("/dashboard", validateAdminToken, testAdmin);

router.post('/products', validateAdminToken , handleMulterUpload, createProduct);

router.get("/get-all-products" , validateAdminToken, getAllProducts);

router.get("/get-product-by-id/:id", validateAdminToken, getProductById);

router.patch("/update-product/:id", validateAdminToken,handleMulterUpload, updateProduct);

router.patch("/delete-product/:id", validateAdminToken, deleteProduct);

router.post("/create-blog-post", validateAdminToken, handleMulterUpload, createBlogPost);

router.get("/get-all-blog-post", validateAdminToken, getAllBlogPost);

router.get("/get-blog-post-by-id/:id", validateAdminToken, getBlogPostById);

router.patch("/update-blog-post/:id", validateAdminToken, handleMulterUpload, updateBlogPost);

router.patch("/delete-single-blog-post/:id", validateAdminToken, deleteSingleBLogPost);

router.patch("/update-crousel/:id", validateAdminToken, handleMulterUpload, updateCrousel);

router.patch("/delete-crousel/:id", validateAdminToken, deleteCrousel);

router.post("/create-carousel", validateAdminToken, handleMulterUpload, createCarousel);

router.get("/get-carousel-by-id/:id", validateAdminToken, getCarouselById);

router.get("/get-all-carousel", validateAdminToken, getAllCrousel);

router.post("/create-gallery" , validateAdminToken ,  handleMulterUpload , createGalleryImage )

router.get("/get-all-quries" , validateAdminToken , getAllContacts)


router.post("/create-home-product" , validateAdminToken , handleMulterUpload , createHomeProduct)

router.patch("/update-home-product/:id" , validateAdminToken , handleMulterUpload , updateHomeProduct)

router.patch("/delete-home-product/:id" , validateAdminToken , deleteHomeProduct)


router.get("/get-all-home-products" , validateAdminToken , getAllHomeProducts)

router.post("/add-category" , validateAdminToken , addCategory)


router.get("/get-all-category" , validateAdminToken , getCategory)



module.exports = router;
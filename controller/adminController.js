

const GalleryImage = require("../models/galleryModel")
const { deleteUploadedFile, getImageUrl} = require("../functions/upload")
const { validationResult } = require("express-validator");
const Admin = require("../models/adminModel");
const { generateRandomOTP } = require("../functions/common");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const { createLog } = require("../functions/common");
const APIErrorLog = createLog("API_error_log");
const { checkValidations } = require("../functions/checkValidation");
const { sendMail } = require("../functions/mailer");
const product = require("../models/product");
const path = require("path");
const Blog = require("../models/blogModel");
const { deleteImageFile, validateBlogData, validateCarouselData } = require("../functions/helperfn");
const CarouselSection = require("../models/carouselSection");


const sendLoginOTP = async (req, res) => {
  try {
    const errors = validationResult(req);

    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }

    const { email, password } = req.body;

    const admins = await Admin.findOne(
      { email: email.toLowerCase(), isDeleted: false, status: "active" },
      { email: 1, password: 1, roles: 1, firstName: 1 }
    );

    if (admins && admins.password === md5(password)) {
      const otp = await generateRandomOTP();

      const mailVaribles = {
        "%head%": "Admin Login OTP",
        "%email%": admins.email,
        "%msg%":
          "You requested a One-Time Password to log into your Admin account. Use the OTP below to proceed.",
        "%name%": admins.firstName,
        "%otp%": otp,
      };

      sendMail("admin-otp-verification", mailVaribles, admins.email);

      await Admin.updateOne(
        { _id: admins._id, isDeleted: false },
        { $set: { OTP: otp } }
      );

      return res.status(200).send({
        id: admins._id,
        message: "OTP sent Successfully",
      });
    }

    return res.status(400).send({ message: "Invalid Email/Password" });
  } catch (error) {
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const validateOTP = async (req, res) => {
  try {
    const { id, otp } = req.body;

    const admins = await Admin.findOne({
      _id: id,
      isDeleted: false,
      status: "active",
    }).lean(true);

    const adminField = {
      _id: id,
      roles: admins.roles,
      status: admins.status,
      password: admins.password,
    };

    if (admins && admins.OTP == otp) {
      const token = jwt.sign(
        { user: adminField },
        process.env.ACCESS_TOKEN_SECERT,
        { expiresIn: "30d" }
      );

      await Admin.updateOne(
        { _id: admins._id, isDeleted: false },
        {
          $unset: { OTP: "" },
          $push: { tokens: token },
        }
      );

      return res.status(200).send({
        token,
        message: "OTP Verified Successfully",
      });
    }

    return res.status(400).send({ message: "Invalid OTP" });
  } catch (error) {
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { id } = req.body;

    const admins = await Admin.findOne({
      _id: id,
      isDeleted: false,
    }).lean(true);

    if (admins) {
      const otp = await generateRandomOTP();

      //   const findEmail = await EmailType.findOne({
      //     emailType: "send-admin-login-otp",
      //   }).lean(true);

      //   const mailVaribles = {
      //     "%head%": findEmail.emailHead,
      //     "%email%": admins.email,
      //     "%msg%": findEmail.emailDesc,
      //     "%name%": admins.firstName,
      //     "%otp%": otp,
      //   };

      //   sendMail("sample-email", mailVaribles, admins.email);

      await Admin.updateOne(
        { _id: admins._id, isDeleted: false },
        { $set: { OTP: otp } }
      );

      return res.status(200).send({
        id: admins._id,
        message: "OTP sent Successfully",
      });
    }
  } catch (error) {
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const logOut = async (req, res) => {
  try {
    const { 1: token } = req.headers.authorization.split(" ");
    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECERT);

    await Admin.updateOne(
      { _id: decodeToken.user._id },
      { $pull: { tokens: token } }
    );
    return res.status(200).send({ message: "Logout successfully" });
  } catch (error) {
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const testAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      _id: req.user._id,
      isDeleted: false,
    }).lean(true);

    const fields = {
      _id: req.user._id,
      firstName: admin.firstName,
      middleName: admin.middleName,
      lastName: admin.lastName,
    };

    return res.status(200).send({
      admin: fields,
      message: `welcome ${admin?.firstName}`,
    });
  } catch (error) {
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};


const createProduct = async (req, res) => {
  try {
   
    
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }

    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required fields'
      });
    }

    let mainImages = [];
    if (req.files && req.files.images) {
      mainImages = req.files.images.map(file => {
        return path.join('uploads/products/main', file.filename).replace(/\\/g, '/');
      });
    }

    let subProducts = [];
    let subProductsData = [];

    if (req.body.subProducts) {
      try {
        subProductsData = typeof req.body.subProducts === 'string'
          ? JSON.parse(req.body.subProducts)
          : req.body.subProducts;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sub-products data format'
        });
      }
    }

    if (req.files && req.files.subProducts && subProductsData.length > 0) {
      const subProductImages = req.files.subProducts;
      

      if (subProductImages.length !== subProductsData.length) {
        return res.status(400).json({
          success: false,
          message: 'Number of sub-product images must match number of sub-products'
        });
      }

      subProducts = subProductsData.map((subProduct, index) => {
        if (!subProduct.name) {
          throw new Error(`Sub-product ${index + 1} name is required`);
        }

        return {
          name: subProduct.name,
          image: path.join('uploads/products/sub', subProductImages[index].filename).replace(/\\/g, '/'),
          createdAt: new Date()
        };
      });
    } else if (subProductsData.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sub-product images are required when sub-products are provided'
      });
    }

    const newProduct = new product({
      name: name.trim(),
      description: description.trim(),
      images: mainImages,
      subProducts: subProducts,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product: savedProduct,
        imageCount: mainImages.length,
        subProductCount: subProducts.length
      }
    });

  } catch (error) {
    console.error('Product creation error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while creating product'
    });
  }
};


const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const searchQuery = search
      ? {
          $and: [
            { isDeleted: { $ne: true } }, // ✅ Added isDeleted check
            {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
              ]
            }
          ]
        }
      : { isDeleted: { $ne: true } }; // ✅ Added isDeleted check for non-search queries
    
    const totalProducts = await product.countDocuments(searchQuery);
    
    const products = await product.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          productsPerPage: limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        }
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching products'
    });
  }
};



const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // ✅ Fixed: Use foundProduct variable and added isDeleted check
    const foundProduct = await product.findOne({ 
      _id: id, 
      isDeleted: { $ne: true } 
    }).lean();

    // ✅ Fixed: Check foundProduct instead of product
    if (!foundProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        product: foundProduct // ✅ Better naming for response
      }
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    
    // Optional: check for cast error
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching product'
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate product ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const existingProduct = await product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle file validation errors
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }

    const { name, description } = req.body;

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    // Update name if provided
    if (name) {
      updateData.name = name.trim();
    }

    // Update description if provided
    if (description) {
      updateData.description = description.trim();
    }

    // Handle main images update
    if (req.files && req.files.images && req.files.images.length > 0) {
      const mainImages = req.files.images.map(file => {
        return path.join('uploads/products/main', file.filename).replace(/\\/g, '/');
      });
      updateData.images = mainImages;
    }
    // If no new images uploaded, preserve existing images (don't update images field)

    // Handle sub-products update
    let subProductsData = [];
    if (req.body.subProducts) {
      try {
        subProductsData = typeof req.body.subProducts === 'string'
          ? JSON.parse(req.body.subProducts)
          : req.body.subProducts;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sub-products data format'
        });
      }

      let subProducts = [];

      // Check if new images are being uploaded
      const hasNewImages = req.files && req.files.subProducts && req.files.subProducts.length > 0;

      if (hasNewImages) {
        const subProductImages = req.files.subProducts;

        // Create a map of image indices to filenames for flexible assignment
        const imageMap = {};
        subProductImages.forEach((file, index) => {
          // Use the fieldname to determine which sub-product this image belongs to
          // Expected format: subProducts[0], subProducts[1], etc.
          const match = file.fieldname.match(/subProducts\[(\d+)\]/);
          if (match) {
            const subProductIndex = parseInt(match[1]);
            imageMap[subProductIndex] = file.filename;
          }
        });

        subProducts = subProductsData.map((subProduct, index) => {
          if (!subProduct.name) {
            throw new Error(`Sub-product ${index + 1} name is required`);
          }

          const existingSubProduct = existingProduct.subProducts && existingProduct.subProducts[index];
          let imageUrl = '';

          // Use new image if provided, otherwise keep existing image
          if (imageMap.hasOwnProperty(index)) {
            imageUrl = path.join('uploads/products/sub', imageMap[index]).replace(/\\/g, '/');
          } else if (subProduct.image) {
            // Use image from request body if provided
            imageUrl = subProduct.image;
          } else if (existingSubProduct && existingSubProduct.image) {
            // Keep existing image
            imageUrl = existingSubProduct.image;
          }

          return {
            name: subProduct.name,
            image: imageUrl,
            createdAt: subProduct.createdAt || (existingSubProduct ? existingSubProduct.createdAt : new Date())
          };
        });
      } else {
        // No new images uploaded, preserve existing images and update other fields
        subProducts = subProductsData.map((subProduct, index) => {
          if (!subProduct.name) {
            throw new Error(`Sub-product ${index + 1} name is required`);
          }

          const existingSubProduct = existingProduct.subProducts && existingProduct.subProducts[index];

          return {
            name: subProduct.name,
            image: subProduct.image || (existingSubProduct ? existingSubProduct.image : ''),
            createdAt: subProduct.createdAt || (existingSubProduct ? existingSubProduct.createdAt : new Date())
          };
        });
      }

      updateData.subProducts = subProducts;
    }

    // Update the product
    const updatedProduct = await product.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: updatedProduct,
        imageCount: updatedProduct.images ? updatedProduct.images.length : 0,
        subProductCount: updatedProduct.subProducts ? updatedProduct.subProducts.length : 0
      }
    });

  } catch (error) {
    console.error('Product update error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while updating product'
    });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Check if product exists and is not already deleted
    const existingProduct = await product.findOne({ 
      _id: id, 
      isDeleted: { $ne: true } 
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted'
      });
    }

    // Soft delete the product by setting isDeleted to true
    const deletedProduct = await product.findByIdAndUpdate(
      id,
      { 
        isDeleted: true,
        deletedAt: new Date() // Optional: track when it was deleted
      },
      { 
        new: true, // Return updated document
        lean: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {
        productId: id,
        deletedAt: deletedProduct.deletedAt
      }
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    // Handle cast error
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while deleting product'
    });
  }
};


const createBlogPost = async (req, res) => {
  try {
    const { heading, description } = req.body;
    
  
    const validationErrors = validateBlogData(heading, description);
    if (validationErrors.length > 0) {
      if (req.files && req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          deleteImageFile(file.path.replace('./public', ''));
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Handle file validation error from multer
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
    // Process uploaded image
    let imagePath = null;
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageFile = req.files.images[0]; // Take only the first image
      imagePath = imageFile.path.replace('./public', ''); // Remove public prefix for storing in DB
    }
    
    // Create new blog
    const newBlog = new Blog({
      heading: heading.trim(),
      description: description,
      image: imagePath
    });
    
    const savedBlog = await newBlog.save();
    
    res.status(201).json({
      success: true,
      data: savedBlog,
      message: 'Blog created successfully'
    });
    
  } catch (error) {
    console.error('Error creating blog:', error);
    
    // Clean up uploaded files if database save fails
    if (req.files && req.files.images && req.files.images.length > 0) {
      req.files.images.forEach(file => {
        deleteImageFile(file.path.replace('./public', ''));
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, description } = req.body;
    
    // Validate ObjectId format
    // if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid blog ID format'
    //   });
    // }
    
    // Validate required fields
    const validationErrors = validateBlogData(heading, description);
    if (validationErrors.length > 0) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          deleteImageFile(file.path.replace('./public', ''));
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
    const existingBlog = await Blog.findOne({ 
      _id: id, 
      isDeleted: false 
    });
    
    if (!existingBlog) {
      if (req.files && req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          deleteImageFile(file.path.replace('./public', ''));
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    const updateData = {
      heading: heading.trim(),
      description: description.trim()
    };
    
    let newImagePath = existingBlog.image; 
    
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageFile = req.files.images[0];
      newImagePath = imageFile.path.replace('./public', '');
      
      if (existingBlog.image) {
        deleteImageFile(existingBlog.image);
      }
    }
    
    updateData.image = newImagePath;
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).select('-isDeleted');
    
    res.status(200).json({
      success: true,
      data: updatedBlog,
      message: 'Blog updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating blog:', error);
    
    if (req.files && req.files.images && req.files.images.length > 0) {
      req.files.images.forEach(file => {
        deleteImageFile(file.path.replace('./public', ''));
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


const getBlogPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format'
      });
    }
    
    const blog = await Blog.findOne({ 
      _id: id, 
      isDeleted: false 
    }).select('-isDeleted');
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: blog,
      message: 'Blog retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


const getAllBlogPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;
    
    // Build search query
    const searchQuery = {
      isDeleted: false,
      ...(search && {
        $or: [
          { heading: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      })
    };
    
    // Get blogs with pagination
    const blogs = await Blog.find(searchQuery)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-isDeleted');
    
    // Get total count for pagination
    const totalBlogs = await Blog.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalBlogs / limit);
    
    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      message: 'Blogs retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const deleteSingleBLogPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID format'
      });
    }
    
    const blog = await Blog.findOne({ 
      _id: id, 
      isDeleted: false 
    });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Soft delete - set isDeleted to true
    await Blog.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


const getAllCrousel = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { heading: { $regex: search, $options: 'i' } },
        { subheading: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    // Get carousel sections with pagination
    const sections = await CarouselSection.find(searchQuery)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalSections = await CarouselSection.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalSections / limit);
    
    res.status(200).json({
      success: true,
      data: sections,
      pagination: {
        currentPage: page,
        totalPages,
        totalSections,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      message: 'Carousel sections retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching carousel sections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


const getCarouselById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid carousel section ID format'
      });
    }
    
    const section = await CarouselSection.findById(id);
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Carousel section not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: section,
      message: 'Carousel section retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching carousel section:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

const createCarousel = async (req, res) => {
  try {
    const { name, heading, subheading } = req.body;
    

    const validationErrors = validateCarouselData(name, heading, subheading);
    if (validationErrors.length > 0) {

      if (req.files && req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          deleteImageFile(file.path.replace('./public', ''));
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Background image is required'
      });
    }

    const backgroundImageFile = req.files.images[0]; 
    const backgroundImagePath = backgroundImageFile.path.replace('./public', ''); 
    
    const newSection = new CarouselSection({
      name: name.trim(),
      heading: heading.trim(),
      subheading: subheading.trim(),
      backgroundImage: backgroundImagePath
    });
    
    const savedSection = await newSection.save();
    
    res.status(201).json({
      success: true,
      data: savedSection,
      message: 'Carousel section created successfully'
    });
    
  } catch (error) {
    console.error('Error creating carousel section:', error);
    
    if (req.files && req.files.images && req.files.images.length > 0) {
      req.files.images.forEach(file => {
        deleteImageFile(file.path.replace('./public', ''));
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


const updateCrousel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, heading, subheading } = req.body;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid carousel section ID format'
      });
    }
    
    const validationErrors = validateCarouselData(name, heading, subheading);
    if (validationErrors.length > 0) {
      if (req.files && req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          deleteImageFile(file.path.replace('./public', ''));
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    
  
    const existingSection = await CarouselSection.findById(id);
    
    if (!existingSection) {
      if (req.files && req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          deleteImageFile(file.path.replace('./public', ''));
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Carousel section not found'
      });
    }
    
    const updateData = {
      name: name.trim(),
      heading: heading.trim(),
      subheading: subheading.trim()
    };
    
    let newBackgroundImagePath = existingSection.backgroundImage; 
    
    if (req.files && req.files.images && req.files.images.length > 0) {
      
      const backgroundImageFile = req.files.images[0];
      newBackgroundImagePath = backgroundImageFile.path.replace('./public', '');

      if (existingSection.backgroundImage) {
        deleteImageFile(existingSection.backgroundImage);
      }
    }
    
    updateData.backgroundImage = newBackgroundImagePath;

    const updatedSection = await CarouselSection.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: updatedSection,
      message: 'Carousel section updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating carousel section:', error);
    
 
    if (req.files && req.files.images && req.files.images.length > 0) {
      req.files.images.forEach(file => {
        deleteImageFile(file.path.replace('./public', ''));
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

const deleteCrousel =  async (req, res) => {
  try {
    const { id } = req.params;
    
  
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid carousel section ID format'
      });
    }
    
    const section = await CarouselSection.findById(id);
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Carousel section not found'
      });
    }
    
    if (section.backgroundImage) {
      deleteImageFile(section.backgroundImage);
    }
    
    await CarouselSection.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Carousel section deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting carousel section:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


const createGalleryImage = async (req, res) => {
  try {
    const { title } = req.body;
    
    // Check if files were uploaded
    if (!req.files || (!req.files.galleryImage && !req.files.galleryImage)) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded"
      });
    }

    const uploadedFiles = req.files.galleryImage || req.files.galleryImage || [];
    const imagesToSave = [];

    // Handle multiple images
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const imageUrl = getImageUrl(file.path);
      
      const galleryImage = new GalleryImage({
        title: title || `Gallery Image ${i + 1}`,
        imageUrl: imageUrl
      });

      imagesToSave.push(galleryImage);
    }

    // Save all images to database
    const savedImages = await GalleryImage.insertMany(imagesToSave);

    res.status(201).json({
      success: true,
      message: `${savedImages.length} gallery image(s) created successfully`,
      data: savedImages
    });

  } catch (error) {
    console.error('Error creating gallery image:', error);
    
    // Clean up uploaded files if database save fails
    if (req.files) {
      const uploadedFiles = req.files.galleryImages || req.files.images || [];
      uploadedFiles.forEach(file => {
        deleteUploadedFile(file.path);
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create gallery image",
      error: error.message
    });
  }
};

// Get all gallery images
 const getAllGalleryImages = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const galleryImages = await GalleryImage.find()
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalImages = await GalleryImage.countDocuments();
    const totalPages = Math.ceil(totalImages / limit);

    res.status(200).json({
      success: true,
      data: galleryImages,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalImages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery images",
      error: error.message
    });
  }
};

// Get single gallery image by ID
 const getGalleryImageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery image ID"
      });
    }

    const galleryImage = await GalleryImage.findById(id);

    if (!galleryImage) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found"
      });
    }

    res.status(200).json({
      success: true,
      data: galleryImage
    });

  } catch (error) {
    console.error('Error fetching gallery image:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery image",
      error: error.message
    });
  }
};

// Update gallery image
 const updateGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery image ID"
      });
    }

    const existingImage = await GalleryImage.findById(id);
    if (!existingImage) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found"
      });
    }

    const updateData = {};
    if (title !== undefined) {
      updateData.title = title;
    }

    // Handle image update if new image is uploaded
    if (req.files && (req.files.galleryImages || req.files.images)) {
      const uploadedFiles = req.files.galleryImages || req.files.images;
      if (uploadedFiles.length > 0) {
        const newImageUrl = getImageUrl(uploadedFiles[0].path);
        updateData.imageUrl = newImageUrl;

        // Delete old image file
        if (existingImage.imageUrl) {
          const oldImagePath = path.join('./public', existingImage.imageUrl);
          deleteUploadedFile(oldImagePath);
        }
      }
    }

    const updatedImage = await GalleryImage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Gallery image updated successfully",
      data: updatedImage
    });

  } catch (error) {
    console.error('Error updating gallery image:', error);
    
    // Clean up uploaded file if update fails
    if (req.files) {
      const uploadedFiles = req.files.galleryImages || req.files.images || [];
      uploadedFiles.forEach(file => {
        deleteUploadedFile(file.path);
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update gallery image",
      error: error.message
    });
  }
};

// Delete gallery image
 const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery image ID"
      });
    }

    const galleryImage = await GalleryImage.findById(id);
    if (!galleryImage) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found"
      });
    }

    // Delete image file from filesystem
    if (galleryImage.imageUrl) {
      const imagePath = path.join('./public', galleryImage.imageUrl);
      deleteUploadedFile(imagePath);
    }

    // Delete from database
    await GalleryImage.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gallery image",
      error: error.message
    });
  }
};

// Delete multiple gallery images
 const deleteMultipleGalleryImages = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of image IDs"
      });
    }

    // Validate all IDs
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "One or more invalid image IDs provided"
      });
    }

    // Get all images to delete their files
    const imagesToDelete = await GalleryImage.find({ _id: { $in: validIds } });

    // Delete image files from filesystem
    imagesToDelete.forEach(image => {
      if (image.imageUrl) {
        const imagePath = path.join('./public', image.imageUrl);
        deleteUploadedFile(imagePath);
      }
    });

    // Delete from database
    const deleteResult = await GalleryImage.deleteMany({ _id: { $in: validIds } });

    res.status(200).json({
      success: true,
      message: `${deleteResult.deletedCount} gallery images deleted successfully`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('Error deleting multiple gallery images:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gallery images",
      error: error.message
    });
  }
};

// Search gallery images by title
 const searchGalleryImages = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

    const galleryImages = await GalleryImage.find({
      title: { $regex: searchRegex }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalImages = await GalleryImage.countDocuments({
      title: { $regex: searchRegex }
    });

    const totalPages = Math.ceil(totalImages / limit);

    res.status(200).json({
      success: true,
      data: galleryImages,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalImages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      searchQuery: query
    });

  } catch (error) {
    console.error('Error searching gallery images:', error);
    res.status(500).json({
      success: false,
      message: "Failed to search gallery images",
      error: error.message
    });
  }
};





module.exports = {
  sendLoginOTP,
  validateOTP,
  resendOTP,
  logOut,
  testAdmin,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createBlogPost,
  updateBlogPost,
  getBlogPostById,
  getAllBlogPost,
  deleteSingleBLogPost,
  updateCrousel,
  deleteCrousel,
  createCarousel,
  getCarouselById,
  getAllCrousel,
  createGalleryImage

};

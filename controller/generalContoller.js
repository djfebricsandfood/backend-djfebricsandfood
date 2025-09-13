const Blog = require("../models/blogModel");
const contactModel = require("../models/contactModel");
const product = require("../models/product");


const getAllProductsForUser = async (req, res) => {
  let category = req.params.category;
   
  
  
  try {
    const products = await product.aggregate([
      { $match: { category: category } },
      { $sort: { createdAt: -1 } },
      { 
        $project: { 
          _id: 1, 
          name: 1, 
          price: 1, 
          images: 1, 
          description: 1,
          subProducts:1,
          category: 1
        } 
      }
    ]);


    

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('Get all products (user) error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching products'
    });
  }
};


const createContact = async (req, res) => {
  try {
    
    const { name, email, number, city, country, message } = req.body;



   
    if (!name || !email || !number || !city || !country || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newContact = new contactModel({
      name: name.trim(),
      email: email.trim(),
      number: number.trim(),
      city: city.trim(),
      country: country.trim(),
      message: message.trim(),
    });

    const savedContact = await newContact.save();

    res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      data: savedContact,
    });
  } catch (error) {
    console.error("Request creation error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error while saving contact",
    });
  }
};



const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate id early to avoid unnecessary DB calls
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Use findById with lean() for faster, read-only query
    const productData = await product.findById(id, {
      _id: 1,
      name: 1,
      price: 1,
      images: 1,
      description: 1,
      subProducts: 1,
      category: 1,
      createdAt: 1
    }).lean();

    if (!productData) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    console.log('Get product by ID response:', productData);

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: productData,
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching product',
    });
  }
};




const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find(
      { isDeleted: false }, // ✅ skip deleted blogs
      {
        _id: 1,
        heading: 1,
        description: 1,
        image: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Blogs retrieved successfully",
      data: blogs,
    });
  } catch (error) {
    console.error("Get all blogs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error occurred while fetching blogs",
    });
  }
};





module.exports = {
  getAllProductsForUser,
  createContact,
  getProductById,
  getAllBlogs
};

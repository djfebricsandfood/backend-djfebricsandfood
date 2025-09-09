const contactModel = require("../models/contactModel");
const product = require("../models/product");


const getAllProductsForUser = async (req, res) => {
  try {
    const products = await product.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $sort: { createdAt: -1 } },
      { 
        $project: { 
          _id: 1, 
          name: 1, 
          price: 1, 
          images: 1, 
          description: 1,
          subProducts:1
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




module.exports = {
  getAllProductsForUser,
  createContact
};

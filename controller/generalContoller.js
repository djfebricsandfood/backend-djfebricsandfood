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


module.exports = {
  getAllProductsForUser
};

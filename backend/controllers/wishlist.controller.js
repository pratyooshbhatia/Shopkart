const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

// POST /wishlist/:productId  — Add a product to the authenticated user's wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Ensure the product actually exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // req.user is set by authMiddleware — never accept userId from request body
    const customer = await Customer.findById(req.user._id);

    // Prevent duplicate wishlist entries
    const alreadyWishlisted = customer.wishlist.some(
      (id) => id.toString() === productId
    );
    if (alreadyWishlisted) {
      return res.status(409).json({
        success: false,
        message: 'Product is already in your wishlist',
      });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while adding to wishlist',
      error: error.message,
    });
  }
};

// GET /wishlist  — Get the authenticated user's wishlist (populated with product data)
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price category image stock description',
    });

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching wishlist',
      error: error.message,
    });
  }
};

// DELETE /wishlist/:productId  — Remove a product from the authenticated user's wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const customer = await Customer.findById(req.user._id);

    const index = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist',
      });
    }

    customer.wishlist.splice(index, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while removing from wishlist',
      error: error.message,
    });
  }
};

// PATCH /wishlist/:productId/toggle  — Bonus: Toggle wishlist (add if absent, remove if present)
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const customer = await Customer.findById(req.user._id);
    const index = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    let saved;
    if (index === -1) {
      // Not in wishlist — add it
      customer.wishlist.push(productId);
      saved = true;
    } else {
      // Already in wishlist — remove it
      customer.wishlist.splice(index, 1);
      saved = false;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      saved,
      message: saved ? 'Product added to wishlist' : 'Product removed from wishlist',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during wishlist toggle',
      error: error.message,
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
};

const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

// POST /cart/:productId  — Add product to cart (or increment quantity by 1 if already present)
const addToCart = async (req, res) => {
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
    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (cartItem) {
      // Product already in cart — increment quantity
      const newQty = cartItem.quantity + 1;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit(s) available in stock`,
        });
      }
      cartItem.quantity = newQty;
    } else {
      // Product not in cart — add with quantity 1
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: 'Product is out of stock',
        });
      }
      customer.cart.push({ product: productId, quantity: 1 });
    }

    await customer.save();

    // Return the updated cart (populated) so the frontend can sync state immediately
    await customer.populate({
      path: 'cart.product',
      select: 'name price category image stock description',
    });

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while adding to cart',
      error: error.message,
    });
  }
};

// GET /cart  — Get the authenticated user's cart with populated product data
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price category image stock description',
    });

    return res.status(200).json({
      success: true,
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching cart',
      error: error.message,
    });
  }
};

// PATCH /cart/:productId  — Update the quantity of a specific cart item
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Validate quantity
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be an integer of at least 1',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) available in stock`,
      });
    }

    const customer = await Customer.findById(req.user._id);
    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart',
      });
    }

    cartItem.quantity = quantity;
    await customer.save();

    await customer.populate({
      path: 'cart.product',
      select: 'name price category image stock description',
    });

    return res.status(200).json({
      success: true,
      message: 'Cart quantity updated',
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while updating cart quantity',
      error: error.message,
    });
  }
};

// DELETE /cart/:productId  — Remove a product from the authenticated user's cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const customer = await Customer.findById(req.user._id);
    const index = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart',
      });
    }

    customer.cart.splice(index, 1);
    await customer.save();

    await customer.populate({
      path: 'cart.product',
      select: 'name price category image stock description',
    });

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while removing from cart',
      error: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};

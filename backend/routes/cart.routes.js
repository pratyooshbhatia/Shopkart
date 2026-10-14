const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} = require('../controllers/cart.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All cart routes are protected — user identity comes from JWT
router.post('/:productId', authMiddleware, addToCart);
router.get('/', authMiddleware, getCart);
router.patch('/:productId', authMiddleware, updateCartQuantity);
router.delete('/:productId', authMiddleware, removeFromCart);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require('../controllers/wishlist.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All wishlist routes are protected — user identity comes from JWT, not request body
router.post('/:productId', authMiddleware, addToWishlist);
router.get('/', authMiddleware, getWishlist);
router.delete('/:productId', authMiddleware, removeFromWishlist);
router.patch('/:productId/toggle', authMiddleware, toggleWishlist); // Bonus

module.exports = router;

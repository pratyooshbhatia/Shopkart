const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getRazorpayConfig,
} = require('../controllers/order.controller');

// All order endpoints require authentication
router.use(authMiddleware);

// Razorpay config status
router.get('/razorpay-config', getRazorpayConfig);

// Checkout & payment flow
router.post('/create-payment-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);

// Order history & single order query
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;

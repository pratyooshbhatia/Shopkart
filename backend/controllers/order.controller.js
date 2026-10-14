const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Customer = require('../models/customer.model');
const {
  razorpay,
  getRazorpayInstance,
  key_id,
  getKeyId,
  isRazorpayConfigured,
  verifyPaymentSignature,
  generateSignature,
} = require('../config/razorpay');

/**
 * POST /orders/create-payment-order
 * 1. Authenticate user
 * 2. Validate shipping address
 * 3. Load user's cart from Customer model
 * 4. Verify cart is not empty
 * 5. Re-check latest product availability and stock in DB
 * 6. Calculate total amount server-side (ignore client-supplied total)
 * 7. Create snapshot of cart items (name, price, quantity, image)
 * 8. Create pending ShopKart Order
 * 9. Create Razorpay Order in paise
 * 10. Persist razorpayOrderId and return checkout payload
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!phone || !phone.trim() || !/^\d{10}$/.test(phone.trim().replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required' });
    }
    if (!addressLine1 || !addressLine1.trim()) {
      return res.status(400).json({ success: false, message: 'Address line 1 is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, message: 'State is required' });
    }
    if (!pincode || !pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({ success: false, message: 'Pincode must contain exactly 6 digits' });
    }

    // Load customer and cart
    const customer = await Customer.findById(req.user._id);
    if (!customer || !customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Add products to cart before checkout.',
      });
    }

    // Verify stock and build purchase snapshot
    const orderItems = [];
    let calculatedTotal = 0;

    for (const item of customer.cart) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'One of the products in your cart is no longer available.',
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`,
        });
      }

      // Snapshot product info at time of purchase
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });

      calculatedTotal += product.price * item.quantity;
    }

    // Create pending ShopKart order
    const newOrder = await Order.create({
      user: customer._id,
      items: orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      totalAmount: calculatedTotal,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT',
    });

    // Create Razorpay Order in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(calculatedTotal * 100);
    let razorpayOrder;
    let isSimulated = false;

    // Check if live Razorpay credentials are configured and valid
    if (isRazorpayConfigured()) {
      try {
        const rzp = getRazorpayInstance();
        razorpayOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `ord_${newOrder._id.toString().slice(-8)}`,
          notes: {
            shopkartOrderId: newOrder._id.toString(),
            customerEmail: customer.email,
          },
        });
      } catch (rzpErr) {
        console.warn('Live Razorpay order creation failed (falling back to simulator):', rzpErr.message);
        isSimulated = true;
        razorpayOrder = {
          id: `order_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          amount: amountInPaise,
          currency: 'INR',
        };
      }
    } else {
      isSimulated = true;
      razorpayOrder = {
        id: `order_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        amount: amountInPaise,
        currency: 'INR',
      };
    }

    newOrder.razorpayOrderId = razorpayOrder.id;
    await newOrder.save();

    const activeKeyId = getKeyId();

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      orderId: newOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      totalAmount: calculatedTotal,
      keyId: activeKeyId,
      isSimulated,
      customer: {
        name: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating payment order',
      error: error.message,
    });
  }
};

/**
 * POST /orders/verify-payment
 * 1. Authenticate user
 * 2. Receive razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId
 * 3. Verify HMAC SHA256 signature
 * 4. On failure: mark paymentStatus FAILED, keep cart intact, return 400
 * 5. On success:
 *    - mark paymentStatus PAID
 *    - mark status PLACED
 *    - decrement Product stock in MongoDB
 *    - clear user cart in Customer model
 *    - return confirmed order
 */
const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Locate order belonging to this user
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized',
      });
    }

    // If order was already processed as PAID, return idempotently
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Order is already verified and placed',
        order,
      });
    }

    // Verify cryptographic signature
    const isValidSignature = verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!isValidSignature) {
      order.paymentStatus = 'FAILED';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature. Cart has been preserved.',
      });
    }

    // Signature verified successfully — confirm order
    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    // Decrement stock for purchased products
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user's cart in DB only after payment is verified
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order placed!',
      order,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying payment',
      error: error.message,
    });
  }
};

/**
 * GET /orders
 * Fetch all orders placed by the authenticated user, sorted newest first
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
      error: error.message,
    });
  }
};

/**
 * GET /orders/:id
 * Fetch a single order by ID, enforcing user ownership
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching order details',
      error: error.message,
    });
  }
};

/**
 * GET /orders/razorpay-config
 * Returns current Razorpay configuration status (without exposing secret)
 */
const getRazorpayConfig = async (req, res) => {
  const configured = isRazorpayConfigured();
  return res.status(200).json({
    success: true,
    isConfigured: configured,
    keyId: configured ? getKeyId() : null,
  });
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getRazorpayConfig,
};

const jwt = require('jsonwebtoken');
const Customer = require('../models/customer.model');

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies && req.cookies.token;

    // Optional fallback to Authorization header if cookies aren't used
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided',
      });
    }

    const secret = process.env.JWT_SECRET || 'shopkart_secret_jwt_key_super_secure';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid or expired token',
      });
    }

    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Customer not found',
      });
    }

    req.user = customer;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;

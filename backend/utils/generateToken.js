const jwt = require('jsonwebtoken');

const generateTokenAndSetCookie = (res, customerId) => {
  const secret = process.env.JWT_SECRET || 'shopkart_secret_jwt_key_super_secure';
  const token = jwt.sign({ id: customerId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  res.cookie('token', token, cookieOptions);

  return token;
};

module.exports = generateTokenAndSetCookie;

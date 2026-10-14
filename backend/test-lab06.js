process.env.NODE_ENV = 'test';
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('./index');
const Customer = require('./models/customer.model');
const Product = require('./models/product.model');
const Order = require('./models/order.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { key_secret } = require('./config/razorpay');

let server;
let mongod;

async function setup() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      resolve(`http://localhost:${port}`);
    });
  });
}

async function teardown() {
  if (server) await new Promise((r) => server.close(r));
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 LAB 06 CHECKOUT & ORDERS VALIDATION SUITE');
  console.log('====================================================\n');

  const baseUrl = await setup();
  let passed = 0;
  let total = 0;

  function assert(title, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title} ${extra}`);
    }
  }

  try {
    // 1. Seed two test customers
    const userA = await Customer.create({
      fullName: 'Aarav Sharma',
      email: 'aarav@shopkart.test',
      password: 'password123',
      phone: '9876543210',
    });

    const userB = await Customer.create({
      fullName: 'Riya Sen',
      email: 'riya@shopkart.test',
      password: 'password123',
      phone: '9123456780',
    });

    const tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET || 'shopkart_secret_jwt_key_super_secure', { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET || 'shopkart_secret_jwt_key_super_secure', { expiresIn: '1h' });

    // 2. Seed test products
    const prodKeyboard = await Product.create({
      name: 'Mechanical Keyboard RGB',
      price: 2999,
      category: 'Electronics',
      description: 'Tactile mechanical switches',
      stock: 5,
      image: 'https://example.com/keyboard.jpg',
    });

    const prodMouse = await Product.create({
      name: 'Wireless Gaming Mouse',
      price: 1499,
      category: 'Electronics',
      description: 'Precision 16000 DPI sensor',
      stock: 10,
      image: 'https://example.com/mouse.jpg',
    });

    // TEST 1: Unauthenticated request should fail with 401
    const resUnauth = await fetch(`${baseUrl}/orders`, { method: 'GET' });
    assert('Unauthenticated request to GET /orders rejected with 401', resUnauth.status === 401);

    // TEST 2: Checkout with empty cart should fail with 400
    const resEmptyCart = await fetch(`${baseUrl}/orders/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
      }),
    });
    const dataEmptyCart = await resEmptyCart.json();
    assert('Checkout with empty cart returns 400 Bad Request', resEmptyCart.status === 400 && dataEmptyCart.message.includes('Cart is empty'));

    // TEST 3: Validation failure for invalid shipping address (e.g. invalid pincode)
    userA.cart = [{ product: prodKeyboard._id, quantity: 2 }];
    await userA.save();

    const resBadPincode = await fetch(`${baseUrl}/orders/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '123', // invalid pincode (< 6 digits)
        },
      }),
    });
    assert('Invalid pincode is rejected with 400 Bad Request', resBadPincode.status === 400);

    // TEST 4: Stock check during checkout
    userA.cart = [{ product: prodKeyboard._id, quantity: 99 }]; // Stock is only 5
    await userA.save();

    const resOverstock = await fetch(`${baseUrl}/orders/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
      }),
    });
    const dataOverstock = await resOverstock.json();
    assert('Exceeding available stock returns 400 with stock error', resOverstock.status === 400 && dataOverstock.message.includes('Insufficient stock'));

    // TEST 5: Successful create-payment-order
    // Set realistic quantities: 2 Keyboards (2 x 2999 = 5998) + 1 Mouse (1 x 1499 = 1499) -> Total = 7497
    userA.cart = [
      { product: prodKeyboard._id, quantity: 2 },
      { product: prodMouse._id, quantity: 1 },
    ];
    await userA.save();

    const resCreateOrder = await fetch(`${baseUrl}/orders/create-payment-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        totalAmount: 1, // Fake client total, server MUST ignore this
      }),
    });

    const dataCreateOrder = await resCreateOrder.json();
    assert('Create payment order returns 201 Created', resCreateOrder.status === 201 && dataCreateOrder.success === true);
    assert('Server calculates real total (₹7,497) ignoring client spoof', dataCreateOrder.totalAmount === 7497);
    assert('Razorpay amount is accurately calculated in paise (749700)', dataCreateOrder.amount === 749700);
    assert('Returns Razorpay order ID and ShopKart order ID', !!dataCreateOrder.razorpayOrderId && !!dataCreateOrder.orderId);

    const createdOrderId = dataCreateOrder.orderId;
    const rzpOrderId = dataCreateOrder.razorpayOrderId;

    // TEST 6: Verify cart is NOT cleared before payment verification
    const customerBeforeVerify = await Customer.findById(userA._id);
    assert('User cart remains intact before payment verification', customerBeforeVerify.cart.length === 2);

    // TEST 7: Invalid payment signature verification should fail and NOT clear cart
    const resBadSig = await fetch(`${baseUrl}/orders/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        orderId: createdOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: 'pay_tampered_123',
        razorpay_signature: 'invalid_forged_signature',
      }),
    });
    assert('Invalid HMAC signature rejected with 400 Bad Request', resBadSig.status === 400);

    const orderAfterFailed = await Order.findById(createdOrderId);
    assert('Order marked FAILED on invalid signature', orderAfterFailed.paymentStatus === 'FAILED');

    const customerAfterFailed = await Customer.findById(userA._id);
    assert('Cart is preserved when payment signature fails', customerAfterFailed.cart.length === 2);

    // TEST 8: Valid payment signature verification
    const validPaymentId = 'pay_test_valid_999';
    const validSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${rzpOrderId}|${validPaymentId}`)
      .digest('hex');

    const resVerify = await fetch(`${baseUrl}/orders/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        orderId: createdOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validSignature,
      }),
    });

    const dataVerify = await resVerify.json();
    assert('Valid HMAC signature succeeds with 200 OK', resVerify.status === 200 && dataVerify.success === true);
    assert('Order paymentStatus updated to PAID', dataVerify.order.paymentStatus === 'PAID');
    assert('Order status updated to PLACED', dataVerify.order.status === 'PLACED');

    // TEST 9: Cart is cleared in database after verified payment
    const customerAfterSuccess = await Customer.findById(userA._id);
    assert('User cart is emptied after verified payment', customerAfterSuccess.cart.length === 0);

    // TEST 10: Stock is decremented in MongoDB
    const updatedKeyboard = await Product.findById(prodKeyboard._id);
    const updatedMouse = await Product.findById(prodMouse._id);
    assert('Product stock decremented (Keyboard 5 -> 3)', updatedKeyboard.stock === 3);
    assert('Product stock decremented (Mouse 10 -> 9)', updatedMouse.stock === 9);

    // TEST 11: GET /orders returns user orders
    const resOrders = await fetch(`${baseUrl}/orders`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataOrders = await resOrders.json();
    assert('GET /orders returns authenticated user orders list', resOrders.status === 200 && dataOrders.orders.length === 1);
    assert('User B cannot see User A orders', (await (await fetch(`${baseUrl}/orders`, { headers: { Authorization: `Bearer ${tokenB}` } })).json()).orders.length === 0);

    // TEST 12: GET /orders/:id ownership check
    const resUserAOrder = await fetch(`${baseUrl}/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert('Owner can fetch single order details', resUserAOrder.status === 200);

    const resUserBUnauthorized = await fetch(`${baseUrl}/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert('User B cannot access User A order (404/403 enforced)', resUserBUnauthorized.status === 404);

    // TEST 13: Order Price Snapshot Integrity
    // Change product price in Product collection
    await Product.findByIdAndUpdate(prodKeyboard._id, { price: 9999 });

    const orderRefetched = await Order.findById(createdOrderId);
    const keyboardSnapshot = orderRefetched.items.find(i => i.name === 'Mechanical Keyboard RGB');
    assert('Order snapshot preserves original purchase price (₹2,999) despite future Product price change to ₹9,999', keyboardSnapshot.price === 2999);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await teardown();
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('====================================================');
  if (passed === total) {
    console.log('🎉 ALL LAB 06 BACKEND CHECKS PASSED PERFECTLY!\n');
  } else {
    process.exit(1);
  }
}

runTests();

# 🛠️ Tools & Topics Explained — Lab 06 (Checkout & Orders)

> Deep-dive reference guide explaining the core tools, cryptographic mechanisms, data architecture, and full-stack patterns used in Lab 06.

---

## 1. 💳 Razorpay Test Mode Architecture

### What is Razorpay?
Razorpay is a developer-focused payment gateway that allows online businesses in India to accept, process, and disburse payments via UPI, Credit/Debit cards, Net Banking, and Wallets.

### Test Mode vs. Live Mode
- **Test Mode**: Uses sandbox credentials (`rzp_test_...`). No real money is moved. Razorpay provides mock card numbers (e.g., standard test cards where OTP is any 4 digits) to simulate successful and failed payments.
- **Live Mode**: Requires KYC activation and charges real bank accounts.

### The 2-Step Payment Protocol
Payment gateways cannot rely on a single client-side request because the client environment is inherently hostile and untrusted. Razorpay splits payments into two distinct phases:

```text
Phase 1: Pre-Payment (Backend Authorization)
Frontend                Backend               Razorpay Servers
   |                       |                         |
   |-- Click Checkout ---->|                         |
   |   (Address only)      |-- Create Order -------->|
   |                       |   (Amount in paise)     |
   |                       |<-- rzp_order_id --------|
   |<-- rzp_order_id ------|                         |

Phase 2: Payment & Verification
Frontend                Razorpay Modal        Backend
   |                          |                  |
   |-- Open Modal (key, id) ->|                  |
   |   Customer pays (Card)   |                  |
   |<-- (order_id, pay_id, sig)                  |
   |                                             |
   |-- POST /orders/verify-payment ------------->|
   |   (order_id, pay_id, sig)                   |-- Verify HMAC SHA256
   |                                             |-- Mark PAID
   |                                             |-- Decrement Stock
   |                                             |-- Clear Cart
   |<-- 200 OK (Confirmed Order) ----------------|
```

---

## 2. 🔐 HMAC SHA-256 Cryptographic Verification

### What is HMAC?
**Hash-based Message Authentication Code (HMAC)** is a specific type of message authentication code involving a cryptographic hash function in combination with a secret cryptographic key.

### Why not simple MD5 or SHA256?
A plain hash `SHA256(message)` is repeatable by anyone who has the message.  
An HMAC `HMAC(key, message)` can **only** be calculated by someone who possesses the private `key_secret`.

### The Verification Formula
When Razorpay collects money, it signs the concatenation of the order ID and payment ID with your merchant secret:
$$\text{Signature} = \text{HMAC-SHA256}(\text{razorpay\_order\_id} + "|" + \text{razorpay\_payment\_id}, \text{key\_secret})$$

```js
const crypto = require('crypto');

const generatedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');

const isAuthentic = (generatedSignature === razorpay_signature);
```

If even a single character was altered in transit or if an attacker invented a fake `payment_id`, the hash comparison will fail.

---

## 3. 📸 Data Snapshotting vs. Referencing

### The Problem with Pure Referencing
In Lab 04 & 05, Cart and Wishlist stored references:
```js
// Cart Item (Referenced)
{
  product: ObjectId("67a1..."),
  quantity: 2
}
```
When fetching the cart, `populate('product')` pulls the live price from the `Product` collection.  
If the merchant changes the product's price from ₹500 to ₹800 tomorrow, the cart price dynamically updates. This is desired for a cart.

### Why Orders Require Snapshots
An order is a legal fiscal invoice. If a customer bought a product for ₹500 on Monday, the order history must **never** change to ₹800 on Tuesday just because the merchant updated catalog pricing.

```js
// Order Item (Snapshot)
{
  product: ObjectId("67a1..."), // reference kept for product page linking
  name: "Mechanical Keyboard",   // snapshot
  price: 2999,                   // snapshot: locked at purchase price
  quantity: 2,
  image: "https://..."           // snapshot
}
```

---

## 4. ⚡ Atomic Stock Decrementing with MongoDB `$inc`

### Why not read-modify-save?
A naive approach to decrement stock:
```js
// ❌ Dangerous Race Condition
const product = await Product.findById(id);
product.stock = product.stock - quantity;
await product.save();
```
If two users purchase the final item at the exact same millisecond:
1. Process A reads stock: 1
2. Process B reads stock: 1
3. Process A saves: $1 - 1 = 0$
4. Process B saves: $1 - 1 = 0$  
Both orders succeed, but the store had only 1 physical unit in the warehouse (**Overselling**).

### The Atomic Solution
```js
// ✅ Atomic update executed directly inside MongoDB database engine
await Product.findByIdAndUpdate(productId, {
  $inc: { stock: -quantity }
});
```
MongoDB's `$inc` operator is thread-safe and isolated at the document level.

---

## 5. 🛡️ Insecure Direct Object References (IDOR)

### The Vulnerability
When a user views their order details via `GET /orders/:id`:
```js
// ❌ VULNERABLE
app.get('/orders/:id', authMiddleware, async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json({ order });
});
```
Any authenticated user can change `:id` in the URL bar to an order belonging to another customer and read their full name, home address, phone number, and purchase history.

### The Fix
```js
// ✅ SECURE
const order = await Order.findOne({
  _id: req.params.id,
  user: req.user._id // Must match currently logged-in user
});
```

---

## 6. 🌐 Frontend UX Patterns: Loading, Empty, and Success States

| State | Implementation in ShopKart | Why it Matters |
|---|---|---|
| **Loading** | Tailwind spinner with disabled button (`isSubmitting`) | Prevents duplicate form submits and double-charging |
| **Empty State** | Friendly icon + *"No orders placed yet"* + *"Start Shopping"* button | Prevents confusion when a user visits `/orders` for the first time |
| **Error Feedback** | Red banner with clear message (e.g., *"Insufficient stock for Mouse"*) | Informs user why checkout failed so they can adjust cart |
| **Order Confirmation** | Green success banner with Order ID and itemized recap | Assures user their money was received and purchase confirmed |

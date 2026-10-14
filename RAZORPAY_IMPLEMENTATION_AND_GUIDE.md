# 💳 Razorpay Payment Gateway: Core Implementation & Step-by-Step Guide

> **Project:** ShopKart MERN E-Commerce  
> **Status:** Fully Integrated with Dual Mode Support (Live Razorpay Test Popup + Local Sandbox Simulator)

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [How to Get Your Razorpay Test Keys (2-Minute Guide)](#2-how-to-get-your-razorpay-test-keys-2-minute-guide)
3. [Configuring Your Keys in the App](#3-configuring-your-keys-in-the-app)
4. [Official Razorpay Test Credentials (Cards, UPI, Netbanking)](#4-official-razorpay-test-credentials)
5. [The 4-Step Payment Lifecycle Explained](#5-the-4-step-payment-lifecycle-explained)
   - [Step 1: Backend Order Creation (Paise & Stock Locking)](#step-1-backend-order-creation)
   - [Step 2: Frontend Checkout Modal Trigger](#step-2-frontend-checkout-modal-trigger)
   - [Step 3: Cryptographic Signature Verification (HMAC-SHA256)](#step-3-cryptographic-signature-verification)
   - [Step 4: State Synchronization (Stock & Cart)](#step-4-state-synchronization)
6. [Security Rules & Best Practices](#6-security-rules--best-practices)
7. [Dual-Mode Architecture (Why Your App Works Anywhere)](#7-dual-mode-architecture)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. Architecture Overview

In a production-ready MERN application, payments **cannot** happen purely on the frontend. The frontend runs in an untrusted browser environment where any user can tamper with JavaScript variables, spoof amounts, or bypass UI checks.

Therefore, Razorpay enforces a **two-phase verification architecture**:

```
[Customer Browser / React]                  [ShopKart Express Backend]                  [Razorpay Cloud Servers]
           │                                            │                                          │
           │─── 1. POST /orders/create-payment-order ──>│                                          │
           │    (with shipping info)                    │─── 2. Calculate total in Paise           │
           │                                            │─── 3. razorpay.orders.create(...) ──────>│
           │                                            │<── 4. Returns razorpay_order_id ─────────│
           │<── 5. Returns { orderId, razorpayOrderId,  │                                          │
           │                 amount, keyId } ───────────│                                          │
           │                                                                                       │
           │─── 6. Opens Razorpay Modal (new window.Razorpay(options)) ───────────────────────────>│
           │    (Customer enters test card/UPI in secure iframe)                                   │
           │<── 7. Razorpay processes & returns { razorpay_order_id, razorpay_payment_id,          │
           │                                      razorpay_signature } ────────────────────────────│
           │                                                                                       │
           │─── 8. POST /orders/verify-payment ────────>│                                          │
           │    (Sends the 3 signature parameters)      │─── 9. Computes HMAC-SHA256               │
           │                                            │       hash with RAZORPAY_KEY_SECRET      │
           │                                            │─── 10. If matches:                       │
           │                                            │        • Mark order as PAID              │
           │                                            │        • Decrement Product stock         │
           │                                            │        • Empty user cart in MongoDB      │
           │<── 11. 200 OK + Confirmed Order ───────────│                                          │
           │                                                                                       │
[Navigates to /order-success]
```

---

## 2. How to Get Your Razorpay Test Keys (2-Minute Guide)

You **do not need** a business entity, GST number, or bank verification to use Razorpay in **Test Mode**. It is 100% free and instantly available.

### Step 1: Sign Up / Sign In
1. Open your browser and go to: **[https://dashboard.razorpay.com](https://dashboard.razorpay.com)**
2. Sign in with your Google account or email.

### Step 2: Switch to Test Mode
At the top navigation bar of the Razorpay Dashboard, locate the toggle switch:
- Toggle from **Live Mode** to **Test Mode** (the header color changes to amber/yellow).

### Step 3: Generate Your API Keys
1. In the left sidebar, click on **Account & Settings** (or go directly to **[https://dashboard.razorpay.com/app/keys](https://dashboard.razorpay.com/app/keys)**).
2. Under the **API Keys** section, click on **Generate Key** (or **Regenerate Key** if you created one before).
3. A modal will appear showing two values:
   - **Key ID:** Starts with `rzp_test_...` (e.g., `rzp_test_abcdef12345678`)
   - **Key Secret:** A 24-character random string (e.g., `aBcDeFgHiJkLmNoPqRsTuVwX`)
4. ⚠️ **Important:** Copy the **Key Secret** immediately! Razorpay will **never** display the secret again once you close that modal.

---

## 3. Configuring Your Keys in the App

Open the [`backend/.env`](file:///Users/ykg/Downloads/term%205%20mern%202/backend/.env) file:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/shopkart
JWT_SECRET=shopkart_secret_jwt_key_super_secure
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Paste your copied keys here:
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
```

### Restart the Backend:
In your terminal, restart the backend so the new keys are loaded:
```bash
npm run backend
```
*(The app will automatically detect your live test keys and display a green indicator in the checkout page!)*

---

## 4. Official Razorpay Test Credentials

When testing in Test Mode, **no real money is charged**. Use these official test credentials:

### A. Test Credit / Debit Cards
| Field | Value |
| :--- | :--- |
| **Card Number** | `4012 0000 0000 0002` (Standard Visa Test Card) |
| **Card Number (Mastercard)** | `5123 4567 8901 2346` |
| **Expiry Date** | Any valid future date (e.g., `12 / 28`) |
| **Cardholder Name** | Any name (e.g., `Test User`) |
| **CVV** | Any 3 digits (e.g., `123`) |
| **Bank OTP** | Any 4 or 6 digits (e.g., `1234`) |

### B. Test UPI ID
- Enter **UPI ID / VPA**: `success@razorpay`
- Tap **Pay** &rarr; The payment simulates instant approval.
- To simulate failure: `failure@razorpay`.

### C. Test Net Banking
- Select any simulated bank (e.g., **HDFC**, **SBI**, **ICICI**).
- On the simulated bank portal page, click the green **Success** button.

---

## 5. The 4-Step Payment Lifecycle Explained

### Step 1: Backend Order Creation
**Location:** [`backend/controllers/order.controller.js`](file:///Users/ykg/Downloads/term%205%20mern%202/backend/controllers/order.controller.js) &rarr; `createPaymentOrder`

1. **Cart & Stock Validation:**
   - The backend never trusts the client's total amount!
   - It reads the user's cart from MongoDB, fetches latest prices directly from the database, and checks `product.stock >= item.quantity`.
2. **Paise Conversion:**
   - Razorpay amounts are represented in the smallest currency unit.
   - For INR: **1 Rupee = 100 Paise**.
   - A cart of ₹7,497 must be sent as `749700`.
3. **Razorpay Order Initialization:**
   ```javascript
   const razorpayOrder = await razorpay.orders.create({
     amount: amountInPaise,
     currency: 'INR',
     receipt: `ord_${newOrder._id.toString().slice(-8)}`,
     notes: {
       shopkartOrderId: newOrder._id.toString(),
       customerEmail: customer.email,
     },
   });
   ```
4. **Order Snapshot:**
   - Saves a pending order in MongoDB with `paymentStatus = 'PENDING'` and `status = 'PENDING_PAYMENT'`.

---

### Step 2: Frontend Checkout Modal Trigger
**Location:** [`frontend/src/pages/Checkout.jsx`](file:///Users/ykg/Downloads/term%205%20mern%202/frontend/src/pages/Checkout.jsx) &rarr; `handlePlaceOrder`

1. Loads the script dynamically: `https://checkout.razorpay.com/v1/checkout.js`
2. Configures the checkout payload:
   ```javascript
   const options = {
     key: keyId,                       // Public key ONLY (rzp_test_...)
     amount: amount,                   // In paise
     currency: 'INR',
     name: 'ShopKart',
     order_id: razorpayOrderId,        // From step 1
     prefill: {
       name: formData.fullName,
       email: user?.email,
       contact: formData.phone,
     },
     theme: { color: '#2563eb' },
     handler: async function (response) {
       // Called when user successfully pays inside Razorpay modal
       await orderService.verifyPayment({
         orderId,
         razorpay_order_id: response.razorpay_order_id,
         razorpay_payment_id: response.razorpay_payment_id,
         razorpay_signature: response.razorpay_signature,
       });
     },
     modal: {
       ondismiss: function () {
         // User closed popup without paying -> cart is preserved!
       }
     }
   };
   const rzp = new window.Razorpay(options);
   rzp.open();
   ```

---

### Step 3: Cryptographic Signature Verification
**Location:** [`backend/config/razorpay.js`](file:///Users/ykg/Downloads/term%205%20mern%202/backend/config/razorpay.js) &rarr; `verifyPaymentSignature`

When payment completes, Razorpay generates a signature:
$$\text{Signature} = \text{HMAC-SHA256}(\text{razorpay\_order\_id} + \text{"|"} + \text{razorpay\_payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$

In Node.js, we verify this mathematically:
```javascript
const crypto = require('crypto');

const generatedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

const isAuthentic = (generatedSignature === razorpaySignature);
```

**Why is this foolproof?**
- An attacker cannot fabricate `razorpay_payment_id` because only Razorpay's private servers know how to produce a signature signed by your secret.
- An attacker cannot reuse a signature from a different transaction because the signature binds specifically to that unique `order_id` and `payment_id`.

---

### Step 4: State Synchronization
**Location:** [`backend/controllers/order.controller.js`](file:///Users/ykg/Downloads/term%205%20mern%202/backend/controllers/order.controller.js) &rarr; `verifyPayment`

Only **AFTER** the signature is verified:
1. `order.paymentStatus = 'PAID'`
2. `order.status = 'PLACED'`
3. Decrement Product Stock in MongoDB:
   ```javascript
   for (const item of order.items) {
     await Product.findByIdAndUpdate(item.product, {
       $inc: { stock: -item.quantity }
     });
   }
   ```
4. Clear User Cart in MongoDB:
   ```javascript
   customer.cart = [];
   await customer.save();
   ```
5. Redirect frontend to [`OrderSuccess.jsx`](file:///Users/ykg/Downloads/term%205%20mern%202/frontend/src/pages/OrderSuccess.jsx).

---

## 6. Security Rules & Best Practices

| Rule | Rationale |
| :--- | :--- |
| **Never expose `RAZORPAY_KEY_SECRET` to React** | Any variable in the browser can be inspected by dev tools or network sniffers. The secret must remain exclusively in `backend/.env`. |
| **Always calculate amount on the server** | A malicious client can send `{ totalAmount: 1 }` via fetch. The backend must independently query prices from MongoDB and sum them. |
| **Never clear cart before signature verification** | If a customer's payment fails or they dismiss the modal, their items must remain in their cart. |
| **Preserve order item snapshot** | Product prices change in the future. The order model must store the frozen price at the time of purchase (`snapshot`). |

---

## 7. Dual-Mode Architecture

To ensure your project is **100% resilient and testable anywhere** (during college viva, offline, or with live test keys), we built a dual-mode engine:

1. **Live Razorpay Test Mode:**
   - Active whenever `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are provided in `backend/.env`.
   - Opens the authentic Razorpay checkout iframe with cards, UPI, and netbanking.
2. **Local Sandbox Simulation Mode:**
   - Active when working locally without keys or if external API connection is blocked.
   - Launches an interactive in-app Razorpay Test Sandbox dialog.
   - Allows one-click testing of both **Successful Payment** and **Failed Payment** workflows.
   - Performs authentic database updates, cart emptying, stock deductions, and navigation.

---

## 8. Troubleshooting & FAQs

### Q: Why did Razorpay show "Order ID not found" previously?
Because previously, when dummy credentials were used, the backend fell back to a simulated order ID (`order_sim_...`). Feeding an invalid simulated ID into Razorpay's official CDN script causes Razorpay's cloud servers to reject the request with `Order not found`. We resolved this by detecting simulated orders and presenting our dedicated Sandbox dialog.

### Q: How do I verify my keys are connected?
Look at the top-right of the [Checkout Page](http://localhost:5173/checkout):
- 🟢 **Green Badge:** `Razorpay Test Mode Connected (rzp_test_...)` &rarr; Official popup active.
- 🟡 **Amber Badge:** `Razorpay Local Sandbox Mode` &rarr; In-app test simulator active. Click the badge for the quick setup guide.

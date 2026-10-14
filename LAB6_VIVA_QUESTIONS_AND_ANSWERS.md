# 🎤 Viva Questions & Answers — Lab 06 (Checkout & Orders)

> **ShopKart Final Module:** Checkout, Razorpay Payment Gateway, Order Modeling, Stock Validation, Cryptographic Signatures, and State Synchronization.
>
> Covers every TA viva question and core full-stack concept with clear, exam-ready answers.

---

## 📑 Table of Contents
1. [💳 Razorpay Payment Gateway & Checkout Flow](#1--razorpay-payment-gateway--checkout-flow)
2. [📦 Order Data Modeling & Snapshots](#2--order-data-modeling--snapshots)
3. [🛡️ Security, Validation & Business Logic](#3--security-validation--business-logic)
4. [🔄 State Management & Frontend Lifecycle](#4--state-management--frontend-lifecycle)
5. [⚡ Flashcard Summary: High-Yield Viva Cheatsheet](#5--flashcard-summary-high-yield-viva-cheatsheet)

---

# 1. 💳 Razorpay Payment Gateway & Checkout Flow

---

### **Q1. Why must the Razorpay Order be created from the backend?**

> **Answer:**  
> The backend holds the private `RAZORPAY_KEY_SECRET`. Creating an order on the backend ensures:
> 1. The price is strictly determined by the database (the user cannot manipulate the price or quantity).
> 2. Razorpay associates the order ID with your merchant account securely before the user is allowed to pay.
> 3. The `key_secret` is never exposed to the client browser.

---

### **Q2. Why is the Razorpay Key Secret never sent to or stored in React?**

> **Answer:**  
> Any code or variable present in React runs in the user's browser. If the `RAZORPAY_KEY_SECRET` were sent to the frontend, anyone could inspect network traffic or developer tools, steal the secret, and:
> - Authorize unauthorized refunds.
> - Forge payment signatures.
> - Access private merchant financial data.  
> Only the public `RAZORPAY_KEY_ID` is sent to React to initialize the modal.

---

### **Q3. Why does Razorpay expect INR amounts in paise?**

> **Answer:**  
> To eliminate **floating-point rounding inaccuracies**.  
> Computers represent decimal floating-point numbers in binary (`0.1 + 0.2 === 0.30000000000000004`). In financial calculations, fractional cent/paise rounding bugs can result in severe accounting discrepancies. Operating entirely in the smallest integer currency unit (`1 INR = 100 paise`) guarantees exact integer arithmetic.

---

### **Q4. What are `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`?**

| Parameter | Created By | Description |
|---|---|---|
| `razorpay_order_id` | Backend (via Razorpay API) | Unique identifier for the transaction attempt created before payment opens. |
| `razorpay_payment_id` | Razorpay Gateway | Unique receipt reference generated after the customer completes the transaction (e.g., via card/UPI). |
| `razorpay_signature` | Razorpay Gateway | Cryptographic hash proving that the payment was legitimately collected by Razorpay for that specific order. |

---

### **Q5. What is HMAC SHA-256 and why is payment signature verification mandatory?**

> **Answer:**  
> **HMAC (Hash-based Message Authentication Code)** with **SHA-256** creates a cryptographic hash using a secret key:
> ```js
> const expectedSignature = crypto
>   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
>   .update(`${razorpay_order_id}|${razorpay_payment_id}`)
>   .digest('hex');
> ```
> **Why it is mandatory:**  
> Anyone can open Postman or browser console and send a fake request: `{ paymentSuccess: true, paymentId: 'fake123' }`. Signature verification mathematically proves that:
> 1. The payment actually succeeded on Razorpay's real servers.
> 2. The payment was collected for *this exact order*.
> 3. The response payload was not intercepted or tampered with in transit.

---

### **Q6. Why should the cart NOT be cleared when Checkout merely opens?**

> **Answer:**  
> Opening Checkout only means the user *intended* to pay. If they:
> - Close the popup,
> - Enter an invalid OTP,
> - Suffer a network drop or bank server outage,  
> the transaction fails. If the cart were already cleared, the customer loses their selected items and suffers a frustrating user experience. The cart must only be cleared **after confirmed cryptographic signature verification**.

---

### **Q7. What would happen if the client simply sent `paymentSuccess: true`?**

> **Answer:**  
> Any malicious user could intercept the HTTP request or use Postman to send `{"paymentSuccess": true}` without ever entering card details or spending a single rupee. The server would mark the order as paid and ship free products.

---

### **Q8. What happens if a user closes the Razorpay popup mid-payment?**

> **Answer:**  
> The Razorpay modal's `ondismiss` handler fires on the frontend:
> - Loading spinner is stopped.
> - An informational notice is displayed: *"Payment was cancelled. Your cart has been preserved."*
> - The database Order remains in `paymentStatus: 'PENDING'`, and the customer's cart remains completely intact so they can retry.

---

# 2. 📦 Order Data Modeling & Snapshots

---

### **Q9. Why does an Order store product `name` and `price` separately from the Product document?**

> **Answer:**  
> This is called **historical data snapshotting**.  
> The `Product` document represents current inventory. If we only stored `product: productId` in an order:
> - If the seller raises the price from ₹2,999 to ₹4,999 next month, the past invoice would falsely show the customer paid ₹4,999.
> - If the seller deletes the product, the order history would crash or show `null`.  
> An order must represent the **legal and commercial truth** at the exact millisecond of purchase.

---

### **Q10. What is the fundamental difference between Cart data and Order data?**

| Aspect | Cart Data | Order Data |
|---|---|---|
| **Nature** | Temporary & dynamic reference | Permanent & immutable legal snapshot |
| **Product Data** | References `Product._id` | Snapshots `name`, `price`, `image` at purchase time |
| **Price** | Shows current live store price | Locked at the price paid |
| **Lifecycle** | Can be overwritten, modified, or cleared | Permanent historical record |
| **Storage** | Embedded array in Customer | Dedicated standalone `Order` collection |

---

### **Q11. Why should the Order schema reference the `Customer` model?**

> **Answer:**  
> 1. **Ownership & Access Control:** It binds the order to the authenticated account so `GET /orders` can query `{ user: req.user._id }`.
> 2. **Audit & Customer Support:** Enables administrators to search all orders by user ID.
> 3. **Relational Integrity:** Links customer profile (email, registered phone) with the order.

---

### **Q12. Why is the shipping address embedded directly in the Order?**

> **Answer:**  
> A user's profile address can change in the future (e.g., they move to a new city). An order must permanently record the **exact destination where that specific parcel was shipped**. Embedding the address as an immutable subdocument prevents historical delivery records from being overwritten.

---

# 3. 🛡️ Security, Validation & Business Logic

---

### **Q13. Why must the backend calculate `totalAmount` instead of trusting the frontend?**

> **Answer:**  
> The frontend is untrusted client code. A user could alter JavaScript variables or craft a raw HTTP request sending:
> ```json
> { "totalAmount": 1 }
> ```
> The server must recalculate:
> $$\text{totalAmount} = \sum (\text{product.price} \times \text{cartItem.quantity})$$
> using verified prices fetched directly from MongoDB.

---

### **Q14. Why must product stock be checked a second time during checkout?**

> **Answer:**  
> A customer might add an item to their cart at 10:00 AM when stock is 2.  
> At 10:05 AM, another shopper buys both remaining units.  
> If the first customer checks out at 10:10 AM without re-validation, the store sells nonexistent inventory (**overselling**). Validating stock right before creating the payment order prevents fulfillment failures.

---

### **Q15. What is a TOCTOU (Time-of-Check to Time-of-Use) race condition in eCommerce?**

> **Answer:**  
> It occurs when the state changes between the time stock is checked and the time it is decremented.  
> In our implementation, we:
> 1. Check stock when generating the payment order (`product.stock >= quantity`).
> 2. Use atomic MongoDB updates (`$inc: { stock: -quantity }`) upon payment verification so concurrent purchases do not corrupt inventory.

---

### **Q16. How do you prevent IDOR (Insecure Direct Object Reference) in `GET /orders/:id`?**

> **Answer:**  
> Never query solely by `_id`:
> ```js
> // ❌ VULNERABLE: Any logged-in user guessing an ID can view someone else's order
> Order.findById(req.params.id);
> ```
> Always enforce the authenticated user's ID:
> ```js
> // ✅ SECURE: Only returns the order if it belongs to the caller
> Order.findOne({ _id: req.params.id, user: req.user._id });
> ```
> If not found, return `404 Not Found` (or `403 Forbidden`).

---

### **Q17. What HTTP status codes are used across the Order API and why?**

| Status Code | Meaning | Used When |
|---|---|---|
| **200 OK** | Success | Fetching order list, single order, or successful payment verification |
| **201 Created** | Resource Created | Successfully creating a pending payment order |
| **400 Bad Request** | Client error | Cart is empty, stock insufficient, invalid address, or forged HMAC signature |
| **401 Unauthorized** | Missing/Invalid Token | Request missing valid JWT authentication |
| **404 Not Found** | Missing Resource | Order does not exist or does not belong to the user |
| **500 Internal Server Error** | Unexpected Server Error | Uncaught database or gateway connection exception |

---

# 4. 🔄 State Management & Frontend Lifecycle

---

### **Q18. Why must global cart state be cleared only after payment verification succeeds?**

> **Answer:**  
> The React `CartContext` is the UI's live mirror of the user's shopping basket. Clearing it prematurely on Checkout mount or button click means an abandoned or failed transaction leaves the user with a blank cart.  
> Calling `clearCart()` inside the payment verification `handler` ensures the UI updates to `Cart (0)` at the exact moment the server marks the order `PAID`.

---

### **Q19. What happens if the backend order succeeds but frontend state is not updated?**

> **Answer:**  
> The Navbar would still display `Cart (3)` even though the items have already been purchased and emptied on the server. If the user clicks "Proceed to Checkout" again, the server would reject it with `400 Cart is empty`, confusing the user. Keeping server state and global context synchronized prevents UI drift.

---

### **Q20. Where should the checkout shipping form state live and why?**

> **Answer:**  
> Inside the `Checkout.jsx` component's **local state** (`useState`), not in global `CartContext`.  
> Form inputs (address, city, pincode, field errors) are transient UI states only needed while on `/checkout`. Storing them in global context would unnecessarily pollute the application state.

---

### **Q21. What should happen if a user opens `/checkout` with an empty cart?**

> **Answer:**  
> 1. Display an empty cart friendly state with an icon and a *"Your Cart is Empty"* message.
> 2. Provide a prominent CTA button: *"Browse Products"* (`/products`).
> 3. Block form submission so useless API calls are never made.

---

### **Q22. How do we prevent double-charging on rapid button clicks?**

> **Answer:**  
> 1. Maintain an `isSubmitting` boolean state.
> 2. As soon as the user clicks *"Pay with Razorpay"*, set `isSubmitting = true`.
> 3. Disable the submit button (`disabled={isSubmitting}`) and render an animated spinner.
> 4. Do not re-enable the button until the payment callback finishes or modal is closed.

---

# 5. ⚡ Flashcard Summary: High-Yield Viva Cheatsheet

---

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SHOPKART LAB 06 VIVA SUMMARY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Why snapshot?      → Prevents future product price/name changes from      │
│                         retroactively mutating past invoices.               │
│                                                                             │
│ 2. Why server total?  → Frontend input is untrusted; server recalculates     │
│                         Σ(price × qty) from latest MongoDB product data.    │
│                                                                             │
│ 3. Why verify HMAC?   → Proves the webhook/payload came authentically from  │
│                         Razorpay and wasn't forged via Postman.             │
│                                                                             │
│ 4. When clear cart?   → ONLY AFTER successful HMAC signature verification.   │
│                                                                             │
│ 5. Why paise?         → Eliminates floating-point binary rounding errors    │
│                         (1 INR = 100 paise).                                │
│                                                                             │
│ 6. Prevent IDOR?      → Always query by { _id, user: req.user._id }.        │
│                                                                             │
│ 7. Dual stock check?  → Protects against race conditions between adding to  │
│                         cart and final payment authorization.               │
└─────────────────────────────────────────────────────────────────────────────┘
```

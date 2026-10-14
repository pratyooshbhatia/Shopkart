# 🎤 Viva Questions & Answers — Lab 04 (Wishlist) + Lab 05 (Shopping Cart)

> Covers all expected viva topics for both labs. Each question has a concise, exam-ready answer.

---

## 📚 Lab 04 — Wishlist System

---

### 🗄️ Database & MongoDB Relationships

**Q1. Why are we storing ObjectIds instead of full product objects in the wishlist?**

> The Product collection is the **single source of truth**. Storing only the `ObjectId` reference (not duplicate data) means if a product's price, stock, or image changes, those updates are automatically reflected when the wishlist is fetched — no stale data problem.

---

**Q2. What does `ref: 'Product'` do in the User schema?**

> It tells Mongoose which model the `ObjectId` refers to. This enables Mongoose's `populate()` to automatically replace the stored `ObjectId` with the full matching document from the `Product` collection.

---

**Q3. What is the difference between embedding and referencing in MongoDB?**

| Embedding | Referencing |
|---|---|
| Store related data inside the same document | Store an `ObjectId` pointer to another document |
| Fast reads, no joins needed | Data stays normalized and consistent |
| Good for data that doesn't change often | Good when the related data can update independently |
| Can cause duplication if data is shared | One source of truth |

> For wishlist, we use **referencing** because products can change price/stock.

---

**Q4. Why do we use `populate()`? What does it do?**

> `populate()` is Mongoose's way of replacing an `ObjectId` field with the actual document it points to. For example, `User.findById(id).populate('wishlist')` returns the wishlist as an array of full Product objects instead of raw `ObjectId`s. Under the hood, Mongoose runs a second query to the Product collection and joins the data in memory.

---

**Q5. What is an ObjectId in MongoDB?**

> It is MongoDB's default unique identifier — a 12-byte BSON type, generated automatically as `_id`. It encodes a timestamp, machine ID, process ID, and a counter, making it globally unique. In Mongoose, we reference other documents using `mongoose.Schema.Types.ObjectId`.

---

### 🔐 Backend & API Security

**Q6. Why should wishlist endpoints be protected (authenticated)?**

> A wishlist is user-specific data. Without authentication, any user could read or modify another user's saved products, which is a serious privacy and security violation.

---

**Q7. Why should the server get the user ID from the JWT, not from the request body?**

> The request body is provided by the client and can be forged. A JWT, on the other hand, is signed with a secret key on the server. Only the server can verify its authenticity. Extracting `userId` from the verified JWT payload prevents users from impersonating each other.

---

**Q8. How are duplicate wishlist entries prevented?**

> Before adding, we check whether the `productId` already exists in `user.wishlist` array:
> ```js
> const already = customer.wishlist.some(id => id.toString() === productId);
> if (already) return res.status(409).json({ message: 'Already in wishlist' });
> ```
> We also use HTTP status **409 Conflict** to communicate this semantically correct error.

---

**Q9. What HTTP status code is used for a duplicate wishlist entry, and why?**

> **409 Conflict** — because the request is syntactically valid, but the current state of the resource (the wishlist already contains this product) conflicts with the requested operation.

---

**Q10. What is the purpose of `authMiddleware`?**

> It reads the JWT from the `Authorization: Bearer <token>` header or `HttpOnly` cookie, verifies it with the secret key, finds the corresponding user in the database, and attaches that user to `req.user`. All subsequent handlers can then safely access `req.user` without re-querying the database.

---

### 🖥️ Frontend

**Q11. Why should the Wishlist page fetch data from the backend instead of storing it in localStorage?**

> localStorage is client-only and can be cleared. More importantly, it can drift out of sync if the user logs in from another device. Fetching from the backend means the wishlist is always correct, regardless of how many devices the user uses.

---

**Q12. Why do we need loading, error, and empty states on the Wishlist page?**

> - **Loading**: Tells the user something is happening; prevents a jarring blank screen.
> - **Error**: Informs the user that something went wrong and offers a retry action.
> - **Empty**: Provides context and a call-to-action ("Browse Products") rather than a confusing blank UI.
> All three are essential for production-quality UI.

---

**Q13. Why should the wishlist survive a page refresh?**

> Because it is persisted to MongoDB. On refresh, the frontend makes a fresh API call with the user's session cookie, which re-fetches the same wishlist from the database. Nothing is stored in volatile memory that would be lost on refresh.

---

**Q14. What is the interaction state pattern used for the Wishlist button?**

```
'idle'    → shows ♡ Add to Wishlist  
'loading' → shows ⏳ Saving... (disabled)  
'saved'   → shows ♥ Added to Wishlist (disabled, success colour)  
'error'   → shows error message with retry option
```
> This keeps the user informed at every stage of the API request lifecycle.

---

**Q15. Why should we not accept `userId` from the client for wishlist operations?**

> If the client sends `userId`, an attacker could intercept the request and replace it with any user's ID, gaining full control over another user's wishlist. Using the JWT ensures the server decides the user identity, not the client.

---

## 🛒 Lab 05 — Shopping Cart

---

### 📊 State Management

**Q1. Why does cart state need to be shared globally (Context API / Redux)?**

> The cart is displayed in multiple unrelated places: the **Navbar** (count badge), the **Cart page** (full list + quantity), and the **Product card** ("Add to Cart" button). If each component fetched the cart independently, they could show different data. A global state ensures a **single source of truth**.

---

**Q2. Why should the Navbar not independently fetch the cart?**

> It would result in redundant API calls — the Navbar, Cart page, and Product page would all fire separate requests. This is wasteful and causes inconsistency if the data changes between requests. With shared global state, the cart is fetched once and all components read from the same object.

---

**Q3. What is the difference between server state and frontend state?**

| Server State | Frontend State |
|---|---|
| Lives in MongoDB | Lives in React memory |
| Persists across sessions/devices | Lost on page refresh (unless re-fetched) |
| Example: cart items stored in DB | Example: `loading: true` while API is in flight |
| Must be fetched via API | Managed with `useState`, `useContext`, or Redux |

---

**Q4. What is derived state?**

> Values that are **calculated from existing state** rather than stored separately. In our cart:
> ```js
> subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
> totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
> ```
> We never store `subtotal` in MongoDB because it would become stale if a product price changed.

---

**Q5. Why should subtotal not be stored separately in MongoDB?**

> Product prices can change. If we store `subtotal: 5998` in the cart document and the product price drops, the stored subtotal becomes wrong. By calculating it dynamically from `price × quantity` on every render, we always show the current, accurate price.

---

### 🗄️ Backend

**Q6. Why does the cart need a `quantity` field while the wishlist does not?**

> The wishlist simply records intent ("I want this"). The cart tracks purchasing intent with a specific quantity ("I want 3 of this"). Quantity is purchase-critical information needed for stock validation and total calculation.

---

**Q7. Why should product price not be copied into the cart object?**

> For the same reason as the wishlist — product prices are managed in the Product collection. Copying the price would mean stale data after any price update. The frontend always reads `item.product.price` from the populated product document, ensuring the latest price is used.

---

**Q8. How do you prevent quantity from exceeding stock?**

> In the backend, before saving:
> ```js
> if (quantity > product.stock) {
>   return res.status(400).json({ message: `Only ${product.stock} units available` });
> }
> ```
> The frontend also disables the `[+]` button when `quantity >= product.stock`.

---

**Q9. What happens when the same product is added to the cart twice?**

> Instead of creating a duplicate row, the backend finds the existing cart item and increments its quantity by 1:
> ```js
> if (cartItem) {
>   cartItem.quantity += 1;
> } else {
>   customer.cart.push({ product: productId, quantity: 1 });
> }
> ```

---

**Q10. Why does the server identify the user from the JWT and not the request body?**

> Identical reason to Lab 04 — the JWT is server-signed and tamper-proof. The client body can be modified by the user.

---

### ⚛️ React & Frontend

**Q11. How does the cart count in the Navbar update without refreshing the page?**

> The cart count is derived from `CartContext`. When `addToCart` or `removeFromCart` is called and updates `cartItems` in context state, all components subscribed to the context re-render automatically. The Navbar reads `totalQuantity` which is recalculated from the new `cartItems`.

---

**Q12. How do you update only one cart item's loading state (while not disabling others)?**

> Each `CartItem` component maintains its own local `loading` state. Only the row that triggered the action becomes disabled. The loading state is not stored in global context, which would affect all rows simultaneously.

---

**Q13. What happens if an API mutation fails (e.g., update quantity)?**

> The UI remains in its previous valid state (no optimistic update). An error message is shown to the user. The backend sends the updated cart in every response, so if the operation did fail, the displayed state never changes from what the backend last confirmed.

---

**Q14. Why is one shared cart state better than separate local copies?**

> Multiple copies can go out of sync. If the Navbar and Cart page each maintain their own copy, one might show 3 items while the other shows 2 after a deletion. A single shared state in `CartContext` guarantees all components always display the same data.

---

**Q15. What is `useCallback` and why is it used in CartContext?**

> `useCallback` memoizes a function so it isn't re-created on every render. In `CartContext`, `fetchCart`, `addToCart`, etc. are wrapped in `useCallback` to prevent unnecessary re-renders of child components that receive these functions as props or dependencies in their `useEffect` arrays.

---

**Q16. What is `useContext` and how does it relate to the CartContext?**

> `useContext` is a React hook that lets any child component subscribe to a context value. Our `useCart()` custom hook wraps `useContext(CartContext)` and returns all cart state and actions. Any component that calls `useCart()` will re-render when the cart state changes.

---

**Q17. How does the cart persist after a page refresh?**

> On page load, `App.jsx` calls `fetchCart()` after confirming the user session is valid. This re-fetches the cart from MongoDB and populates the global `CartContext`. Since MongoDB persists the cart even after the browser is closed, the cart is restored correctly after any refresh.

---

## 🧩 Bonus — Common Mistakes to Know About

| Mistake | Why It's Wrong | Correct Approach |
|---|---|---|
| Storing subtotal in MongoDB | Becomes stale on price changes | Calculate dynamically from price × qty |
| Sending `userId` from client | Can be forged — security risk | Always extract from JWT on server |
| Storing full product objects in wishlist/cart | Data duplication + stale data | Store only ObjectId reference |
| Fetching cart in every component | Wasteful API calls, inconsistency | Use shared CartContext |
| Allowing qty below 1 | Invalid cart state | Disable `[-]` at qty = 1, use Remove button |
| No loading/error/empty states | Poor UX, confusing blank screens | Always implement all three UI states |
| Duplicate wishlist entries | Inconsistent data | Check before pushing, return 409 if duplicate |

---

*Good luck on your viva! Build the feature like a product, not just an assignment. — ShopKart Team* 🚀

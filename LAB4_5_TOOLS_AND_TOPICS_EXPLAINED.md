# 🛍️ Tools & Topics Explained — Lab 04 (Wishlist) + Lab 05 (Shopping Cart)

> A detailed reference guide covering every concept, tool, and pattern implemented in Labs 4 and 5 of the ShopKart MERN project.

---

## 📦 Section 1 — MongoDB Document Relationships

### 1.1 Why "Relationships" in a Document Database?

MongoDB is a document database — by default, all related data can be embedded inside a single document. But embedding is not always ideal.

**Two strategies:**

| Strategy | When to Use | Downside |
|---|---|---|
| **Embedding** | Data belongs only to that document, rarely changes, always fetched together | Duplication if shared across documents |
| **Referencing** | Data is shared, can change independently, owned by a separate collection | Requires an extra query (or `populate`) to resolve |

### 1.2 How Wishlist Uses References

The `User` document stores only **Product ObjectIds** in its `wishlist` array — not the full product data:

```js
// In User schema (customer.model.js)
wishlist: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',    // <-- tells Mongoose which model this ID belongs to
  }
]
```

**Stored in MongoDB:**
```json
{
  "_id": "user123",
  "wishlist": ["product_A_id", "product_B_id"]
}
```

**Why this is correct:** If product A's price changes from ₹2,999 to ₹1,999, every user's wishlist automatically shows the new price — no need to update every user document.

### 1.3 How Cart Uses References with Extra Data

The cart needs one more piece of information per product — quantity. So each cart item is a **subdocument** (embedded object) with a reference + extra field:

```js
cart: [
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 }
  }
]
```

This is a hybrid approach: the `product` field is a reference, but `quantity` is embedded because it is **user-specific** (each user has their own quantity per product).

---

## 🔍 Section 2 — Mongoose `populate()`

### What is `populate()`?

`populate()` is Mongoose's method to replace a stored `ObjectId` with the full referenced document. Mongoose runs a **second query** internally and joins the data.

### Wishlist Example

```js
// Without populate — returns raw ObjectIds
const customer = await Customer.findById(userId);
// customer.wishlist = ["64abc123...", "64def456..."]

// With populate — returns full product objects
const customer = await Customer.findById(userId).populate({
  path: 'wishlist',
  select: 'name price category image stock',
});
// customer.wishlist = [
//   { _id: "64abc123", name: "Mechanical Keyboard", price: 2999, ... },
//   { _id: "64def456", name: "Wireless Headphones", price: 4999, ... }
// ]
```

### Cart Example (nested path)

```js
await Customer.findById(userId).populate({
  path: 'cart.product',      // <-- nested path inside the cart subdocument array
  select: 'name price category image stock',
});
```

### Under the Hood

1. Mongoose finds the User document
2. Extracts all `ObjectId` values from the `wishlist` (or `cart.product`) field
3. Runs `db.products.find({ _id: { $in: [...ids] } })`
4. Substitutes each `ObjectId` in the result with the corresponding product document

---

## 🔐 Section 3 — Protected APIs & JWT Authentication

### 3.1 The Auth Middleware Pattern

Every wishlist and cart API is protected using `authMiddleware`:

```
Client Request
      ↓
authMiddleware
  ↓  Check cookie / Authorization header
  ↓  Decode & verify JWT
  ↓  Fetch matching user from DB
  ↓  Attach to req.user
      ↓
Route Handler (can safely use req.user)
```

### 3.2 Why User Identity Comes From JWT, Not Request Body

```js
// ❌ WRONG — client can forge any userId
const { userId } = req.body;

// ✅ CORRECT — server extracts from verified JWT
const userId = req.user._id; // set by authMiddleware
```

### 3.3 HTTP Status Codes Used

| Status | Meaning | When Used |
|---|---|---|
| `200 OK` | Success | Wishlist/cart fetched or updated |
| `201 Created` | Created | (optional for add operations) |
| `400 Bad Request` | Client sent invalid data | Invalid ObjectId, qty < 1, qty > stock |
| `401 Unauthorized` | Not authenticated | No/invalid JWT |
| `404 Not Found` | Resource missing | Product not found, item not in wishlist/cart |
| `409 Conflict` | Duplicate | Product already in wishlist |
| `500 Server Error` | Unexpected error | DB connection issues, etc. |

---

## ⚛️ Section 4 — React Context API (Global Cart State)

### 4.1 Why Global State for Cart?

The cart is consumed in multiple disconnected components:

```
App
├── Navbar          ← needs cart count
├── Products
│   └── ProductCard ← needs "Add to Cart" action
└── Cart            ← needs full cart + quantity controls
```

Without shared state, each component would independently fetch the cart — leading to wasteful API calls and inconsistency (e.g., Navbar shows 2 items, Cart page shows 3).

### 4.2 How React Context API Works

```jsx
// 1. Create the context
const CartContext = createContext(null);

// 2. Create a Provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  // ... actions: addToCart, removeFromCart, updateQuantity, fetchCart

  return (
    <CartContext.Provider value={{ cartItems, addToCart, ... }}>
      {children}
    </CartContext.Provider>
  );
};

// 3. Wrap the app (in main.jsx)
<CartProvider>
  <App />
</CartProvider>

// 4. Consume in any child component
const { cartItems, addToCart } = useCart(); // our custom hook
```

### 4.3 Context vs Props Drilling

| Prop Drilling | Context API |
|---|---|
| Pass data through every intermediate component | Any component in the tree can access it directly |
| Becomes unmanageable with deeply nested trees | Clean, flat API access |
| Good for small, local state | Good for truly global state like auth, cart, theme |

### 4.4 Custom Hook `useCart()`

```js
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
```

The `if (!ctx)` guard catches developer mistakes — if `useCart` is called outside `CartProvider`, it throws a clear error instead of a cryptic undefined access.

---

## 🧮 Section 5 — Derived State & Calculations

### What is Derived State?

Values that are **computed from existing state** — not stored separately. In the cart:

```js
// Calculated in CartContext — NOT stored in MongoDB
const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
const subtotal = cartItems.reduce(
  (sum, item) => sum + item.product.price * item.quantity,
  0
);
```

### Why Not Store Subtotal in the Database?

```
Product A: ₹2,999 → price changes to ₹1,999
Stored subtotal: ₹5,998 (stale)
Calculated subtotal: ₹3,998 (correct)
```

By calculating dynamically, the UI always shows accurate totals based on the current product price.

### Array `.reduce()` Explained

```js
// sum starts at 0
// for each item, add item.quantity to the running sum
const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

// for each item, add (price × qty) to the running sum
const subtotal = cartItems.reduce(
  (sum, item) => sum + item.product.price * item.quantity,
  0
);
```

---

## 🔄 Section 6 — Frontend State Synchronisation

### The Problem

After any cart mutation (add/remove/update), the UI must stay consistent:

```
Navbar shows Cart (3)
Cart page shows 3 items
```

If they read from different sources, they can diverge.

### The Solution

Every backend API returns the **updated cart** in its response:

```json
{
  "success": true,
  "message": "Cart updated",
  "cart": [...]    // <-- complete updated cart
}
```

The CartContext actions (`addToCart`, `updateQuantity`, `removeFromCart`) immediately update `cartItems` from this response. Since both Navbar and Cart page read from the same `CartContext`, they re-render synchronously.

```
User clicks [+] on Cart page
      ↓
PATCH /cart/:productId { quantity: 3 }
      ↓
Backend validates & saves
      ↓
Returns updated cart array
      ↓
CartContext sets cartItems = new array
      ↓
All subscribed components re-render
  ├── Navbar: totalQuantity recalculated
  └── Cart page: new quantity displayed
```

---

## 🎨 Section 7 — UI State Patterns

### The Three Required States

Every data-fetching page must implement three states:

| State | When | UI |
|---|---|---|
| **Loading** | API request in flight | Spinner / "Loading your wishlist…" |
| **Empty** | Request succeeded, no data | Friendly message + call-to-action |
| **Error** | Request failed | Error message + "Try Again" button |

### Per-Button Loading State

Each `CartItem` manages its own loading flag so that clicking `[+]` on one row doesn't disable all other rows:

```jsx
const CartItem = ({ item, onUpdateQty, onRemove }) => {
  const [loading, setLoading] = useState(false); // ← local to this row

  const handleQtyChange = async (newQty) => {
    setLoading(true);
    await onUpdateQty(item.product._id, newQty);
    setLoading(false);
  };

  return <div className={loading ? 'opacity-60 pointer-events-none' : ''}>...</div>;
};
```

### Wishlist Button State Machine

```
idle → loading → saved    (happy path)
idle → loading → error    (API failure)
idle → idle               (already saved → 409 → show "saved")
```

---

## 🛠️ Section 8 — Tools & Libraries Used

### Backend

| Tool | Purpose | Key API |
|---|---|---|
| **Mongoose** | MongoDB ODM | `Schema`, `model()`, `populate()`, `findById()` |
| **mongoose.Schema.Types.ObjectId** | Define reference fields | Used as field type with `ref` |
| **express.Router** | Modular route handling | `router.post/get/delete/patch()` |
| **authMiddleware** | JWT verification + user attachment | Attaches `req.user` |
| **bcryptjs** | Password hashing | `bcrypt.hash()`, `bcrypt.compare()` |
| **jsonwebtoken** | JWT creation & verification | `jwt.sign()`, `jwt.verify()` |
| **mongoose.Types.ObjectId.isValid()** | Validate ObjectId format | Returns `true`/`false` |

### Frontend

| Tool | Purpose | Key API |
|---|---|---|
| **React Context API** | Global state management | `createContext`, `useContext`, `Provider` |
| **useCallback** | Memoize functions to prevent re-renders | `useCallback(() => fn, [deps])` |
| **useEffect** | Side effects (fetch on mount, redirect) | `useEffect(() => {}, [deps])` |
| **useState** | Local component state | Loading, error, wishlist array |
| **axios** | HTTP requests to backend | `api.get/post/delete/patch()` |
| **React Router v6** | Client-side navigation | `<Route>`, `<Link>`, `useNavigate` |
| **Lucide React** | Icon library | `Heart`, `ShoppingCart`, `Trash2`, etc. |
| **Tailwind CSS** | Utility-first CSS | Class-based styling |

---

## 🗂️ Section 9 — Project File Structure (Labs 4 & 5)

### Backend

```
backend/
├── controllers/
│   ├── wishlist.controller.js   ← Lab 04: add, get, remove, toggle
│   └── cart.controller.js       ← Lab 05: add, get, updateQty, remove
├── routes/
│   ├── wishlist.routes.js       ← /wishlist — all protected
│   └── cart.routes.js           ← /cart — all protected
├── models/
│   └── customer.model.js        ← Extended: wishlist + cart fields
├── middlewares/
│   └── auth.middleware.js       ← JWT verification (from Lab 02)
└── index.js                     ← Mounts /wishlist and /cart routes
```

### Frontend

```
frontend/src/
├── context/
│   └── CartContext.jsx          ← Lab 05: global cart state + actions
├── pages/
│   ├── Wishlist.jsx             ← Lab 04: wishlist page
│   └── Cart.jsx                 ← Lab 05: cart page + order summary
├── components/
│   ├── Navbar.jsx               ← Updated: Wishlist + Cart (N) links
│   └── ProductCard.jsx          ← Updated: ♡ Wishlist + Add to Cart buttons
├── services/
│   └── api.js                   ← Extended: wishlistService + cartService
└── App.jsx                      ← Updated: /wishlist and /cart routes
```

---

## 🔌 Section 10 — Complete API Reference

### Lab 04 — Wishlist APIs

| Method | Endpoint | Auth | Purpose | Success | Failure |
|---|---|:---:|---|---|---|
| `POST` | `/wishlist/:productId` | ✅ | Add to wishlist | `200 { success: true }` | 400/404/409 |
| `GET` | `/wishlist` | ✅ | Get wishlist (populated) | `200 { wishlist: [...] }` | 401 |
| `DELETE` | `/wishlist/:productId` | ✅ | Remove from wishlist | `200 { success: true }` | 400/404 |
| `PATCH` | `/wishlist/:productId/toggle` | ✅ | Toggle (add/remove) | `200 { saved: true/false }` | 400/404 |

### Lab 05 — Cart APIs

| Method | Endpoint | Auth | Purpose | Success | Failure |
|---|---|:---:|---|---|---|
| `POST` | `/cart/:productId` | ✅ | Add (or increment qty) | `200 { cart: [...] }` | 400/404 |
| `GET` | `/cart` | ✅ | Get cart (populated) | `200 { cart: [...] }` | 401 |
| `PATCH` | `/cart/:productId` | ✅ | Set exact quantity | `200 { cart: [...] }` | 400/404 |
| `DELETE` | `/cart/:productId` | ✅ | Remove from cart | `200 { cart: [...] }` | 400/404 |

---

## 🚀 Section 11 — Key Design Decisions Explained

### Decision 1: Why return the updated cart from every mutation?

> Returning the updated cart from `POST /cart`, `PATCH /cart/:id`, and `DELETE /cart/:id` means the frontend can sync state in one round trip. If we only returned `{ success: true }`, the frontend would need a second `GET /cart` call to refresh.

### Decision 2: Why use Context API instead of Redux for this project?

> Redux adds significant boilerplate (actions, reducers, thunks). The Context API is built into React, requires no extra dependencies, and is sufficient for a single global feature like a cart. Redux would be preferable for much larger applications with many interdependent slices of state.

### Decision 3: Why check `product.stock` on both frontend and backend?

> **Frontend validation** provides instant user feedback (disables `[+]` button). **Backend validation** is the authoritative check — the client could be manipulated or outdated. Both layers together give the best UX and security.

### Decision 4: Why use `splice` instead of `filter` for removing from wishlist/cart on the backend?

> `user.wishlist.splice(index, 1)` mutates the array in place on the Mongoose document, which is then saved with `user.save()`. Using `.filter` would create a new array, which also works — but `splice` on the Mongoose subdocument array is the more direct Mongoose pattern.

---

*Build the feature like a product, not just an assignment. — ShopKart Team* 🛍️

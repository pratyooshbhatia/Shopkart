# 🎓 ShopKart Labs 1, 2 & 3 — Complete Viva Preparation Guide

This guide covers all possible viva questions for **Lab 01** (Backend Authentication), **Lab 02** (Frontend Authentication & Protected Routes), and **Lab 03** (Product Catalog & Discovery).

Every answer is written in **plain English with crystal-clear real-world analogies**, designed so you can understand it instantly and answer confidently even without memorizing complex jargon.

---

## Table of Contents
1. [General MERN Architecture Questions](#0-general-mern-architecture-questions)
2. [Lab 01 — Backend Customer Authentication (Node, Express, MongoDB, JWT, Cookies)](#1-lab-01--backend-customer-authentication)
3. [Lab 02 — Frontend Authentication Flow (React, React Router, Axios, Protected Routes)](#2-lab-02--frontend-authentication-flow)
4. [Lab 03 — Product Catalog & Discovery (Mongoose Querying, URL Params, Search/Filter)](#3-lab-03--product-catalog--discovery)
5. [Tricky / Curveball Viva Questions & Smart Responses](#4-tricky--curveball-viva-questions)

---

## 0. General MERN Architecture Questions

### Q1: What does MERN stand for, and what role does each piece play in ShopKart?
- **M — MongoDB:** NoSQL database where user accounts and products are permanently saved as documents (JSON-like format).
- **E — Express.js:** Minimal web framework on top of Node.js that organizes API routes (`/customers`, `/products`), parses incoming requests, and runs middlewares.
- **R — React.js:** Frontend user interface running in the user's browser. Makes the app fast and dynamic without reloading pages.
- **N — Node.js:** JavaScript runtime environment that lets us run JavaScript code on the server/machine outside a browser.

### Q2: What is MVC architecture and why did we use it?
- **MVC** stands for **Model - View - Controller**:
  - **Model (`models/`):** Defines the blueprint of data in MongoDB (e.g., fields, types, validations like `customer.model.js`, `product.model.js`).
  - **View:** In traditional apps, this is HTML. In MERN, **React is the View** running on the client machine!
  - **Controller (`controllers/`):** Contains the brains/business logic (e.g., `registerCustomer`, `getAllProducts`). Receives the request from the route, asks the Model for data, and returns a JSON response.
- **Why use it?** **Separation of Concerns**. If our database schema changes, we edit the Model. If our discount logic changes, we edit the Controller. It prevents code from turning into a messy 1000-line single file.

---

## 1. Lab 01 — Backend Customer Authentication

### Q1: Why do we use `bcrypt` instead of encrypting passwords? (Official Lab 1 Viva Question)
- **Encryption is two-way:** If you encrypt something with a key, anyone with that key can decrypt it back into plain text. If a database or secret key leaks, hacker gets all plain-text passwords.
- **Bcrypt is one-way hashing:** Once a password is hashed with bcrypt, it **can never be mathematically reversed** back into plain text.
- **How login works then:** When the user logs in with password `"secret"`, bcrypt hashes `"secret"` using the exact same salt and checks if the new hash matches the stored hash (`bcrypt.compare()`).
- **Bonus detail — Salting:** Bcrypt adds random characters (salt rounds, usually 10) before hashing so two identical passwords (e.g., `"123456"`) produce completely different hash strings.

### Q2: What information is typically stored inside a JWT payload? (Official Lab 1 Viva Question)
- **What is stored:** Non-sensitive user identifiers, typically the user's MongoDB `_id` (`{ id: customer._id }`), token issue time (`iat`), and expiration time (`exp`).
- **What should NEVER be stored:** Passwords, credit card numbers, or sensitive personal data.
- **Why?** The JWT payload is only Base64 encoded, **not encrypted**. Anyone can decode and read it at [jwt.io](https://jwt.io). The signature ensures it wasn't *tampered with*, but it does not hide the contents.

### Q3: Why is the `HttpOnly` flag important for cookies? (Official Lab 1 Viva Question)
- When a cookie has `httpOnly: true`, **client-side JavaScript (e.g., `document.cookie`) cannot access or read it**.
- **Security benefit:** It prevents **XSS (Cross-Site Scripting)** attacks. If a malicious script is injected into your website, it cannot steal the customer's auth token because the browser hides it from JavaScript. The browser will automatically attach the cookie to HTTP requests to the backend, but JS can't touch it.

### Q4: Why should passwords never be returned in any API response? (Official Lab 1 Viva Question)
- Even though the password stored is a bcrypt hash, returning it exposes the hash over the network (visible in browser DevTools Network tab or proxy logs).
- Hackers can run brute-force or dictionary attacks offline against known hashes.
- In `customer.controller.js`, we specifically return `{ _id, fullName, email, phone }` or use Mongoose `.select('-password')`.

### Q5: What is the purpose of authentication middleware? (Official Lab 1 Viva Question)
- A middleware in Express is a gatekeeper function `(req, res, next)` that runs **before** your controller.
- `auth.middleware.js` extracts the cookie/token, verifies its signature with `jwt.verify()`, looks up the user in MongoDB, and attaches them to `req.user`.
- If the token is invalid or missing, it immediately stops the request with `401 Unauthorized` without letting unauthenticated requests touch private controllers.

### Q6: What is the difference between `400`, `401`, `403`, `404`, and `409` HTTP status codes?
- **400 Bad Request:** User sent bad data (e.g., missing phone number, password shorter than 6 characters).
- **401 Unauthorized:** User is not logged in, or token is invalid/expired, or credentials failed.
- **403 Forbidden:** Server knows who you are, but you do not have permission (e.g., a regular customer trying to access an admin dashboard).
- **404 Not Found:** The requested resource/route does not exist.
- **409 Conflict:** Resource already exists (e.g., registering with an email that is already in the database).

### Q7: Why do we return generic "Invalid credentials" instead of saying "Email not found" or "Wrong password"?
- **Security / User Enumeration Prevention:** If we tell an attacker "Email not found", they know that email isn't registered and can keep probing to discover registered accounts. Giving a uniform 401 message tells them nothing about which part was wrong.

---

## 2. Lab 02 — Frontend Authentication Flow

### Q1: Why do we use `withCredentials: true` in Axios? (Official Lab 2 Viva Question)
- By default, modern browsers block cross-origin requests (`http://localhost:5173` frontend to `http://localhost:5000` backend) from automatically sending or receiving cookies due to the Same-Origin Policy.
- Setting `withCredentials: true` tells Axios and the browser: *"Include cookies (like our HttpOnly auth token) with this request and allow the backend to set cookies in my browser."*
- On the backend, CORS must also specify `credentials: true` and a specific `origin` (not `*`).

### Q2: Why can't JavaScript read an HttpOnly cookie? (Official Lab 2 Viva Question)
- Because the browser's security sandbox strictly enforces that cookies marked `HttpOnly` are reserved exclusively for HTTP transport headers.
- Even running `console.log(document.cookie)` will return an empty string or omit the HttpOnly cookie completely. This completely neutralizes token theft via malicious XSS scripts.

### Q3: Why is `/home` called a "Protected Route"? (Official Lab 2 Viva Question)
- Because unauthenticated visitors cannot view its content.
- When `/home` mounts, it calls `GET /customers/me`. If the user has no valid cookie, the backend replies with `401`, and the frontend immediately redirects them to `/login` via React Router (`navigate('/login')`).

### Q4: Why do we fetch `/customers/me` instead of storing the user object manually in `localStorage`? (Official Lab 2 Viva Question)
1. **Single Source of Truth:** `localStorage` data can become stale (e.g., if phone number or name changed elsewhere) or easily tampered with by the user in DevTools.
2. **Security:** Storing auth tokens or sensitive user info in `localStorage` makes it vulnerable to XSS attacks (any JS script can read `localStorage`).
3. **Session validity:** Asking `/customers/me` checks with the server whether the JWT cookie is still valid and not expired.

### Q5: What is the difference between Authentication and Authorization? (Official Lab 2 Viva Question)
- **Authentication (AuthN):** Proving **who you are** (e.g., entering email + password to verify identity).
- **Authorization (AuthZ):** Determining **what permissions you have** (e.g., can this customer delete a product? No, only an admin can).
- *Analogy:* Showing your passport at airport security is **Authentication**. Having a First Class ticket that lets you into the VIP lounge is **Authorization**.

### Q6: What is a "Controlled Component" in React?
- A form input where the input's displayed value is bound to React state (`value={formData.email}`) and changes are handled by React state setters (`onChange={handleChange}`).
- React is the single source of truth for the input's state at every keystroke.

---

## 3. Lab 03 — Product Catalog & Discovery

### Q1: Why should product data come from MongoDB instead of being hardcoded in React? (Official Lab 3 Viva Question)
1. **Dynamic updates:** In a real store, products change constantly (prices update, stock decreases on purchase, new products are launched). You cannot redeploy the entire React frontend every time stock drops from 10 to 9.
2. **Scale:** Storing 10,000 products hardcoded in React bundle increases the file size of the website, crashing browser performance.
3. **Centralized Truth:** Mobile apps, web apps, and inventory systems all need to read the same live data from one centralized database.

### Q2: What is the difference between a URL Parameter and a Query Parameter? (Official Lab 3 Viva Question)
- **URL Parameter (Path parameter):**
  - Used to identify a **specific unique resource**.
  - Example: `/products/:id` $\rightarrow$ `/products/66d123abc456`
  - In React Router, accessed via `useParams()`.
- **Query Parameter:**
  - Used to **filter, sort, search, or paginate** a collection.
  - Starts with `?` and pairs with `&`.
  - Example: `/products?search=keyboard&category=Electronics&sort=price_asc`
  - In Express, accessed via `req.query.search`.

### Q3: When would you use `/products/:id` vs `/products?category=Electronics`? (Official Lab 3 Viva Question)
- Use `/products/:id` when fetching **one exact item** (the Product Details page).
- Use `/products?category=Electronics` when fetching a **list of many items** filtered by a criteria (the Product Catalog page).

### Q4: How does `.map()` help us render products dynamically? (Official Lab 3 Viva Question)
- `.map()` is a standard JavaScript array method that transforms each element of an array into something else.
- In React: `products.map(product => <ProductCard key={product._id} product={product} />)` transforms an array of data objects into an array of React JSX elements that the browser renders on screen.
- The `key` prop tells React which items have changed, been added, or removed, allowing efficient DOM updates.

### Q5: Why do we need Loading, Error, and Empty states in a frontend application? (Official Lab 3 Viva Question)
- **Loading state:** Network calls take time (e.g., 200ms - 2s). Without a spinner/skeleton, the screen looks blank or frozen, making users think the app is broken or click buttons repeatedly.
- **Error state:** If the server is down or Wi-Fi disconnects, the user needs a friendly message ("Something went wrong") and a retry button, rather than a crashed white screen of death.
- **Empty state:** When a search returns 0 results, an explicit message ("No products found matching your search") clarifies that the app worked properly but no data exists.

### Q6: What happens when the backend returns an empty array `[]`? (Official Lab 3 Viva Question)
- The HTTP response status is still `200 OK` (the query succeeded, it just matched 0 items).
- In React, `products.length === 0`, which conditionally displays the Empty State UI component rather than rendering an empty screen.

### Q7: Why should search/filtering be handled by the backend instead of filtering in React? (Official Lab 3 Viva Question)
- **Dataset Size:** If ShopKart has 100,000 products, sending all 100,000 items over the network to the browser will waste hundreds of megabytes of data and crash the customer's phone browser.
- **Database Efficiency:** MongoDB indexes fields (e.g., category, price, name) and can search millions of documents in milliseconds using C++ internal engines before returning just the 20 matched items.

### Q8: Why should API/service logic be separated from UI components into `services/api.js`? (Official Lab 3 Viva Question)
- **Reusability:** Multiple components can call `productService.getAll()` without re-writing Axios code.
- **Maintainability:** If the backend port changes or base URL updates, you update it once in `services/api.js`, instead of hunting down 20 different `.jsx` files.
- **Separation of Concerns:** UI components should only care about *how to look*, not HTTP headers and network configs.

### Q9: How does case-insensitive search work in our backend?
- We use MongoDB's Regular Expression query operator `$regex`:
  ```javascript
  query.name = { $regex: search, $options: 'i' };
  ```
- The `'i'` flag tells MongoDB to treat uppercase and lowercase letters as equal (`"keyboard"`, `"Keyboard"`, and `"KEYBOARD"` all match).

---

## 4. Tricky / Curveball Viva Questions

### Q1: What is Debouncing and why did we use it in the Search input?
- When typing "headphones", a user types 10 letters. If we trigger an API request on every keystroke, we fire **10 network requests** in 1 second!
- **Debouncing** sets a timer (e.g., 400ms). It waits until the user has stopped typing for 400ms before sending the single final request to the backend. This saves server CPU and bandwidth.

### Q2: What is the purpose of `express.json()` and `cookie-parser()`?
- Express doesn't parse JSON or cookies by default. Incoming HTTP data arrives as raw binary streams.
- `express.json()` converts the incoming raw JSON string into a readable JavaScript object available at `req.body`.
- `cookie-parser()` inspects the `Cookie` HTTP request header and parses it into a clean object at `req.cookies`.

### Q3: What is CORS and why did we configure it?
- **CORS** stands for **Cross-Origin Resource Sharing**.
- Browsers block web pages from making AJAX requests to a different domain/port (e.g. `localhost:5173` trying to fetch from `localhost:5000`) unless the server explicitly sends headers allowing it.
- We configure `cors({ origin: 'http://localhost:5173', credentials: true })` so our Express backend explicitly allows our React frontend to communicate with it.

### Q4: In Mongoose, what is the difference between `schema` and `model`?
- **Schema:** The blueprint or definition of the data structure (like an architectural drawing of a house).
- **Model:** A compiled wrapper of the schema that gives us methods to interact with the MongoDB collection (e.g., `Product.find()`, `Product.findById()`, `new Product()`). It is the actual constructor.

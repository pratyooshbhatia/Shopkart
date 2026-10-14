# 📘 ShopKart Technical Concept & Architecture Guide
### *Everything You Need to Know (In Simple, Plain English)*

This document explains every single **tool, library, concept, and pattern** used across **Lab 01, Lab 02, and Lab 03**.

If you haven't studied these deeply before, don't worry! This guide avoids heavy academic jargon and explains everything using **real-life analogies and practical reasons why we used each thing**.

---

## Table of Contents
1. [The Big Picture — How Frontend & Backend Talk](#1-the-big-picture)
2. [Backend Technologies & Tools (Lab 01 & Lab 03)](#2-backend-technologies--tools)
3. [Frontend Technologies & Tools (Lab 02 & Lab 03)](#3-frontend-technologies--tools)
4. [Authentication & Security Concepts (Deep Dive)](#4-authentication--security-concepts)
5. [Product Catalog & Discovery Concepts (Lab 03)](#5-product-catalog--discovery-concepts)
6. [Quick Cheat Sheet: Which File Does What?](#6-quick-cheat-sheet-which-file-does-what)

---

## 1. The Big Picture

### How does our ShopKart application work?
Imagine a restaurant:
1. **Frontend (The Dining Area / Customer Menu - React):**
   - This is what the customer sees. Clean buttons, nice product pictures, prices, and forms.
   - It runs directly inside the customer’s web browser (Chrome, Safari).
2. **API Request (The Waiter - Axios / Fetch):**
   - When the customer clicks "Login" or searches "Keyboard", the waiter takes the order and runs to the kitchen.
3. **Backend Server (The Kitchen / Chef - Node.js + Express):**
   - The chef checks if the request is valid (e.g., "Did they give a password? Is it long enough?").
   - The chef runs business logic (e.g., hashes passwords, creates tokens).
4. **Database (The Pantry / Storage Room - MongoDB):**
   - Where the actual ingredients/data stay permanently. User profiles and products are saved here so they don't disappear when the server restarts.

```
+------------------+         HTTP Requests (JSON)        +------------------+
|  React Frontend  |  <===============================>  | Express Backend  |
| (Port 5173 / UI) |         with HttpOnly Cookies       | (Port 5000 / API)|
+------------------+                                     +--------+---------+
                                                                  |
                                                           Mongoose Queries
                                                                  |
                                                         +--------v---------+
                                                         | MongoDB Database |
                                                         | (Users, Products)|
                                                         +------------------+
```

---

## 2. Backend Technologies & Tools

### 1. Node.js
- **What is it?** JavaScript was originally made to run only inside browsers. Node.js is an engine that allows us to run JavaScript on our computer/server.
- **Why we use it:** We can use one single programming language (JavaScript) for both frontend and backend.

### 2. Express.js
- **What is it?** A lightweight framework for Node.js.
- **Why we use it:** Pure Node.js makes creating URLs and handling HTTP requests tedious and verbose. Express gives us simple functions like `app.get()`, `app.post()`, and middleware support.

### 3. MongoDB & Mongoose
- **MongoDB:** A NoSQL database that stores data in JSON-like records called **documents**, grouped into **collections** (similar to tables in SQL).
- **Mongoose:** An Object Data Modeling (ODM) library for MongoDB.
  - *Why Mongoose?* MongoDB itself is schema-less (you could accidentally save a product without a price). Mongoose lets us define strict rules (Schemas) like `price: { type: Number, required: true, min: 1 }` to keep our database clean and valid.

### 4. `dotenv`
- **What is it?** A small utility that loads secret keys and configuration from a hidden `.env` file into `process.env`.
- **Why we use it:** You never want to hardcode database passwords, JWT secret keys, or port numbers in your GitHub code.

### 5. `cors` (Cross-Origin Resource Sharing)
- **What is it?** An Express middleware that controls which websites are allowed to talk to your backend.
- **Why we use it:** Our frontend runs at `http://localhost:5173` and our backend runs at `http://localhost:5000`. By default, browsers block requests between different ports for security. `cors` tells the browser: *"It's okay! Allow `localhost:5173` to make requests and send cookies."*

### 6. `cookie-parser`
- **What is it?** Middleware that reads incoming cookie headers sent by the browser.
- **Why we use it:** The browser sends cookies as a raw header string. `cookie-parser` turns that string into an easy-to-use JavaScript object at `req.cookies.token`.

---

## 3. Frontend Technologies & Tools

### 1. React.js
- **What is it?** A component-based JavaScript library for building user interfaces.
- **Why we use it:**
  - **Component-driven:** We build small reusable pieces (like `<Navbar />` or `<ProductCard />`) and combine them like Lego blocks.
  - **Reactive State (`useState`):** When data changes (e.g. products arrive from backend), React automatically updates only the parts of the screen that changed, without reloading the whole webpage.

### 2. Vite
- **What is it?** The modern, super-fast build tool and local development server for React.
- **Why we use it:** It replaces older, slow tools like Create React App (CRA). It boots up in milliseconds and provides instant Hot Module Replacement (HMR).

### 3. React Router DOM
- **What is it?** The standard routing library for React applications.
- **Why we use it:** Standard websites reload a whole new HTML page when clicking a link. React is a Single Page Application (SPA). React Router intercepts URL changes (like going from `/login` to `/home` or `/products/123`) and instantly swaps components on screen without any browser page reload!
- **Key tools used:**
  - `<BrowserRouter>`, `<Routes>`, `<Route>`: Map URL paths to components.
  - `useNavigate()`: Hook to programmatically change pages (e.g., redirecting to `/home` after login).
  - `useParams()`: Hook to read dynamic parameters from the URL (e.g., getting the `id` from `/products/:id`).
  - `<Link>`: Replacement for `<a href="...">` that navigates without reloading.

### 4. Axios
- **What is it?** A popular HTTP client library for sending requests to backend APIs.
- **Why we use it over native `fetch`:**
  - Automatic JSON conversion (`response.data` is already parsed).
  - Global base configuration (`baseURL: 'http://localhost:5000'`).
  - Cleaner syntax for sending `withCredentials: true`.
  - Automatic error throwing for HTTP status codes outside the 2xx range (like 401 or 404).

### 5. Tailwind CSS
- **What is it?** A utility-first CSS framework.
- **Why we use it:** Instead of writing custom `.css` files with separate class names, we style elements directly in JSX using short classes (e.g., `flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-md`). It speeds up UI styling and keeps styles consistent.

### 6. Lucide React
- **What is it?** A clean, modern icon library for React.
- **Why we use it:** Provides lightweight icons like `<Search />`, `<ShoppingCart />`, `<Package />`, `<LogOut />`, and `<User />` with consistent stroke width and SVG styling.

---

## 4. Authentication & Security Concepts

### 1. Password Hashing with Bcrypt
- **The Problem:** Storing plain-text passwords (e.g., `"john123"`) in a database is dangerous. If a database is ever compromised, all user passwords are stolen.
- **The Solution:** **One-way cryptographic hashing**.
  - A hash cannot be reversed.
  - **Salt:** Bcrypt generates 10 rounds of random salt characters before hashing.
  - Even if two users choose the password `"password"`, their stored bcrypt hashes in MongoDB look completely different!
- **Verification:** When logging in, `bcrypt.compare(enteredPassword, storedHash)` hashes the entered password with the stored salt and checks if the output matches.

### 2. JSON Web Tokens (JWT)
- **What is a JWT?** A compact, URL-safe digital badge that proves who you are.
- **Structure:** Contains 3 parts separated by dots (`header.payload.signature`):
  1. **Header:** Algorithm used (e.g., `HS256`).
  2. **Payload:** Data stored (we store `{ id: customer._id }`).
  3. **Signature:** Created by combining the header, payload, and a secret server key (`JWT_SECRET`).
- **Why it's secure:** If an attacker tampers with the payload (e.g., changes their user ID to an admin ID), the signature will fail verification on the server.

### 3. HttpOnly Cookies vs LocalStorage
This is one of the most important concepts for your viva:

| Storage Type | Readable by JavaScript? | Vulnerable to XSS? | How it works |
| :--- | :--- | :--- | :--- |
| **LocalStorage** | **YES** (`localStorage.getItem('token')`) | **High Risk** (Any injected JS script can steal the token) | Manually attached to headers by frontend code |
| **HttpOnly Cookie** | **NO** (Browser hides it from JS) | **Protected** (JavaScript cannot read it) | Browser automatically sends it with every request to the server |

- **Our choice:** We set the JWT inside an **HttpOnly cookie**. This guarantees that even if someone injects malicious JavaScript onto the frontend, they cannot steal the user's authentication token!

### 4. Authentication Middleware (`auth.middleware.js`)
- Protects private routes (like `GET /customers/me`).
- It acts as a security guard:
  1. Checks if `req.cookies.token` exists. If not $\rightarrow$ returns `401 Unauthorized`.
  2. Verifies the token using `jwt.verify(token, JWT_SECRET)`. If invalid/expired $\rightarrow$ returns `401`.
  3. Looks up the customer in MongoDB by ID (excluding the password field).
  4. Attaches the customer object to `req.user`.
  5. Calls `next()` to let the request proceed to the actual controller.

---

## 5. Product Catalog & Discovery Concepts (Lab 03)

### 1. Dynamic Data Rendering with `.map()`
- In React, we never write hardcoded HTML cards for each product.
- Instead, the backend returns an array of products:
  ```json
  [
    { "_id": "1", "name": "Keyboard", "price": 2999 },
    { "_id": "2", "name": "Headphones", "price": 4999 }
  ]
  ```
- React loops over this array using `.map()`:
  ```jsx
  {products.map((product) => (
    <ProductCard key={product._id} product={product} />
  ))}
  ```
- If MongoDB has 2 products, 2 cards render. If it has 50 products, 50 cards render automatically.

### 2. URL Parameters vs Query Parameters
- **URL Parameter (`/products/:id`):**
  - Used for **one specific product**.
  - Example: `GET /products/66d123...`
  - In React Router: `<Route path="/products/:id" element={<ProductDetails />} />`
  - Inside the component: `const { id } = useParams();`
- **Query Parameter (`/products?search=...&category=...`):**
  - Used for **filtering, searching, and sorting a list**.
  - Example: `GET /products?search=phone&category=Electronics&sort=price_asc`
  - In Express: Accessed via `req.query.search`, `req.query.category`, `req.query.sort`.

### 3. Dynamic Database Query Building in MongoDB
Instead of writing separate endpoints for searching, filtering, and sorting, our backend builds one smart query object:
```javascript
const query = {};

// If the user typed a search term:
if (search) {
  query.name = { $regex: search, $options: 'i' }; // Case-insensitive regex
}

// If the user selected a category:
if (category) {
  query.category = category;
}

// Execute with sort:
const products = await Product.find(query).sort(sortOption);
```
- If the user selects nothing, `query = {}` $\rightarrow$ returns all products.
- If the user searches "keyboard" in "Electronics", both conditions apply together seamlessly.

### 4. Frontend UI States (The "Big Three")
Any production web app must handle three states during network requests:
1. **Loading State:** Shown while the request is in flight. A spinner tells the user data is on its way.
2. **Error State:** Shown if the server fails or network disconnects. Displays an error banner and a "Try Again" button.
3. **Empty State:** Shown when the API returns 0 items (`products.length === 0`). Informs the user that no products matched their search.

### 5. Debouncing (Search Input)
- If a user types "Mechanical", they press 10 keys in rapid succession.
- Without debouncing, the app would trigger **10 separate API requests** to the server.
- **Debounce:** Uses a `setTimeout` of 400ms. It waits until the user has stopped typing for 400ms before sending a single, final API request.

---

## 6. Quick Cheat Sheet: Which File Does What?

### Backend (`/backend`)
| File | Responsibility |
| :--- | :--- |
| `index.js` | Main server entry point. Configures CORS, JSON parser, cookie parser, mounts routes, and connects to MongoDB. |
| `models/customer.model.js` | Mongoose schema for customers. Validates fields and automatically hashes passwords with bcrypt before saving (`pre('save')`). |
| `models/product.model.js` | Mongoose schema for products. Enforces required fields, price > 0, and stock >= 0. |
| `controllers/customer.controller.js` | Business logic for customer registration, login, logout, getMe, and password change. |
| `controllers/product.controller.js` | Business logic for creating products, listing products with search/filter/sort, and fetching a single product by ID. |
| `routes/customer.routes.js` | Maps endpoints like `/customers/register`, `/login`, `/me` to the customer controller. |
| `routes/product.routes.js` | Maps endpoints like `POST /products`, `GET /products`, `GET /products/:id` to the product controller. |
| `middlewares/auth.middleware.js` | Protects private endpoints by verifying the JWT cookie before granting access. |
| `utils/generateToken.js` | Generates a JWT signed with `JWT_SECRET` and attaches it to an HttpOnly cookie. |

### Frontend (`/frontend`)
| File | Responsibility |
| :--- | :--- |
| `src/main.jsx` | React root entry point that mounts the application into the HTML DOM. |
| `src/App.jsx` | Main router file. Sets up React Router routes (`/register`, `/login`, `/home`, `/products`, `/products/:id`), handles global authentication state. |
| `src/services/api.js` | Centralized Axios instance with `baseURL` and `withCredentials: true`. Exports `customerService` and `productService`. |
| `src/components/Navbar.jsx` | Sticky top navigation bar. Displays logo, navigation links (Home, Products), user name badge, and Logout button. |
| `src/components/ProductCard.jsx` | Reusable card component displaying product image, category badge, stock status, price in INR, and a "View Details" button. |
| `src/pages/Register.jsx` | Registration page with controlled form inputs, client-side validation, and redirect to Login upon success. |
| `src/pages/Login.jsx` | Login page with controlled form inputs, error handling ("Invalid Credentials"), and redirect to Home upon success. |
| `src/pages/Home.jsx` | Protected dashboard page showing logged-in user profile details (Name, Email, Phone) and the Change Password feature. |
| `src/pages/Products.jsx` | Product listing page featuring a debounced search bar, category filter, price sort dropdown, dynamic card grid, and loading/error/empty states. |
| `src/pages/ProductDetails.jsx` | Dynamic product page (`/products/:id`) displaying high-res product photo, detailed specifications, stock counter, and "Add to Cart" button. |

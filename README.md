# ShopKart

ShopKart is a MERN e-commerce application with customer authentication, a product
catalog, wishlists, a shopping cart, checkout, and order history. Checkout
supports Razorpay test payments and an offline test mode.

## Requirements

- Node.js 18 or later and npm
- MongoDB running locally, or a MongoDB connection URI
- Razorpay test credentials to use the live Razorpay test checkout (optional)

## Install

From the project root, install dependencies for both the backend and frontend:

```bash
npm run install:all
```

## Configure

The backend loads settings from `backend/.env`. Create that file if it does not
already exist:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/shopkart
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Optional: configure Razorpay test-mode checkout
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Do not commit real secrets. Without `MONGO_URI`, the backend uses the local
MongoDB default shown above. If MongoDB is unavailable, it attempts to use an
in-memory database.

The frontend defaults to the backend at `http://localhost:5001`. To use a
different API URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001
```

## Run locally

Start the backend and frontend in separate terminals from the project root:

```bash
npm run backend:dev
```

```bash
npm run frontend
```

Open <http://localhost:5173>. The backend health endpoint is available at
<http://localhost:5001/health>.

To load the sample products, start MongoDB and run:

```bash
npm run seed
```

## Tests and production build

```bash
npm test
npm run test:e2e
npm --prefix frontend run build
```

## Main features

- Customer registration, login, logout, and cookie-based authentication
- Product catalog and product details
- Wishlist and cart management
- Checkout and order history
- Razorpay order creation and payment verification

The Express API is in `backend/`; the React/Vite client is in `frontend/`.

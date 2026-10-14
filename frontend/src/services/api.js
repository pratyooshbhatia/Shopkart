import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  withCredentials: true, // Crucial for HttpOnly cookies across origins
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customerService = {
  // Register Customer (Task 1)
  register: async (customerData) => {
    const response = await api.post('/customers/register', customerData);
    return response.data;
  },

  // Login Customer (Task 2)
  login: async (credentials) => {
    const response = await api.post('/customers/login', credentials);
    return response.data;
  },

  // Get Logged-in Customer Profile (Task 3)
  getMe: async () => {
    const response = await api.get('/customers/me');
    return response.data;
  },

  // Logout Customer (Task 4)
  logout: async () => {
    const response = await api.post('/customers/logout');
    return response.data;
  },

  // Bonus: Change Password
  changePassword: async (passwordData) => {
    const response = await api.patch('/customers/change-password', passwordData);
    return response.data;
  },
};

export default api;

// Product Service — Lab 03
export const productService = {
  // Get all products with optional search, category, and sort
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get a single product by ID
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create a new product
  create: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
};

// Wishlist Service — Lab 04
export const wishlistService = {
  // Add a product to the user's wishlist
  add: async (productId) => {
    const response = await api.post(`/wishlist/${productId}`);
    return response.data;
  },

  // Get the authenticated user's full wishlist (populated)
  getAll: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  // Remove a product from the wishlist
  remove: async (productId) => {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data;
  },

  // Bonus: Toggle — adds if absent, removes if present
  toggle: async (productId) => {
    const response = await api.patch(`/wishlist/${productId}/toggle`);
    return response.data;
  },
};

// Cart Service — Lab 05
export const cartService = {
  // Add to cart (creates entry with qty 1, or increments if already present)
  add: async (productId) => {
    const response = await api.post(`/cart/${productId}`);
    return response.data;
  },

  // Get the authenticated user's cart (populated)
  getAll: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Update the quantity of a specific cart item
  updateQuantity: async (productId, quantity) => {
    const response = await api.patch(`/cart/${productId}`, { quantity });
    return response.data;
  },

  // Remove an item from the cart
  remove: async (productId) => {
    const response = await api.delete(`/cart/${productId}`);
    return response.data;
  },
};

// Order Service — Lab 06
export const orderService = {
  // Create pending ShopKart order and Razorpay Order (Paise)
  createPaymentOrder: async (shippingAddress) => {
    const response = await api.post('/orders/create-payment-order', { shippingAddress });
    return response.data;
  },

  // Verify HMAC-SHA256 signature and confirm order as PAID / PLACED
  verifyPayment: async (paymentData) => {
    const response = await api.post('/orders/verify-payment', paymentData);
    return response.data;
  },

  // Get current user's order history
  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Get single order by ID
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Get Razorpay config status
  getRazorpayConfig: async () => {
    const response = await api.get('/orders/razorpay-config');
    return response.data;
  },
};


import React, { createContext, useContext, useState, useCallback } from 'react';
import { cartService } from '../services/api';

// The CartContext provides a single source of truth for cart data
// across all components (Navbar, ProductCard, CartPage, OrderSummary).
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]); // [{ product: {...}, quantity: N }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the full cart from the backend and store it in shared state.
  // Call this on mount (App/CartPage) and after mutations that don't return updated cart.
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.getAll();
      setCartItems(data.cart || []);
    } catch (err) {
      setError('Unable to load your cart. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a product to the cart (or increment its quantity if already present).
  // The backend returns the updated cart — sync it directly without a second request.
  const addToCart = useCallback(async (productId) => {
    try {
      const data = await cartService.add(productId);
      if (data.cart) setCartItems(data.cart);
      return { success: true };
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not add to cart';
      return { success: false, message };
    }
  }, []);

  // Update the quantity of a specific cart item.
  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const data = await cartService.updateQuantity(productId, quantity);
      if (data.cart) setCartItems(data.cart);
      return { success: true };
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not update quantity';
      return { success: false, message };
    }
  }, []);

  // Remove an item from the cart.
  const removeFromCart = useCallback(async (productId) => {
    try {
      const data = await cartService.remove(productId);
      if (data.cart) setCartItems(data.cart);
      return { success: true };
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not remove item';
      return { success: false, message };
    }
  }, []);

  // Clear cart in global state (called after payment verification succeeds)
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Derived values — calculated from cartItems, never stored in MongoDB
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalQuantity,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for consuming cart context — throws if used outside CartProvider
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export default CartContext;

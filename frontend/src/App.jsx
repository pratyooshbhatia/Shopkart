import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import { customerService } from './services/api';
import { useCart } from './context/CartContext';

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const { fetchCart } = useCart();

  // Attempt to restore user session on initial app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const profile = await customerService.getMe();
        setUser(profile);
        // Once we know the user is authenticated, pre-load their cart into global state
        fetchCart();
      } catch (err) {
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest">
        <div className="flex flex-col items-center gap-5 text-linen">
          <span className="w-14 h-14 rounded-full bg-gold text-forest flex items-center justify-center font-serif text-2xl italic animate-pulse">S</span>
          <span className="text-xs uppercase tracking-[0.3em] text-linen/70">Preparing your store</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-graphite">
        <Navbar user={user} setUser={setUser} />
        <div className="lg:pl-64 min-h-screen flex flex-col">
          <main className="flex-1">
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/home" element={<Home user={user} setUser={setUser} />} />
              <Route path="/products" element={<Products user={user} />} />
              <Route path="/products/:id" element={<ProductDetails user={user} />} />
              {/* Lab 04 — Wishlist */}
              <Route path="/wishlist" element={<Wishlist user={user} />} />
              {/* Lab 05 — Cart */}
              <Route path="/cart" element={<Cart user={user} />} />
              {/* Lab 06 — Checkout & Orders */}
              <Route path="/checkout" element={<Checkout user={user} />} />
              <Route path="/order-success/:id" element={<OrderSuccess user={user} />} />
              <Route path="/orders" element={<Orders user={user} />} />
              <Route path="/orders/:id" element={<OrderDetails user={user} />} />
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>
          <footer className="px-5 sm:px-8 lg:px-12 py-6 border-t border-line text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <span><span className="font-serif italic text-forest text-sm">ShopKart</span> — thoughtfully curated essentials</span>
            <span>MongoDB · Express · React · Node.js</span>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

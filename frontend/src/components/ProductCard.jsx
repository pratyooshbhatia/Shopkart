import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Minus, ShoppingBasket } from 'lucide-react';
import { wishlistService } from '../services/api';
import { useCart } from '../context/CartContext';

/**
 * ProductCard — used on the /products page.
 *
 * Props:
 *   product          — the product object
 *   user             — logged-in user (null if not authenticated)
 *   initialWishlisted — boolean: is this product already in the user's wishlist?
 *                       Passed from Products.jsx which fetches wishlist IDs on mount.
 *   onWishlistChange — callback(productId, isSaved) so parent can keep its Set in sync
 */
const ProductCard = ({ product, user, initialWishlisted = false, onWishlistChange }) => {
  const isInStock = product.stock > 0;

  // ── Wishlist state ──────────────────────────────────────────────────────────
  // Initialised from the prop (which comes from a real API fetch in Products.jsx),
  // so it survives page refreshes correctly.
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  // Keep in sync if the parent re-fetches and passes a new prop value
  useEffect(() => {
    setWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  // ── Cart state (from global CartContext) ────────────────────────────────────
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

  // Find this product's current entry in the cart (if any)
  const cartItem = cartItems.find((item) => item.product?._id === product._id);
  const cartQty = cartItem?.quantity || 0;

  // Per-button loading flags for + / - / add actions
  const [cartActionLoading, setCartActionLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  // ── Wishlist Handler ─────────────────────────────────────────────────────────
  const handleWishlistToggle = async () => {
    if (!user) {
      setWishlistError('Please log in first');
      return;
    }
    if (wishlistLoading) return;

    setWishlistLoading(true);
    setWishlistError('');

    try {
      if (wishlisted) {
        // Already saved → remove it
        await wishlistService.remove(product._id);
        setWishlisted(false);
        onWishlistChange?.(product._id, false);
      } else {
        // Not saved → add it (use toggle endpoint to be safe even if already exists)
        await wishlistService.add(product._id);
        setWishlisted(true);
        onWishlistChange?.(product._id, true);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      // 409 means already in wishlist — treat as saved
      if (err?.response?.status === 409) {
        setWishlisted(true);
        onWishlistChange?.(product._id, true);
      } else {
        setWishlistError('Could not update wishlist. Try again.');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  // ── Cart Handlers ────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!user) { setCartError('Please log in first'); return; }
    if (cartActionLoading) return;
    setCartActionLoading(true);
    setCartError('');
    const result = await addToCart(product._id);
    if (!result.success) setCartError(result.message || 'Could not add to cart');
    setCartActionLoading(false);
  };

  const handleIncrease = async () => {
    if (cartActionLoading) return;
    setCartActionLoading(true);
    setCartError('');
    const result = await updateQuantity(product._id, cartQty + 1);
    if (!result.success) setCartError(result.message || 'Could not update quantity');
    setCartActionLoading(false);
  };

  const handleDecrease = async () => {
    if (cartActionLoading) return;
    setCartActionLoading(true);
    setCartError('');
    if (cartQty <= 1) {
      // Remove from cart entirely when quantity would drop to 0
      const result = await removeFromCart(product._id);
      if (!result.success) setCartError(result.message || 'Could not remove item');
    } else {
      const result = await updateQuantity(product._id, cartQty - 1);
      if (!result.success) setCartError(result.message || 'Could not update quantity');
    }
    setCartActionLoading(false);
  };

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/5] rounded-[1.75rem] overflow-hidden bg-forest-soft">
        <Link to={`/products/${product._id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.04]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x500?text=No+Image';
            }}
          />
        </Link>
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          title={wishlisted ? 'Remove from favourites' : 'Add to favourites'}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-clay shadow-soft hover:scale-105 transition cursor-pointer disabled:opacity-60"
        >
          <Heart className={`w-[18px] h-[18px] ${wishlisted ? 'fill-clay' : ''} ${wishlistLoading ? 'animate-pulse' : ''}`} />
        </button>
        {isInStock && product.stock <= 15 && (
          <span className="badge absolute top-4 left-4 bg-white/90 text-clay">Only {product.stock} left</span>
        )}
        {!isInStock && (
          <span className="absolute inset-x-0 bottom-0 bg-graphite/75 text-linen text-center text-[11px] py-2.5 uppercase tracking-[0.25em]">
            Sold out
          </span>
        )}
      </div>

      <div className="pt-4 px-1 flex-1 flex flex-col">
        <p className="kicker">{product.category}</p>
        <Link to={`/products/${product._id}`} className="heading text-lg leading-snug mt-1 line-clamp-1 hover:text-forest-600">
          {product.name}
        </Link>
        <p className="text-sm text-muted line-clamp-2 mt-1 flex-1">{product.description}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-serif text-xl text-forest">₹{product.price.toLocaleString('en-IN')}</span>
          {isInStock ? (
            cartQty === 0 ? (
              <button onClick={handleAddToCart} disabled={cartActionLoading} className="pill-primary px-4 py-2 text-xs">
                <ShoppingBasket className="w-3.5 h-3.5" />
                {cartActionLoading ? 'Adding…' : 'Add to cart'}
              </button>
            ) : (
              <div className={`flex items-center gap-1 rounded-full border border-forest/30 bg-forest-soft p-1 ${cartActionLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                <button
                  onClick={handleDecrease}
                  title={cartQty === 1 ? 'Remove from cart' : 'Decrease quantity'}
                  className="w-7 h-7 rounded-full bg-white text-forest flex items-center justify-center hover:bg-forest hover:text-linen transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-semibold text-forest">{cartQty}</span>
                <button
                  onClick={handleIncrease}
                  disabled={cartQty >= product.stock}
                  title="Increase quantity"
                  className="w-7 h-7 rounded-full bg-white text-forest flex items-center justify-center hover:bg-forest hover:text-linen transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          ) : (
            <span className="text-xs text-muted">Unavailable</span>
          )}
        </div>
        {wishlistError && <p className="err-text">{wishlistError}</p>}
        {cartError && <p className="err-text">{cartError}</p>}
      </div>
    </article>
  );
};

export default ProductCard;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, PackageX, Heart, Plus, Minus, ShoppingBasket, Truck, ShieldCheck, Boxes } from 'lucide-react';
import { productService, wishlistService } from '../services/api';
import { useCart } from '../context/CartContext';

const ProductDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Wishlist state ──────────────────────────────────────────────────────────
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistChecked, setWishlistChecked] = useState(false); // has initial check run?

  // ── Cart state ──────────────────────────────────────────────────────────────
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const [cartActionLoading, setCartActionLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await productService.getById(id);
        setProduct(data.product);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        if (err.response?.status === 404) {
          setError('Product not found.');
        } else if (err.response?.status === 400) {
          setError('Invalid product ID.');
        } else {
          setError('Something went wrong while loading this product.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Check if this product is already in the user's wishlist (runs once after product loads)
  useEffect(() => {
    if (!user || !id || wishlistChecked) return;
    wishlistService.getAll()
      .then((data) => {
        const ids = new Set((data.wishlist || []).map((p) => p._id));
        setWishlisted(ids.has(id));
        setWishlistChecked(true);
      })
      .catch(() => setWishlistChecked(true));
  }, [user, id, wishlistChecked]);

  if (!user) return null;

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-muted tracking-wide">Loading product…</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-clay-soft text-clay mx-auto mb-6 flex items-center justify-center">
            <PackageX className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="heading text-2xl">Product unavailable</h2>
          <p className="text-sm text-muted mt-2 mb-7">{error}</p>
          <Link to="/products" className="pill-primary">Back to collection</Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isInStock = product.stock > 0;

  // Find this product in the cart
  const cartItem = cartItems.find((item) => item.product?._id === product._id);
  const cartQty = cartItem?.quantity || 0;

  // ── Wishlist Handler ─────────────────────────────────────────────────────────
  const handleWishlistToggle = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await wishlistService.remove(product._id);
        setWishlisted(false);
      } else {
        await wishlistService.add(product._id);
        setWishlisted(true);
      }
    } catch (err) {
      if (err?.response?.status === 409) setWishlisted(true);
    } finally {
      setWishlistLoading(false);
    }
  };

  // ── Cart Handlers ────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
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
      const result = await removeFromCart(product._id);
      if (!result.success) setCartError(result.message || 'Could not remove item');
    } else {
      const result = await updateQuantity(product._id, cartQty - 1);
      if (!result.success) setCartError(result.message || 'Could not update');
    }
    setCartActionLoading(false);
  };

  return (
    <div className="page">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to collection
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-forest-soft">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/600x750?text=No+Image';
            }}
          />
        </div>

        <div className="lg:pt-6">
          <p className="kicker">{product.category}</p>
          <h1 className="heading text-4xl sm:text-5xl leading-tight mt-3">{product.name}</h1>

          <div className="flex items-center gap-4 mt-6">
            <span className="font-serif text-3xl text-forest">₹{product.price.toLocaleString('en-IN')}</span>
            <span className={`badge ${isInStock ? 'bg-forest-soft text-forest' : 'bg-clay-soft text-clay'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isInStock ? 'bg-forest' : 'bg-clay'}`} />
              {isInStock ? `In stock · ${product.stock} available` : 'Out of stock'}
            </span>
          </div>

          <p className="text-muted leading-relaxed mt-6">{product.description}</p>

          <div className="flex items-center gap-3 mt-8 pt-8 border-t border-line">
            {isInStock ? (
              cartQty === 0 ? (
                <button onClick={handleAddToCart} disabled={cartActionLoading} className="pill-primary flex-1 py-4">
                  <ShoppingBasket className="w-5 h-5" />
                  {cartActionLoading ? 'Adding…' : 'Add to cart'}
                </button>
              ) : (
                <div className={`flex-1 flex items-center justify-between rounded-full bg-forest text-linen p-1.5 ${cartActionLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                  <button
                    onClick={handleDecrease}
                    title={cartQty === 1 ? 'Remove from cart' : 'Decrease quantity'}
                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm">
                    <span className="font-serif text-xl mr-1">{cartQty}</span> in your cart
                  </span>
                  <button
                    onClick={handleIncrease}
                    disabled={cartQty >= product.stock}
                    title="Increase quantity"
                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )
            ) : (
              <button disabled className="pill-ghost flex-1 py-4">Currently unavailable</button>
            )}

            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              title={wishlisted ? 'Remove from favourites' : 'Add to favourites'}
              className={`w-14 h-14 shrink-0 rounded-full border flex items-center justify-center transition cursor-pointer disabled:opacity-60 ${
                wishlisted ? 'bg-clay border-clay text-white' : 'border-line bg-white text-clay hover:border-clay'
              }`}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-white' : ''} ${wishlistLoading ? 'animate-pulse' : ''}`} />
            </button>
          </div>
          {cartError && <p className="err-text">{cartError}</p>}

          <ul className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3 gap-3 mt-8">
            {[
              { icon: Truck, title: 'Free delivery', body: 'On every order' },
              { icon: ShieldCheck, title: 'Secure payment', body: 'Powered by Razorpay' },
              { icon: Boxes, title: `${product.stock} units`, body: 'Currently in stock' },
            ].map(({ icon: Icon, title, body }) => (
              <li key={body} className="rounded-2xl bg-white border border-line px-4 py-3 flex items-center gap-3">
                <Icon className="w-5 h-5 text-gold shrink-0 stroke-[1.75]" />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-[11px] text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

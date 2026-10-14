import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBasket, Trash2, Plus, Minus, AlertCircle, ArrowRight, ArrowLeft, Truck, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

// One line in the shopping cart table
const CartItem = ({ item, onUpdateQty, onRemove }) => {
  const { product, quantity } = item;
  const [loading, setLoading] = React.useState(false);

  const handleQtyChange = async (newQty) => {
    if (newQty < 1) return; // can't go below 1 — use Remove button instead
    if (newQty > product.stock) return; // respect stock limit
    setLoading(true);
    await onUpdateQty(product._id, newQty);
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    await onRemove(product._id);
    setLoading(false);
  };

  const lineTotal = product.price * quantity;

  return (
    <li className={`grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[1fr_8rem_6.5rem_2.5rem] items-center gap-x-4 gap-y-3 px-5 py-5 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="contents md:flex md:items-center md:gap-4 md:min-w-0">
        <div className="w-20 h-24 shrink-0 rounded-2xl overflow-hidden bg-forest-soft row-span-2 md:row-span-1">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/160x200?text=N/A';
            }}
          />
        </div>
        <div className="min-w-0">
          <p className="kicker">{product.category}</p>
          <h3 className="heading text-base sm:text-lg leading-snug line-clamp-2 mt-0.5">{product.name}</h3>
          <p className="text-xs text-muted mt-1">₹{product.price.toLocaleString('en-IN')} each</p>
        </div>
      </div>

      <div className="col-start-2 md:col-start-auto flex items-center justify-between md:justify-start gap-3">
        <div className="inline-flex items-center rounded-full border border-line bg-linen p-1">
          <button
            onClick={() => handleQtyChange(quantity - 1)}
            disabled={quantity <= 1 || loading}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
          <button
            onClick={() => handleQtyChange(quantity + 1)}
            disabled={quantity >= product.stock || loading}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="md:hidden font-serif text-lg text-forest">₹{lineTotal.toLocaleString('en-IN')}</span>
        <button onClick={handleRemove} disabled={loading} title="Remove" className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-clay-soft hover:text-clay cursor-pointer">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <p className="hidden md:block font-serif text-lg text-forest text-right">₹{lineTotal.toLocaleString('en-IN')}</p>

      <button
        onClick={handleRemove}
        disabled={loading}
        title="Remove"
        className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-muted hover:bg-clay-soft hover:text-clay transition cursor-pointer disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
};

// ── Cart Page ──────────────────────────────────────────────────────────────────
const Cart = ({ user }) => {
  const navigate = useNavigate();
  const { cartItems, loading, error, fetchCart, updateQuantity, removeFromCart, subtotal, totalQuantity } = useCart();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Load cart from backend when page mounts
  useEffect(() => {
    if (user) fetchCart();
  }, [user, fetchCart]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-muted tracking-wide">Loading your cart…</p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-clay-soft text-clay mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="heading text-2xl">Cart could not be loaded</h2>
          <p className="text-sm text-muted mt-2 mb-7">{error}</p>
          <button onClick={fetchCart} className="pill-primary">Try again</button>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-forest-soft text-forest mx-auto mb-6 flex items-center justify-center">
            <ShoppingBasket className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="heading text-2xl">Your cart is empty</h2>
          <p className="text-sm text-muted mt-2 mb-7">Looks like you haven&apos;t added anything yet.</p>
          <Link to="/products" className="pill-primary">Start shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="mb-8">
        <p className="kicker">Step 1 of 2</p>
        <h1 className="heading text-4xl sm:text-5xl mt-3">Shopping cart</h1>
        <p className="text-muted mt-2">
          {totalQuantity} item{totalQuantity !== 1 ? 's' : ''} across {cartItems.length} product{cartItems.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2 min-w-0">
          <div className="panel overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_7rem_9rem_7rem_2.5rem] gap-x-4 px-5 py-3 bg-linen/70 border-b border-line text-[11px] uppercase tracking-[0.18em] text-muted">
              <span>Product</span>
              <span>Quantity</span>
              <span className="text-right">Total</span>
              <span></span>
            </div>
            <ul className="divide-y divide-line">
              {cartItems.map((item) => (
                <CartItem
                  key={item.product._id}
                  item={item}
                  onUpdateQty={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </ul>
          </div>
          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest mt-5">
            <ArrowLeft className="w-4 h-4" /> Continue shopping
          </Link>
        </section>

        <aside className="lg:sticky lg:top-10 rounded-3xl bg-forest text-linen p-6 sm:p-7">
          <h2 className="font-serif text-2xl">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-linen/60">Subtotal ({totalQuantity})</dt><dd>₹{subtotal.toLocaleString('en-IN')}</dd></div>
            <div className="flex justify-between"><dt className="text-linen/60">Shipping</dt><dd className="text-gold">Free</dd></div>
            <div className="flex justify-between"><dt className="text-linen/60">Tax</dt><dd>Included</dd></div>
          </dl>
          <div className="flex justify-between items-baseline mt-6 pt-6 border-t border-white/15">
            <span className="text-sm text-linen/70">Total</span>
            <span className="font-serif text-3xl">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <button className="pill-gold w-full py-3.5 mt-6" onClick={() => navigate('/checkout')}>
            Proceed to checkout <ArrowRight className="w-4 h-4" />
          </button>
          <div className="mt-5 space-y-2 text-xs text-linen/60">
            <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-gold" /> Free delivery on every order</p>
            <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gold" /> Secure checkout with Razorpay</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;

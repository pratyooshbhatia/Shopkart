import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, AlertCircle, ArrowRight } from 'lucide-react';
import { wishlistService } from '../services/api';

// Single row for each saved product on the Favourites page
const WishlistRow = ({ product, onRemove, removing }) => {
  const isInStock = product.stock > 0;
  return (
    <li className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 transition-opacity ${removing ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Link to={`/products/${product._id}`} className="w-20 h-24 shrink-0 rounded-2xl overflow-hidden bg-forest-soft">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/160x200?text=No+Image';
            }}
          />
        </Link>
        <div className="min-w-0">
          <p className="kicker">{product.category}</p>
          <Link to={`/products/${product._id}`} className="heading text-lg leading-snug line-clamp-1 hover:text-forest-600">
            {product.name}
          </Link>
          <p className={`text-xs mt-1 ${isInStock ? 'text-forest' : 'text-clay'}`}>
            {isInStock ? `In stock (${product.stock})` : 'Out of stock'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
        <span className="font-serif text-xl text-forest">₹{product.price.toLocaleString('en-IN')}</span>
        <div className="flex items-center gap-2">
          <Link to={`/products/${product._id}`} className="pill-ghost px-4 py-2 text-xs">
            View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => onRemove(product._id)}
            disabled={removing}
            title="Remove from favourites"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-clay-soft hover:text-clay transition cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );
};

// ── Wishlist Page ──────────────────────────────────────────────────────────────
const Wishlist = ({ user }) => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await wishlistService.getAll();
      setWishlist(data.wishlist || []);
    } catch {
      setError("We couldn't load your wishlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await wishlistService.remove(productId);
      setWishlist((prev) => prev.filter((p) => p._id !== productId));
    } catch {
      alert('Failed to remove product. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-muted tracking-wide">Loading favourites…</p>
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
          <h2 className="heading text-2xl">Something went wrong</h2>
          <p className="text-sm text-muted mt-2 mb-7">{error}</p>
          <button onClick={fetchWishlist} className="pill-primary">Try again</button>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (wishlist.length === 0) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-clay-soft text-clay mx-auto mb-6 flex items-center justify-center">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="heading text-2xl">No favourites yet</h2>
          <p className="text-sm text-muted mt-2 mb-7">Tap the heart on any product to save it here for later.</p>
          <Link to="/products" className="pill-primary">Explore the collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="kicker">Saved items</p>
          <h1 className="heading text-4xl sm:text-5xl mt-3">Favourites</h1>
          <p className="text-muted mt-2">
            {wishlist.length} product{wishlist.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Link to="/products" className="pill-ghost self-start sm:self-auto">Continue shopping</Link>
      </header>

      <ul className="panel divide-y divide-line">
        {wishlist.map((product) => (
          <WishlistRow
            key={product._id}
            product={product}
            onRemove={handleRemove}
            removing={removingId === product._id}
          />
        ))}
      </ul>
    </div>
  );
};

export default Wishlist;

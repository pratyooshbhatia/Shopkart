import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, PackageX, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productService, wishlistService } from '../services/api';

const Products = ({ user }) => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');

  // Wishlist IDs — fetched once so ProductCard knows which items are already saved
  const [wishlistedIds, setWishlistedIds] = useState(new Set());

  // Categories list
  const categories = ['Electronics', 'Fashion', 'Books', 'Home', 'Sports', 'Beauty', 'Toys', 'Food'];

  // Fetch wishlist IDs once when the page loads (only when logged in)
  useEffect(() => {
    if (!user) return;
    wishlistService.getAll()
      .then((data) => {
        const ids = new Set((data.wishlist || []).map((p) => p._id));
        setWishlistedIds(ids);
      })
      .catch(() => {
        // Non-critical — wishlist state will just default to "not saved"
      });
  }, [user]);

  // Callback to add/remove an id from the local wishlistedIds set
  // so toggling on a card stays in sync without a full refetch
  const onWishlistChange = useCallback((productId, isSaved) => {
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (sort) params.sort = sort;

      const data = await productService.getAll(params);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Debounced fetch when search/category/sort changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  if (!user) return null;

  const sortOptions = [
    { value: '', label: 'Featured' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
  ];

  return (
    <div className="page">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <p className="kicker">Shop</p>
          <h1 className="heading text-4xl sm:text-5xl mt-3">The <em className="text-forest">Collection</em></h1>
          <p className="text-muted mt-2">
            {loading ? 'Finding products…' : `Showing ${products.length} piece${products.length !== 1 ? 's' : ''}${category ? ` in ${category}` : ''}`}
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="inp !rounded-full pl-11 pr-10 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-forest cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-52 shrink-0 space-y-8">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Categories</h2>
            <ul className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
              {['', ...categories].map((cat) => (
                <li key={cat || 'all'} className="shrink-0">
                  <button
                    onClick={() => setCategory(cat)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-colors cursor-pointer ${
                      category === cat ? 'bg-forest text-linen' : 'text-graphite/80 hover:bg-white'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${category === cat ? 'bg-gold' : 'bg-line'}`} />
                    {cat || 'All products'}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Sort by</h2>
            <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
              {sortOptions.map((opt) => (
                <label key={opt.value || 'featured'} className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm cursor-pointer hover:bg-white">
                  <input
                    type="radio"
                    name="sort"
                    checked={sort === opt.value}
                    onChange={() => setSort(opt.value)}
                    className="accent-[#1F3B2D]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {(search || category || sort) && (
            <button
              onClick={() => { setSearch(''); setCategory(''); setSort(''); }}
              className="text-sm text-clay hover:underline underline-offset-4 cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </aside>

        <section className="flex-1 min-w-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="spinner"></div>
              <p className="text-sm text-muted">Loading the collection…</p>
            </div>
          )}

          {!loading && error && (
            <div className="panel max-w-md mx-auto p-10 text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-4 text-clay stroke-[1.5]" />
              <p className="heading text-xl">We hit a snag</p>
              <p className="text-sm text-muted mt-1 mb-6">{error}</p>
              <button onClick={fetchProducts} className="pill-primary">Try again</button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="panel max-w-md mx-auto p-10 text-center">
              <PackageX className="w-10 h-10 mx-auto mb-4 text-gold stroke-[1.5]" />
              <p className="heading text-xl">No products found</p>
              <p className="text-sm text-muted mt-1">
                {search || category ? 'Try a different search term or category.' : 'Products will appear here once they are added.'}
              </p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  user={user}
                  initialWishlisted={wishlistedIds.has(product._id)}
                  onWishlistChange={onWishlistChange}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Products;

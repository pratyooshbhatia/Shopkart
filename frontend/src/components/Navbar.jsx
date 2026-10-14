import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Store, Heart, ShoppingBasket, Receipt, LogOut, LogIn, UserPlus } from 'lucide-react';
import { customerService } from '../services/api';
import { useCart } from '../context/CartContext';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalQuantity } = useCart();

  const handleLogout = async () => {
    try {
      await customerService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (setUser) setUser(null);
      navigate('/login');
    }
  };

  const path = location.pathname;
  const links = user
    ? [
        { to: '/home', label: 'Overview', icon: LayoutGrid, active: path === '/home' },
        { to: '/products', label: 'Collection', icon: Store, active: path.startsWith('/products') },
        { to: '/wishlist', label: 'Favourites', icon: Heart, active: path === '/wishlist' },
        { to: '/cart', label: 'Cart', icon: ShoppingBasket, active: path === '/cart' || path === '/checkout', count: totalQuantity },
        { to: '/orders', label: 'My orders', icon: Receipt, active: path.startsWith('/orders') || path.startsWith('/order-success') },
      ]
    : [
        { to: '/login', label: 'Sign in', icon: LogIn, active: path === '/login' },
        { to: '/register', label: 'Create account', icon: UserPlus, active: path === '/register' },
      ];

  const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  const brand = (
    <Link to="/home" className="flex items-center gap-3 shrink-0">
      <span className="w-10 h-10 rounded-full bg-gold text-forest flex items-center justify-center font-serif text-xl italic font-semibold">S</span>
      <span className="leading-none">
        <span className="block font-serif text-xl font-semibold tracking-tight">ShopKart</span>
        <span className="block text-[9px] uppercase tracking-[0.32em] text-linen/50 mt-1">Curated essentials</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-forest text-linen px-5 py-8 z-40">
        {brand}
        <p className="mt-12 mb-3 px-3 text-[10px] uppercase tracking-[0.28em] text-linen/40">
          {user ? 'Menu' : 'Welcome'}
        </p>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon, active, count }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                active ? 'bg-linen text-forest font-semibold' : 'text-linen/75 hover:bg-white/5 hover:text-linen'
              }`}
            >
              <Icon className="w-[18px] h-[18px] stroke-[1.75]" />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${active ? 'bg-forest text-linen' : 'bg-gold text-forest'}`}>
                  {count}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {user ? (
          <div className="mt-auto rounded-2xl bg-white/5 p-3.5 flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-full bg-forest-600 ring-2 ring-gold/60 flex items-center justify-center font-serif text-lg">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-[11px] text-linen/50 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-linen/60 hover:text-linen hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="mt-auto px-3 text-xs text-linen/50 leading-relaxed">
            Sign in to save favourites, fill your cart and track every order.
          </p>
        )}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 bg-forest text-linen">
        <div className="flex items-center justify-between px-4 h-16">
          {brand}
          {user && (
            <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-linen/70 hover:bg-white/10 cursor-pointer">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
        <nav className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-3">
          {links.map(({ to, label, icon: Icon, active, count }) => (
            <Link
              key={to}
              to={to}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
                active ? 'bg-linen text-forest font-semibold' : 'bg-white/5 text-linen/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count > 0 && <span className="ml-0.5 text-[10px] font-bold px-1.5 rounded-full bg-gold text-forest">{count}</span>}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
};

export default Navbar;

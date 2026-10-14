import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, Store, Heart, ShoppingBasket, Receipt, ChevronRight, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { customerService } from '../services/api';
import { useCart } from '../context/CartContext';

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { totalQuantity } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password Change Modal / Form State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ success: '', error: '' });

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await customerService.getMe();
        if (isMounted) {
          setUser(profile);
          setError('');
        }
      } catch (err) {
        console.error('Failed to fetch profile (unauthenticated):', err);
        if (isMounted) {
          setUser(null);
          // If not logged in, automatically redirect to /login (Task 3 requirement)
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ success: '', error: '' });

    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordStatus({ success: '', error: 'Please fill in both password fields' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({ success: '', error: 'New password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await customerService.changePassword(passwordData);
      setPasswordStatus({ success: res.message || 'Password changed successfully!', error: '' });
      setPasswordData({ oldPassword: '', newPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus({ success: '', error: '' });
      }, 2000);
    } catch (err) {
      setPasswordStatus({
        success: '',
        error: err.response?.data?.message || 'Failed to update password',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-muted tracking-wide">Loading your account…</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = user.fullName?.split(' ')[0] || 'there';

  const stats = [
    { label: 'Items in cart', value: totalQuantity, hint: 'Ready for checkout' },
    { label: 'Account status', value: 'Active', hint: 'Verified via JWT' },
    { label: 'Member ID', value: `…${user._id?.slice(-6)}`, hint: 'Your unique customer id' },
  ];

  const actions = [
    { to: '/products', label: 'Explore the collection', note: 'Browse every product in store', icon: Store },
    { to: '/wishlist', label: 'Your favourites', note: 'Products you saved for later', icon: Heart },
    { to: '/cart', label: 'Review your cart', note: `${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} added`, icon: ShoppingBasket },
    { to: '/orders', label: 'Order history', note: 'Payments, receipts & status', icon: Receipt },
  ];

  const security = [
    { title: 'HttpOnly session cookie', body: 'The JWT is kept in an HttpOnly cookie, out of reach of page scripts.' },
    { title: 'Bcrypt password hashing', body: 'Passwords are salted and hashed before being saved to MongoDB.' },
    { title: 'Server-side verification', body: 'Each protected request to /customers/me is checked on the Express server.' },
    { title: 'No password in responses', body: 'Profile data is sent back with the password field excluded.' },
  ];

  return (
    <div className="page">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-line">
        <div>
          <p className="kicker">{today}</p>
          <h1 className="heading text-4xl sm:text-5xl mt-3">
            {greeting}, <em className="text-forest">{firstName}.</em>
          </h1>
          <p className="text-muted mt-3 max-w-lg">
            Here&apos;s a quick look at your ShopKart account. Pick up shopping or manage your profile below.
          </p>
        </div>
        <button onClick={() => navigate('/products')} className="pill-primary self-start md:self-auto">
          Browse collection <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {stats.map((s) => (
          <div key={s.label} className="panel px-6 py-5">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="font-serif text-3xl text-forest mt-1">{s.value}</p>
            <p className="text-[11px] text-muted mt-1">{s.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        <section className="lg:col-span-2 panel p-6 sm:p-7 flex flex-col">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-forest text-linen ring-4 ring-gold/30 flex items-center justify-center font-serif text-2xl">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </span>
            <div className="min-w-0">
              <h2 className="heading text-xl truncate">{user.fullName}</h2>
              <span className="badge bg-forest-soft text-forest mt-1">
                <ShieldCheck className="w-3 h-3" /> Verified customer
              </span>
            </div>
          </div>

          <dl className="mt-6 text-sm">
            {[
              ['Email', user.email],
              ['Phone', user.phone],
              ['Sign-in method', 'JWT · HttpOnly cookie'],
              ['Customer ID', user._id],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3 border-b border-line last:border-0">
                <dt className="text-muted shrink-0">{k}</dt>
                <dd className={`font-medium text-right truncate ${k === 'Customer ID' ? 'font-mono text-xs' : ''}`}>{v}</dd>
              </div>
            ))}
          </dl>

          <button onClick={() => setShowPasswordModal(true)} className="pill-ghost w-full mt-6">
            <KeyRound className="w-4 h-4" /> Change password
          </button>
        </section>

        <div className="lg:col-span-3 space-y-6">
          <section className="panel p-2">
            {actions.map(({ to, label, note, icon: Icon }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left hover:bg-linen transition-colors cursor-pointer group"
              >
                <span className="w-11 h-11 rounded-full bg-gold-soft text-gold flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs text-muted">{note}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-forest group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </section>

          <section className="rounded-3xl bg-forest text-linen p-6 sm:p-7">
            <p className="kicker !text-gold">Security</p>
            <h3 className="font-serif text-2xl mt-2">How we keep your account safe</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
              {security.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-linen/60 leading-relaxed mt-1">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/50 backdrop-blur-sm p-4">
          <div className="panel max-w-md w-full p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kicker">Account</p>
                <h3 className="heading text-2xl mt-1">Change password</h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 rounded-full hover:bg-linen text-muted cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted mt-2 mb-5">Enter your current password and choose a new one (6+ characters).</p>

            {passwordStatus.error && (
              <div className="note-err mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordStatus.error}</span>
              </div>
            )}
            {passwordStatus.success && (
              <div className="note-ok mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordStatus.success}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="lbl">Current password</label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="inp"
                />
              </div>
              <div>
                <label className="lbl">New password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                  className="inp"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="pill-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={passwordLoading} className="pill-primary flex-1">
                  {passwordLoading ? 'Updating…' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Receipt, AlertCircle, ChevronRight, Store } from 'lucide-react';
import { orderService } from '../services/api';

const Orders = ({ user }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getAll();
        if (data.success) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err?.response?.data?.message || 'Failed to load order history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-muted tracking-wide">Loading your orders…</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-clay-soft text-clay mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="heading text-2xl">Orders could not be loaded</h2>
          <p className="text-sm text-muted mt-2 mb-7">{error}</p>
          <button onClick={() => window.location.reload()} className="pill-primary">Try again</button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gold-soft text-gold mx-auto mb-6 flex items-center justify-center">
            <Receipt className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="heading text-2xl">No orders yet</h2>
          <p className="text-sm text-muted mt-2 mb-7">When you place an order it will be listed here.</p>
          <Link to="/products" className="pill-primary"><Store className="w-4 h-4" /> Visit the collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="kicker">Purchases</p>
          <h1 className="heading text-4xl sm:text-5xl mt-3">My orders</h1>
          <p className="text-muted mt-2">{orders.length} order{orders.length > 1 ? 's' : ''} in total</p>
        </div>
        <Link to="/products" className="pill-ghost self-start sm:self-auto">Shop again</Link>
      </header>

      <div className="panel overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.1fr_1fr_1.3fr_1fr_1fr_1.5rem] gap-4 px-6 py-3 bg-linen/70 border-b border-line text-[11px] uppercase tracking-[0.18em] text-muted">
          <span>Order</span>
          <span>Placed on</span>
          <span>Items</span>
          <span>Total</span>
          <span>Status</span>
          <span></span>
        </div>
        <ul className="divide-y divide-line">
          {orders.map((order) => {
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';
            const isPaid = order.paymentStatus === 'PAID';
            const count = order.items?.reduce((n, it) => n + (it.quantity || 0), 0) || 0;

            return (
              <li key={order._id}>
                <Link
                  to={`/orders/${order._id}`}
                  className="grid grid-cols-2 md:grid-cols-[1.1fr_1fr_1.3fr_1fr_1fr_1.5rem] items-center gap-4 px-6 py-5 hover:bg-linen/60 transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-muted md:hidden mt-0.5">{dateStr}</p>
                  </div>
                  <p className="hidden md:block text-sm text-muted">{dateStr}</p>
                  <div className="flex items-center gap-2 order-last md:order-none col-span-2 md:col-span-1">
                    <div className="flex -space-x-3">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <img
                          key={idx}
                          src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                          alt={item.name}
                          title={item.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted">{count} item{count !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="font-serif text-lg text-forest text-right md:text-left">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                  <div className="hidden md:block">
                    <span className={`badge ${isPaid ? 'bg-forest-soft text-forest' : 'bg-gold-soft text-gold'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-forest' : 'bg-gold animate-pulse'}`} />
                      {order.status || 'PENDING'}
                    </span>
                  </div>
                  <ChevronRight className="hidden md:block w-5 h-5 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Orders;

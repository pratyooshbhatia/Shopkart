import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, AlertCircle, Check } from 'lucide-react';
import { orderService } from '../services/api';

const OrderDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getById(id);
        if (data.success) {
          setOrder(data.order);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load order details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="spinner"></div>
        <p className="text-sm text-muted tracking-wide">Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-clay-soft text-clay mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="heading text-2xl">Order not found</h2>
          <p className="text-sm text-muted mt-2 mb-7">{error || 'This order does not exist or you do not have access to it.'}</p>
          <Link to="/orders" className="pill-primary"><ArrowLeft className="w-4 h-4" /> My orders</Link>
        </div>
      </div>
    );
  }

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  const isPaid = order.paymentStatus === 'PAID';

  const steps = [
    { label: 'Order placed', done: true },
    { label: 'Payment confirmed', done: isPaid },
    { label: 'Packed', done: false },
    { label: 'Delivered', done: false },
  ];

  return (
    <div className="page max-w-5xl">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest mb-8">
        <ArrowLeft className="w-4 h-4" /> My orders
      </Link>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="kicker">Order details</p>
          <h1 className="heading text-4xl mt-3">#{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-muted mt-2">Placed on {dateStr}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${isPaid ? 'bg-forest-soft text-forest' : 'bg-gold-soft text-gold'}`}>Payment · {order.paymentStatus}</span>
          <span className="badge bg-forest text-linen">Status · {order.status}</span>
        </div>
      </header>

      <ol className="panel mt-8 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-3">
            <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm ${step.done ? 'bg-forest text-linen' : 'bg-linen text-muted border border-line'}`}>
              {step.done ? <Check className="w-4 h-4" /> : i + 1}
            </span>
            <span className={`text-sm ${step.done ? 'font-medium' : 'text-muted'}`}>{step.label}</span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <section className="md:col-span-2 panel p-6">
          <h2 className="heading text-xl mb-2">Items ({order.items?.length || 0})</h2>
          <ul className="divide-y divide-line">
            {order.items?.map((item, idx) => (
              <li key={idx} className="py-4 flex items-center gap-4">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                  alt={item.name}
                  className="w-16 h-20 object-cover rounded-2xl shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.name}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Qty {item.quantity} · ₹{item.price?.toLocaleString('en-IN')} each
                  </p>
                </div>
                <span className="font-serif text-lg text-forest shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-baseline pt-5 mt-1 border-t border-line">
            <span className="text-muted text-sm">Total paid (free shipping)</span>
            <span className="font-serif text-2xl text-forest">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted mb-3">
              <MapPin className="w-4 h-4 text-gold" /> Delivery address
            </h2>
            {order.shippingAddress ? (
              <div className="text-sm space-y-0.5">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-muted">{order.shippingAddress.addressLine1}</p>
                <p className="text-muted">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                <p className="text-muted pt-1">{order.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">No address recorded</p>
            )}
          </section>

          <section className="panel p-6">
            <h2 className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted mb-3">
              <CreditCard className="w-4 h-4 text-gold" /> Payment
            </h2>
            <dl className="text-sm space-y-3">
              <div><dt className="text-xs text-muted">Method</dt><dd className="font-medium">Razorpay (test)</dd></div>
              <div><dt className="text-xs text-muted">Razorpay order ID</dt><dd className="font-mono text-xs break-all">{order.razorpayOrderId || '—'}</dd></div>
              <div><dt className="text-xs text-muted">Razorpay payment ID</dt><dd className="font-mono text-xs break-all">{order.razorpayPaymentId || '—'}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

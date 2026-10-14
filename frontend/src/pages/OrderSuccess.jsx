import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ArrowRight, Receipt, MapPin } from 'lucide-react';
import { orderService } from '../services/api';

const OrderSuccess = ({ user }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getById(id);
        if (data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Error loading confirmed order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="page max-w-2xl">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto">
          <span className="absolute inset-0 rounded-full bg-gold/25 animate-ping" />
          <span className="relative w-24 h-24 rounded-full bg-forest text-linen ring-8 ring-gold-soft flex items-center justify-center">
            <Check className="w-10 h-10 stroke-[2.5]" />
          </span>
        </div>
        <p className="kicker mt-8">Payment received · test mode</p>
        <h1 className="heading text-4xl sm:text-5xl mt-3">
          Thank you, <em className="text-forest">{firstName}.</em>
        </h1>
        <p className="text-muted mt-3 max-w-md mx-auto">
          Your order is confirmed and is now being prepared. A summary is below.
        </p>
      </div>

      <section className="panel mt-10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-dashed border-line">
          <div>
            <p className="text-xs text-muted">Order number</p>
            <p className="font-mono text-sm font-medium break-all">{id}</p>
          </div>
          <span className="badge bg-forest-soft text-forest">
            <span className="w-1.5 h-1.5 rounded-full bg-forest" />
            {order?.status || 'PLACED'}
          </span>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center"><div className="spinner"></div></div>
        ) : order ? (
          <>
            <ul className="divide-y divide-line">
              {order.items?.map((item, idx) => (
                <li key={idx} className="py-4 flex items-center gap-4">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                    alt={item.name}
                    className="w-12 h-14 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>

            {order.shippingAddress && (
              <div className="rounded-2xl bg-linen p-4 flex gap-3 text-sm mt-2">
                <MapPin className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <p className="font-medium">{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
                  <p className="text-muted">
                    {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-baseline mt-6 pt-5 border-t border-line">
              <span className="font-medium">Amount paid</span>
              <span className="font-serif text-3xl text-forest">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </>
        ) : null}
      </section>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
        <Link to="/orders" className="pill-primary w-full sm:w-auto">
          <Receipt className="w-4 h-4" /> View my orders
        </Link>
        <Link to="/products" className="pill-ghost w-full sm:w-auto">
          Continue shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;

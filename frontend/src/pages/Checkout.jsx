import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowLeft, Lock, ShoppingBasket, CreditCard, CheckCircle2, XCircle, Key, Info, X, ExternalLink, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';

const Checkout = ({ user }) => {
  const navigate = useNavigate();
  const { cartItems, subtotal, totalQuantity, clearCart } = useCart();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Gateway status
  const [gatewayStatus, setGatewayStatus] = useState({ isConfigured: false, keyId: null });
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  // Sandbox simulation modal state
  const [simulationModal, setSimulationModal] = useState({
    isOpen: false,
    orderId: null,
    razorpayOrderId: null,
    amount: 0,
    isProcessing: false,
  });

  useEffect(() => {
    const checkGateway = async () => {
      try {
        const res = await orderService.getRazorpayConfig();
        if (res.success) {
          setGatewayStatus({
            isConfigured: res.isConfigured,
            keyId: res.keyId,
          });
        }
      } catch (err) {
        console.warn('Could not fetch razorpay config:', err);
      }
    };
    checkGateway();
  }, []);

  // Validate form before submitting
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';

    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Valid 10-digit phone number is required';
    }

    if (!formData.addressLine1.trim()) errors.addressLine1 = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';

    const cleanPincode = formData.pincode.trim();
    if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
      errors.pincode = 'Pincode must contain exactly 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError(null);
  };

  // Main Checkout & Payment Trigger
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setServerError('Your cart is empty. Please add items before checking out.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create pending ShopKart order and Razorpay order on backend
      const data = await orderService.createPaymentOrder(formData);
      const { orderId, razorpayOrderId, amount, currency, keyId, isSimulated } = data;

      // Check if this order is in simulated mode or has placeholder keys
      const requiresSimulation = Boolean(
        isSimulated ||
        !razorpayOrderId ||
        razorpayOrderId.startsWith('order_sim_') ||
        !keyId ||
        keyId.includes('ShopKartKey123')
      );

      if (requiresSimulation) {
        // Open the local interactive Razorpay Sandbox modal
        setIsSubmitting(false);
        setSimulationModal({
          isOpen: true,
          orderId,
          razorpayOrderId: razorpayOrderId || `order_sim_${Date.now()}`,
          amount,
          isProcessing: false,
        });
        return;
      }

      // Live Test Mode with real Razorpay credentials
      const isScriptLoaded = await loadRazorpayScript();

      if (!isScriptLoaded || !window.Razorpay) {
        // Fallback if CDN failed
        console.warn('Razorpay SDK script failed to load. Opening sandbox dialog.');
        setIsSubmitting(false);
        setSimulationModal({
          isOpen: true,
          orderId,
          razorpayOrderId,
          amount,
          isProcessing: false,
        });
        return;
      }

      // Step 2: Open official Razorpay Checkout modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'ShopKart',
        description: `Order #${orderId.slice(-6)} Checkout`,
        order_id: razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: user?.email || '',
          contact: formData.phone,
        },
        theme: {
          color: '#1F3B2D',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setServerError('Payment was cancelled. Your cart has been preserved.');
          },
        },
        handler: async function (response) {
          // Step 3: Payment succeeded in modal -> verify signature on backend
          try {
            const verificationPayload = {
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const result = await orderService.verifyPayment(verificationPayload);

            if (result.success) {
              clearCart();
              navigate(`/order-success/${orderId}`);
            } else {
              setServerError(result.message || 'Payment signature verification failed.');
              setIsSubmitting(false);
            }
          } catch (err) {
            setServerError(
              err?.response?.data?.message || 'Failed to verify payment with server. Cart preserved.'
            );
            setIsSubmitting(false);
          }
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setIsSubmitting(false);
          setServerError(
            response.error?.description || 'Payment failed. Please retry with a valid test card.'
          );
        });
        rzp.open();
      } catch (openErr) {
        console.warn('Error launching Razorpay modal:', openErr);
        setIsSubmitting(false);
        setSimulationModal({
          isOpen: true,
          orderId,
          razorpayOrderId,
          amount,
          isProcessing: false,
        });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to initialize checkout. Please retry.';
      setServerError(errMsg);
      setIsSubmitting(false);
    }
  };

  // Complete simulated payment with Success
  const handleSimulatedSuccess = async () => {
    setSimulationModal((prev) => ({ ...prev, isProcessing: true }));
    try {
      const simPayload = {
        orderId: simulationModal.orderId,
        razorpay_order_id: simulationModal.razorpayOrderId,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: 'simulated_test_signature',
      };

      const result = await orderService.verifyPayment(simPayload);
      if (result.success) {
        clearCart();
        setSimulationModal({ isOpen: false, orderId: null, razorpayOrderId: null, amount: 0, isProcessing: false });
        navigate(`/order-success/${simulationModal.orderId}`);
      } else {
        setServerError(result.message || 'Simulation verification failed');
        setSimulationModal((prev) => ({ ...prev, isProcessing: false, isOpen: false }));
      }
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Verification error occurred.');
      setSimulationModal((prev) => ({ ...prev, isProcessing: false, isOpen: false }));
    }
  };

  // Complete simulated payment with Failure
  const handleSimulatedFailure = async () => {
    setSimulationModal((prev) => ({ ...prev, isProcessing: true }));
    try {
      const failPayload = {
        orderId: simulationModal.orderId,
        razorpay_order_id: simulationModal.razorpayOrderId,
        razorpay_payment_id: `pay_failed_${Date.now()}`,
        razorpay_signature: 'invalid_signature_simulation',
      };

      await orderService.verifyPayment(failPayload);
    } catch (err) {
      // Expected to fail signature verification
      setServerError('Simulated Payment Failed / Rejected. Your cart and items have been preserved.');
    } finally {
      setSimulationModal({ isOpen: false, orderId: null, razorpayOrderId: null, amount: 0, isProcessing: false });
    }
  };

  const addressFields = [
    { name: 'fullName', label: 'Full name', placeholder: 'e.g. Aarav Sharma', type: 'text', span: 'sm:col-span-2' },
    { name: 'phone', label: 'Mobile number', placeholder: '10-digit number, e.g. 9876543210', type: 'tel', span: 'sm:col-span-2' },
    { name: 'addressLine1', label: 'House no. & street', placeholder: 'e.g. Flat 4B, 22 MG Road', type: 'text', span: 'sm:col-span-2' },
    { name: 'city', label: 'City', placeholder: 'e.g. Bengaluru', type: 'text' },
    { name: 'state', label: 'State', placeholder: 'e.g. Karnataka', type: 'text' },
    { name: 'pincode', label: 'Pincode', placeholder: '6 digits, e.g. 560001', type: 'text', maxLength: 6 },
  ];

  // If cart is empty, render friendly empty state
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-forest-soft text-forest mx-auto mb-6 flex items-center justify-center">
            <ShoppingBasket className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="heading text-2xl">Nothing to check out</h2>
          <p className="text-sm text-muted mt-2 mb-7">Add a few products to your cart first.</p>
          <Link to="/products" className="pill-primary"><ArrowLeft className="w-4 h-4" /> Back to collection</Link>
        </div>
      </div>
    );
  }

  const sections = [
    { no: '01', title: 'Contact details', note: 'We will use this for delivery updates', fields: addressFields.filter((f) => ['fullName', 'phone'].includes(f.name)) },
    { no: '02', title: 'Shipping address', note: 'Free delivery anywhere in India', fields: addressFields.filter((f) => !['fullName', 'phone'].includes(f.name)) },
  ];

  return (
    <div className="page">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to cart
      </Link>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="kicker">Step 2 of 2</p>
          <h1 className="heading text-4xl sm:text-5xl mt-3">Checkout</h1>
        </div>
        {gatewayStatus.isConfigured ? (
          <span className="badge bg-forest-soft text-forest self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            Razorpay test keys connected ({gatewayStatus.keyId?.slice(0, 12)}…)
          </span>
        ) : (
          <button onClick={() => setShowKeyGuide(true)} className="badge bg-gold-soft text-gold self-start md:self-auto cursor-pointer hover:brightness-95">
            <Sparkles className="w-3 h-3" /> Sandbox payment mode · add live keys
          </button>
        )}
      </header>

      {serverError && (
        <div className="note-err mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handlePlaceOrder} id="checkoutForm" className="lg:col-span-7 space-y-6">
          {sections.map((sec) => (
            <section key={sec.no} className="panel p-6 sm:p-7">
              <div className="flex items-start gap-4 mb-6">
                <span className="font-serif text-3xl text-gold leading-none">{sec.no}</span>
                <div>
                  <h2 className="heading text-xl">{sec.title}</h2>
                  <p className="text-xs text-muted mt-0.5">{sec.note}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sec.fields.map(({ name, label, placeholder, type, maxLength }) => (
                  <div key={name} className={name === 'addressLine1' ? 'sm:col-span-2' : ''}>
                    <label className="lbl">{label}</label>
                    <input
                      type={type}
                      name={name}
                      maxLength={maxLength}
                      value={formData[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={`inp ${formErrors[name] ? 'inp-err' : ''}`}
                    />
                    {formErrors[name] && <p className="err-text">{formErrors[name]}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </form>

        <aside className="lg:col-span-5 lg:sticky lg:top-10 panel p-6 sm:p-7">
          <div className="flex items-baseline justify-between">
            <h2 className="heading text-xl">In your order</h2>
            <span className="text-xs text-muted">{totalQuantity} item{totalQuantity !== 1 ? 's' : ''}</span>
          </div>

          <ul className="mt-5 space-y-4 max-h-64 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <li key={item.product?._id || Math.random()} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={item.product?.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                    alt={item.product?.name || 'Product'}
                    className="w-14 h-16 object-cover rounded-xl"
                  />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-forest text-linen text-[10px] font-semibold flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product?.name}</p>
                  <p className="text-xs text-muted">₹{item.product?.price?.toLocaleString('en-IN')} each</p>
                </div>
                <span className="text-sm font-medium shrink-0">
                  ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 pt-5 border-t border-line space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>₹{subtotal.toLocaleString('en-IN')}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="text-forest font-medium">Free</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Taxes</dt><dd>₹0</dd></div>
          </dl>
          <div className="flex justify-between items-baseline mt-5 pt-5 border-t border-line">
            <span className="font-medium">Total due</span>
            <span className="font-serif text-3xl text-forest">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          <button type="submit" form="checkoutForm" disabled={isSubmitting} className="pill-primary w-full py-4 mt-6">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-linen/30 border-t-linen rounded-full animate-spin" />
                Opening payment…
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Place order &amp; pay ₹{subtotal.toLocaleString('en-IN')}
              </>
            )}
          </button>
          <p className="mt-4 text-[11px] text-muted text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-forest" /> Payments processed by Razorpay (test mode)
          </p>
        </aside>
      </div>

      {/* Razorpay Interactive Sandbox Simulator Modal */}
      {simulationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite/50 backdrop-blur-sm">
          <div className="panel max-w-md w-full overflow-hidden">
            <div className="bg-forest text-linen px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gold text-forest flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg leading-tight">Razorpay Sandbox</h3>
                  <span className="text-xs text-linen/60">Simulated test payment</span>
                </div>
              </div>
              <button
                onClick={() => setSimulationModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-2 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-xs text-muted">Amount to pay</p>
                <p className="font-serif text-4xl text-forest mt-1">
                  ₹{(simulationModal.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted mt-1 font-mono break-all">{simulationModal.razorpayOrderId}</p>
              </div>

              <dl className="rounded-2xl bg-linen p-4 text-xs space-y-2">
                <div className="flex justify-between"><dt className="text-muted">Customer</dt><dd className="font-medium">{formData.fullName}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Phone</dt><dd className="font-medium">{formData.phone}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Environment</dt><dd className="font-medium text-forest">Local test mode</dd></div>
              </dl>

              <p className="text-xs text-muted text-center">
                No live Razorpay keys were found, so this window simulates the payment and signature check locally.
              </p>

              <div className="space-y-2.5">
                <button onClick={handleSimulatedSuccess} disabled={simulationModal.isProcessing} className="pill-primary w-full">
                  {simulationModal.isProcessing ? (
                    <div className="w-4 h-4 border-2 border-linen/30 border-t-linen rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Simulate successful payment
                </button>
                <button onClick={handleSimulatedFailure} disabled={simulationModal.isProcessing} className="pill-ghost w-full !text-clay !border-clay/30 hover:!bg-clay-soft">
                  <XCircle className="w-4 h-4" /> Simulate failed payment
                </button>
              </div>

              <div className="text-center pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    setSimulationModal((prev) => ({ ...prev, isOpen: false }));
                    setShowKeyGuide(true);
                  }}
                  className="text-xs text-forest inline-flex items-center gap-1.5 hover:underline underline-offset-4 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" /> How to enable the real Razorpay checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Key Setup Guidance Modal */}
      {showKeyGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite/50 backdrop-blur-sm">
          <div className="panel max-w-lg w-full p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kicker">Setup guide</p>
                <h3 className="heading text-2xl mt-1">Connect Razorpay test keys</h3>
              </div>
              <button onClick={() => setShowKeyGuide(false)} className="p-2 rounded-full hover:bg-linen text-muted cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="mt-6 space-y-4 text-sm text-graphite/80 max-h-[55vh] overflow-y-auto pr-1">
              {[
                <>
                  Sign in at{' '}
                  <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="text-forest font-medium underline underline-offset-2 inline-flex items-center gap-0.5">
                    dashboard.razorpay.com <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  — test mode is free and needs no KYC.
                </>,
                <>Switch on <strong>Test Mode</strong> from the top bar.</>,
                <>Open <code className="bg-linen px-1.5 py-0.5 rounded text-xs">Account &amp; Settings → API Keys</code> and generate a key.</>,
                <>
                  Add both values to <strong>backend/.env</strong>:
                  <pre className="mt-2 p-3 rounded-xl bg-forest text-gold text-[11px] font-mono whitespace-pre-wrap">RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx{'\n'}RAZORPAY_KEY_SECRET=yyyyyyyyyyyyyyyyyyyyyyyy</pre>
                </>,
                <>
                  Restart the server with <code className="bg-linen px-1.5 py-0.5 rounded text-xs">npm run backend</code> — the real Razorpay window will open at checkout.
                </>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-serif text-gold text-lg leading-none w-6 shrink-0">{i + 1}.</span>
                  <div>{step}</div>
                </li>
              ))}
            </ol>

            <div className="note-ok mt-5 text-xs">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Test card: <code className="font-mono font-semibold">4012 0000 0000 0002</code>, any future expiry (12/28), any CVV (123) and any OTP (1234).
              </span>
            </div>

            <button type="button" onClick={() => setShowKeyGuide(false)} className="pill-primary w-full mt-5">
              Back to checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;

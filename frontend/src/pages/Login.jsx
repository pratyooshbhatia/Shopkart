import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { customerService } from '../services/api';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await customerService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.success) {
        // Fetch current user details to update app state
        try {
          const profile = await customerService.getMe();
          if (setUser) setUser(profile);
        } catch (profileErr) {
          console.warn('Profile fetch after login warning:', profileErr);
        }
        // Navigate to protected home page
        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid Credentials');
      } else {
        setError(err.response?.data?.message || 'Invalid Credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="kicker">Welcome back</p>
          <h1 className="heading text-4xl mt-3">Sign in to <em className="text-forest">ShopKart</em></h1>
          <p className="text-sm text-muted mt-2">Your cart and favourites are waiting for you.</p>
        </div>

        <div className="panel p-6 sm:p-8">
          <div className="grid grid-cols-2 p-1 rounded-full bg-linen mb-7 text-sm">
            <span className="py-2.5 text-center rounded-full bg-white shadow-soft font-medium text-forest">Sign in</span>
            <Link to="/register" className="py-2.5 text-center rounded-full text-muted hover:text-forest transition-colors">Create account</Link>
          </div>

          {successMessage && (
            <div className="note-ok mb-5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="note-err mb-5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="lbl">Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="inp"
              />
            </div>
            <div>
              <label className="lbl">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="inp pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-forest cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="pill-primary w-full">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-linen/30 border-t-linen rounded-full animate-spin"></div>
                  Signing you in…
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-forest" /> Protected with JWT &amp; HttpOnly cookies
        </p>
      </div>
    </div>
  );
};

export default Login;

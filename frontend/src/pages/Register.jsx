import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { customerService } from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors on edit
    if (error) setError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{7,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await customerService.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      });

      if (response.success) {
        // Redirect to Login page with success state
        navigate('/login', {
          state: {
            successMessage: 'Account created successfully! Please log in with your credentials.',
            email: formData.email.trim(),
          },
        });
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const serverMessage = err.response?.data?.message;
      if (err.response?.status === 409) {
        setError('Email already exists. Please log in or use a different email.');
      } else if (err.response?.status === 400) {
        setError(serverMessage || 'Validation failed. Please check all fields.');
      } else {
        setError(serverMessage || 'An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'fullName', label: 'Full name', type: 'text', placeholder: 'Aditi Verma' },
    { name: 'email', label: 'Email address', type: 'email', placeholder: 'name@example.com' },
    { name: 'phone', label: 'Phone number', type: 'tel', placeholder: '98765 43210' },
  ];

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="kicker">Join the store</p>
          <h1 className="heading text-4xl mt-3">Create your <em className="text-forest">account</em></h1>
          <p className="text-sm text-muted mt-2">One account for your cart, favourites and orders.</p>
        </div>

        <div className="panel p-6 sm:p-8">
          <div className="grid grid-cols-2 p-1 rounded-full bg-linen mb-7 text-sm">
            <Link to="/login" className="py-2.5 text-center rounded-full text-muted hover:text-forest transition-colors">Sign in</Link>
            <span className="py-2.5 text-center rounded-full bg-white shadow-soft font-medium text-forest">Create account</span>
          </div>

          {error && (
            <div className="note-err mb-5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="lbl">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={`inp ${fieldErrors[name] ? 'inp-err' : ''}`}
                />
                {fieldErrors[name] && <p className="err-text">{fieldErrors[name]}</p>}
              </div>
            ))}
            <div>
              <label className="lbl">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className={`inp pr-12 ${fieldErrors.password ? 'inp-err' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-forest cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="err-text">{fieldErrors.password}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-muted">Use 6 or more characters.</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="pill-primary w-full !mt-6">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-linen/30 border-t-linen rounded-full animate-spin"></div>
                  Creating account…
                </>
              ) : (
                <>
                  Create account <ArrowRight className="w-4 h-4" />
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

export default Register;

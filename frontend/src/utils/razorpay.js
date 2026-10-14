/**
 * Dynamically loads the official Razorpay Checkout SDK script
 * https://checkout.razorpay.com/v1/checkout.js
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay script from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

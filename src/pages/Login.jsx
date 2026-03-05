
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import authApi from '../api/auth.api';
import { useAuth } from '../contexts/AuthContext';


function Login() {
  const navigate = useNavigate();
  const { loginWithCustomToken, currentUser, loading: authLoading, userRole } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && currentUser && userRole === 'purchase_manager') {
    return <Navigate to="/purchase-manager/dashboard" replace />;
  }

  if (!authLoading && currentUser && userRole === 'vendor') {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Unified login endpoint decides user type
      const payload = {
        email: formData.email,
        password: formData.password,
      };
      
      const { data } = await authApi.login(payload);
      
      if (!data.customToken) {
        throw new Error('No custom token received from server');
      }

      localStorage.removeItem('purchaseManagerUser');
      localStorage.removeItem('vendor');

      if (data.userType === 'purchase_manager') {
        localStorage.setItem('purchaseManagerUser', JSON.stringify(data.purchaseManager));
      } else if (data.userType === 'vendor') {
        localStorage.setItem('vendor', JSON.stringify(data.vendor));
      } else {
        throw new Error('Unknown user type returned by server');
      }

      // Login to Firebase with custom token
      await loginWithCustomToken(data.customToken);

      // Redirect using backend-detected user type
      if (data.userType === 'purchase_manager') {
        navigate('/purchase-manager/dashboard', { replace: true });
      } else {
        navigate('/vendor/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text-light">
              Login
            </h1>
            <p className="text-sm text-text-medium mt-1">
              Access your dashboard
            </p>
          </div>
          <div className="text-2xl">
            🔐
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-text-light mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-text-light placeholder-slate-500 focus:outline-none focus:border-primary-blue"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-text-light mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-text-light placeholder-slate-500 focus:outline-none focus:border-primary-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-indigo text-white rounded-lg hover:bg-indigo-600 font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm text-text-medium">
          <p>
            Don't have a vendor account?{' '}
            <a className="text-text-light font-semibold hover:text-white" href="/vendor/register">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

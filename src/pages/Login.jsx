import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, register, clearError } from '../store/slices/authSlice';
import { fetchSettings } from '../store/slices/settingSlice';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isLogin ? login({ email: form.email, password: form.password }) : register(form);
    const result = await dispatch(action);
    if (!result.error) {
      await dispatch(fetchSettings());
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="bg-navy-900 w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/5 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-white">School Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5 text-sm text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@school.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2.5 text-base font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              dispatch(clearError());
            }}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

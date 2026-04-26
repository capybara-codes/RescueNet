import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, googleLogin, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await googleLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🌿</span>
          <h1 className="text-2xl font-bold text-brand-400 mt-2">RescueNet</h1>
          <p className="text-surface-muted text-sm mt-1 italic">Sustainable Food Rescue Platform</p>
        </div>

        <div className="glass p-8">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Welcome back</h2>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="label">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input"
              />
            </div>
            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-surface-muted">OR</span>
            <span className="flex-1 h-px bg-surface-border" />
          </div>

          <button
            id="google-login"
            onClick={handleGoogle}
            disabled={loading}
            className="btn-secondary w-full justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-surface-muted mt-6">
            No account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Section */}
        <div className="glass p-6 mt-6 border-brand-500/20 bg-brand-500/5">
          <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-4 text-center">
            🚀 Quick Demo Mode
          </h3>
          <p className="text-xs text-surface-muted text-center mb-4">
            No Firebase setup? Try these one-click logins:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'restaurant', icon: '🍽️', label: 'Restaurant' },
              { id: 'ngo',        icon: '🤝', label: 'NGO' },
              { id: 'volunteer',  icon: '🚴', label: 'Volunteer' },
              { id: 'admin',      icon: '🛡️', label: 'Admin' },
            ].map(r => (
              <button
                key={r.id}
                onClick={async () => {
                  setError('');
                  try {
                    await demoLogin(r.id);
                    navigate('/dashboard');
                  } catch (e) { setError(e.message); }
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface/50 border border-surface-border
                           hover:bg-surface-card hover:border-brand-500/40 text-xs text-slate-200 transition-all font-medium"
              >
                <span>{r.icon}</span> {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '', confirm: '', role: 'restaurant' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const ROLES = [
    { id: 'restaurant', title: 'Restaurant / Eatery' },
    { id: 'ngo', title: 'NGO / Shelter' },
    { id: 'volunteer', title: 'Volunteer / Rider' },
    { id: 'college', title: 'College / Mess' },
    { id: 'bakery', title: 'Bakery / Event Hall' }
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form.email, form.password);
      navigate('/onboarding', { state: { role: form.role } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await googleLogin();
      navigate('/onboarding', { state: { role: form.role } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🌿</span>
          <h1 className="text-2xl font-bold text-brand-400 mt-2">RescueNet</h1>
          <p className="text-surface-muted text-sm mt-1 italic">Join the food rescue movement</p>
        </div>

        <div className="glass p-8">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Create your account</h2>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-role" className="label">I am signing up as a...</label>
              <select id="signup-role" name="role" required
                value={form.role} onChange={handleChange}
                className="input cursor-pointer">
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="signup-email" className="label">Email</label>
              <input id="signup-email" name="email" type="email" required
                value={form.email} onChange={handleChange}
                placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label htmlFor="signup-password" className="label">Password</label>
              <input id="signup-password" name="password" type="password" required
                value={form.password} onChange={handleChange}
                placeholder="Min. 6 characters" className="input" />
            </div>
            <div>
              <label htmlFor="signup-confirm" className="label">Confirm Password</label>
              <input id="signup-confirm" name="confirm" type="password" required
                value={form.confirm} onChange={handleChange}
                placeholder="Repeat password" className="input" />
            </div>
            <button id="signup-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-surface-muted">OR</span>
            <span className="flex-1 h-px bg-surface-border" />
          </div>

          <button id="google-signup" onClick={handleGoogle} disabled={loading}
            className="btn-secondary w-full justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-surface-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

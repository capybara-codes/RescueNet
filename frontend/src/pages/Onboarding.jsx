import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const ROLES = [
  {
    id: 'restaurant',
    icon: '🍽️',
    title: 'Restaurant',
    desc: 'Hotels, dhabas, caterers, cloud kitchens',
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400/60',
  },
  {
    id: 'college',
    icon: '🏫',
    title: 'College / Mess',
    desc: 'Cafeterias, hostel messes, canteens',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400/60',
  },
  {
    id: 'bakery',
    icon: '🎂',
    title: 'Bakery / Event Hall',
    desc: 'Bakeries, wedding halls, event venues',
    color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-400/60',
  },
  {
    id: 'ngo',
    icon: '🤝',
    title: 'NGO / Shelter',
    desc: 'Food banks, shelters, community kitchens',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400/60',
  },
  {
    id: 'volunteer',
    icon: '🚴',
    title: 'Volunteer / Rider',
    desc: 'Pickup & delivery volunteers',
    color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400/60',
  },
  {
    id: 'admin',
    icon: '🛡️',
    title: 'Admin',
    desc: 'Platform administration & oversight',
    color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 hover:border-rose-400/60',
  },
];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const location = useLocation();
  const passedRole = location.state?.role || '';
  const [step, setStep]         = useState(passedRole ? 2 : 1); // 1=role, 2=details
  const [role, setRole]         = useState(passedRole);
  const [form, setForm]         = useState({ name: '', organization: '', phone: '', address: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/onboard', {
        uid: user.uid,
        role,
        name: form.name,
        organization: form.organization,
        phone: form.phone,
        address: form.address,
        lat: null,
        lng: null,
      });
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <span className="text-5xl">🌿</span>
          <h1 className="text-2xl font-bold text-brand-400 mt-2">Welcome to RescueNet</h1>
          <p className="text-surface-muted text-sm mt-1">
            {step === 1 ? "Let's set up your account — choose your role" : `Almost done! Tell us about yourself`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-brand-500 w-12' : 'bg-surface-border w-6'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="glass p-6">
            <h2 className="font-semibold text-slate-200 mb-4">I am a…</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  id={`role-${r.id}`}
                  onClick={() => setRole(r.id)}
                  className={`relative p-4 rounded-xl border bg-gradient-to-br text-left transition-all duration-200
                    ${r.color}
                    ${role === r.id ? 'ring-2 ring-brand-400 scale-[1.02]' : ''}
                  `}
                >
                  <span className="text-2xl block mb-1.5">{r.icon}</span>
                  <p className="font-semibold text-slate-100 text-sm">{r.title}</p>
                  <p className="text-xs text-surface-muted mt-0.5 leading-snug">{r.desc}</p>
                  {role === r.id && (
                    <span className="absolute top-2 right-2 text-xs bg-brand-500 rounded-full w-4 h-4 flex items-center justify-center text-white">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              id="onboard-next"
              disabled={!role}
              onClick={() => setStep(2)}
              className="btn-primary w-full justify-center mt-5"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="glass p-6">
            <h2 className="font-semibold text-slate-200 mb-4">
              Your Details{' '}
              <span className="text-surface-muted font-normal text-sm">
                ({ROLES.find(r => r.id === role)?.title})
              </span>
            </h2>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="onboard-name" className="label">Your Name</label>
                  <input id="onboard-name" name="name" required
                    value={form.name} onChange={handleChange}
                    placeholder="Full name" className="input" />
                </div>
                <div>
                  <label htmlFor="onboard-org" className="label">Organization / Venue</label>
                  <input id="onboard-org" name="organization" required
                    value={form.organization} onChange={handleChange}
                    placeholder="Restaurant / NGO name" className="input" />
                </div>
                <div>
                  <label htmlFor="onboard-phone" className="label">Phone (optional)</label>
                  <input id="onboard-phone" name="phone"
                    value={form.phone} onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX" className="input" />
                </div>
                <div>
                  <label htmlFor="onboard-address" className="label">Address</label>
                  <input id="onboard-address" name="address"
                    value={form.address} onChange={handleChange}
                    placeholder="City, State" className="input" />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">
                  ← Back
                </button>
                <button id="onboard-submit" type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading ? 'Setting up…' : '🚀 Launch Dashboard'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

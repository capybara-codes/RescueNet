import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const MOCK_PREDICTION = {
  expected_customers: 87,
  suggested_quantity_kg: 43.5,
  overproduction_warning: false,
  warning_level: 'info',
  tip: 'High demand expected — ensure you have enough stock!',
};

const MOCK_TREND = [
  { day: 'Mon', kg: 12 }, { day: 'Tue', kg: 18 }, { day: 'Wed', kg: 9 },
  { day: 'Thu', kg: 24 }, { day: 'Fri', kg: 31 }, { day: 'Sat', kg: 15 }, { day: 'Sun', kg: 8 },
];

const BADGES_META = {
  first_rescue:  { icon: '🌱', name: 'First Rescue' },
  green_starter: { icon: '🌿', name: 'Green Starter' },
  food_hero:     { icon: '🦸', name: 'Food Hero' },
  eco_warrior:   { icon: '⚡', name: 'Eco Warrior' },
  rescue_legend: { icon: '🏆', name: 'Rescue Legend' },
};

export default function RestaurantDashboard() {
  const { profile } = useAuth();
  const [donations, setDonations] = useState([]);
  const [prediction, setPrediction] = useState(MOCK_PREDICTION);
  const [loadingPred, setLoadingPred] = useState(false);

  useEffect(() => {
    api.get('/donations/mine').then(r => setDonations(r.data)).catch(() => {});
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    setLoadingPred(true);
    const now = new Date();
    try {
      const r = await api.post('/ai/predict', {
        day_of_week: now.getDay() === 0 ? 6 : now.getDay() - 1,
        hour_of_day: now.getHours(),
        avg_past_customers: 80,
        special_event: false,
      });
      setPrediction(r.data);
    } catch {
      // keep mock
    } finally {
      setLoadingPred(false);
    }
  };

  const rewards = profile?.rewards || {};
  const points  = rewards.points || 0;
  const badges  = rewards.badges || [];
  const streak  = rewards.streak || 0;

  // Progress to next badge
  const allThresholds = [10, 50, 150, 300, 600];
  const nextThreshold = allThresholds.find(t => t > points) || 600;
  const prevThreshold = allThresholds[allThresholds.indexOf(nextThreshold) - 1] || 0;
  const progress = Math.min(100, ((points - prevThreshold) / (nextThreshold - prevThreshold)) * 100);

  const todayDonations = donations.filter(d => {
    const today = new Date().toDateString();
    return new Date(d.created_at).toDateString() === today;
  });
  const totalKg = donations.filter(d => d.status === 'delivered')
    .reduce((s, d) => s + (d.quantity_kg || 0), 0);

  const warningLevel = prediction.warning_level;
  const warnCls = {
    warning: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    info:    'border-brand-500/40 bg-brand-500/10 text-brand-300',
    ok:      'border-teal-500/40 bg-teal-500/10 text-teal-300',
  }[warningLevel] || '';

  return (
    <DashboardLayout>
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🍱" label="Today's Donations" value={todayDonations.length} sub="listings" color="brand" />
        <StatCard icon="⚖️" label="Total KG Saved" value={`${totalKg.toFixed(1)} kg`} sub="delivered" color="teal" />
        <StatCard icon="🏆" label="Reward Points" value={points} sub={`${streak > 0 ? `🔥 ${streak}-day streak` : 'Keep going!'}`} color="amber" />
        <StatCard icon="📦" label="All Donations" value={donations.length} sub="lifetime" color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Predict widget */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-100">🤖 AI Demand Forecast</h3>
              <button onClick={fetchPrediction} disabled={loadingPred}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                {loadingPred ? 'Updating…' : '↻ Refresh'}
              </button>
            </div>

            {prediction.overproduction_warning && warningLevel === 'warning' && (
              <div className={`rounded-xl border px-4 py-3 text-sm mb-4 ${warnCls}`}>
                ⚠️ <strong>Surplus Risk:</strong> {prediction.tip}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-surface/60 rounded-xl">
                <p className="text-2xl font-bold text-brand-400">{prediction.expected_customers}</p>
                <p className="text-xs text-surface-muted mt-1">Expected Customers</p>
              </div>
              <div className="text-center p-3 bg-surface/60 rounded-xl">
                <p className="text-2xl font-bold text-teal-400">{prediction.suggested_quantity_kg} kg</p>
                <p className="text-xs text-surface-muted mt-1">Suggested Prep</p>
              </div>
              <div className={`text-center p-3 rounded-xl ${warnCls || 'bg-surface/60'}`}>
                <p className="text-2xl font-bold capitalize">{warningLevel}</p>
                <p className="text-xs mt-1 opacity-80">Status</p>
              </div>
            </div>

            <p className="text-xs text-surface-muted italic border-t border-surface-border pt-3">{prediction.tip}</p>
          </div>

          {/* Donation trend */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-100 mb-4">📈 Weekly Donations (kg)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={MOCK_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                  labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#22c55e' }} />
                <Area type="monotone" dataKey="kg" stroke="#22c55e" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column — rewards + quick actions */}
        <div className="space-y-4">
          {/* Donate button */}
          <Link to="/donate" id="quick-donate"
            className="btn-primary w-full justify-center py-4 text-base shadow-glow glow-ring">
            🍱 Donate Surplus Food
          </Link>

          {/* Rewards card */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-100 mb-3">🏆 Your Rewards</h3>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold text-brand-400">{points}</span>
              <span className="text-surface-muted text-sm pb-0.5">points</span>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-surface-muted mb-1">
                <span>{prevThreshold} pts</span><span>{nextThreshold} pts</span>
              </div>
              <div className="h-2 bg-surface-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-teal-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-surface-muted mt-1">{Math.round(progress)}% to next badge</p>
            </div>

            {/* Badges */}
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <span key={b} title={BADGES_META[b]?.name || b}
                    className="w-9 h-9 flex items-center justify-center bg-surface/60 rounded-xl text-xl border border-surface-border">
                    {BADGES_META[b]?.icon || '🎖️'}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-surface-muted">Donate food to earn your first badge!</p>
            )}
          </div>

          {/* Recent donations */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-100 mb-3">📋 Recent Donations</h3>
            {donations.length === 0 ? (
              <p className="text-xs text-surface-muted">No donations yet.</p>
            ) : (
              <ul className="space-y-2">
                {donations.slice(0, 4).map(d => (
                  <li key={d.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[120px]">{d.food_type}</span>
                    <span className={`capitalize px-2 py-0.5 rounded-full font-medium
                      ${d.status === 'delivered' ? 'bg-teal-500/20 text-teal-400' :
                        d.status === 'available' ? 'bg-brand-500/20 text-brand-400' :
                        'bg-slate-500/20 text-slate-400'}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/my-donations" className="text-xs text-brand-400 hover:text-brand-300 mt-3 block transition-colors">
              View all →
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

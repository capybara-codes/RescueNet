import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/StatCard';
import api from '../api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#0d9488', '#8b5cf6', '#f59e0b', '#f43f5e'];

export default function ImpactDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/impact/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Impact Dashboard" subtitle="Platform-wide environmental & social metrics">
        <div className="flex items-center justify-center h-60">
          <p className="text-surface-muted animate-pulse">Computing impact…</p>
        </div>
      </DashboardLayout>
    );
  }

  const s = stats || {
    total_donations: 142, completed_deliveries: 89, kg_food_saved: 1248.5,
    meals_rescued: 3121, co2_reduced_kg: 3121.3, active_donors: 34,
    active_volunteers: 21, active_ngos: 12, total_users: 87,
    weekly_trend: [
      { day:'Mon',kg:82 },{ day:'Tue',kg:110 },{ day:'Wed',kg:95 },
      { day:'Thu',kg:135 },{ day:'Fri',kg:160 },{ day:'Sat',kg:210 },{ day:'Sun',kg:180 },
    ],
  };

  const roleData = [
    { name: 'Donors', value: s.active_donors },
    { name: 'Volunteers', value: s.active_volunteers },
    { name: 'NGOs', value: s.active_ngos },
  ];

  return (
    <DashboardLayout title="Impact Dashboard" subtitle="Platform-wide environmental & social metrics">
      {/* Hero impact numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon="🍱" label="Meals Rescued"      value={s.meals_rescued.toLocaleString()}                color="brand"  />
        <StatCard icon="⚖️" label="Food Saved"         value={`${s.kg_food_saved.toFixed(0)} kg`}              color="teal"   />
        <StatCard icon="🌍" label="CO₂ Reduced"        value={`${s.co2_reduced_kg.toFixed(0)} kg`}             color="cyan"   />
        <StatCard icon="📦" label="Deliveries Done"    value={s.completed_deliveries}                           color="purple" />
        <StatCard icon="👥" label="Active Users"       value={s.total_users}                                    color="amber"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly trend */}
        <div className="lg:col-span-2 glass p-5">
          <h3 className="font-semibold text-slate-100 mb-4">📈 Weekly Food Rescued (kg)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={s.weekly_trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="impactGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day"   tick={{ fill:'#64748b',fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis               tick={{ fill:'#64748b',fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12 }}
                labelStyle={{ color:'#94a3b8' }} itemStyle={{ color:'#22c55e' }} />
              <Area type="monotone" dataKey="kg" stroke="#22c55e" strokeWidth={2} fill="url(#impactGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Role breakdown pie */}
        <div className="glass p-5">
          <h3 className="font-semibold text-slate-100 mb-4">👥 Community Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}>
                {roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12 }}
                itemStyle={{ color:'#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* CO2 bar */}
        <div className="lg:col-span-2 glass p-5">
          <h3 className="font-semibold text-slate-100 mb-4">🌍 CO₂ Avoided This Week (kg)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={s.weekly_trend.map(d => ({ day: d.day, co2: +(d.kg * 2.5).toFixed(1) }))}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" tick={{ fill:'#64748b',fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis             tick={{ fill:'#64748b',fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12 }}
                itemStyle={{ color:'#0d9488' }} />
              <Bar dataKey="co2" radius={[6,6,0,0]} fill="#0d9488" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick facts */}
        <div className="glass p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-slate-100">🌱 Platform Facts</h3>
          {[
            ['Total Donations Listed', s.total_donations],
            ['Successful Deliveries',  s.completed_deliveries],
            ['Active Food Donors',     s.active_donors],
            ['Active Volunteers',      s.active_volunteers],
            ['Partner NGOs',           s.active_ngos],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-surface-muted">{label}</span>
              <span className="text-sm font-bold text-slate-200">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

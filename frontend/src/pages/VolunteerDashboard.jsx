import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/StatCard';
import DonationCard from '../components/DonationCard';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const BADGES_META = {
  first_rescue:  { icon: '🌱', name: 'First Rescue',   desc: '10 pts' },
  green_starter: { icon: '🌿', name: 'Green Starter',   desc: '50 pts' },
  food_hero:     { icon: '🦸', name: 'Food Hero',       desc: '150 pts' },
  eco_warrior:   { icon: '⚡', name: 'Eco Warrior',     desc: '300 pts' },
  rescue_legend: { icon: '🏆', name: 'Rescue Legend',   desc: '600 pts' },
};

export default function VolunteerDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [missions,    setMissions]    = useState([]);
  const [myMissions,  setMyMissions]  = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tab,         setTab]         = useState('missions');
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, my, lb] = await Promise.all([
        api.get('/volunteer/missions'),
        api.get('/volunteer/my-missions'),
        api.get('/volunteer/leaderboard'),
      ]);
      setMissions(m.data);
      setMyMissions(my.data);
      setLeaderboard(lb.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAccept = async (id) => {
    try { await api.post(`/volunteer/accept/${id}`); notify('✅ Mission accepted!'); fetchAll(); refreshProfile(); }
    catch (e) { notify(`❌ ${e.message}`); }
  };

  const handlePickup = async (id) => {
    try { await api.post(`/volunteer/pickup/${id}`); notify('📦 Marked as picked up! +15 pts'); fetchAll(); refreshProfile(); }
    catch (e) { notify(`❌ ${e.message}`); }
  };

  const handleDeliver = async (id) => {
    try { await api.post(`/volunteer/deliver/${id}`); notify('🎉 Delivered! +25 pts'); fetchAll(); refreshProfile(); }
    catch (e) { notify(`❌ ${e.message}`); }
  };

  const rewards = profile?.rewards || {};
  const points  = rewards.points || 0;
  const badges  = rewards.badges || [];
  const streak  = rewards.streak || 0;
  const active  = myMissions.filter(m => !['delivered','expired'].includes(m.status));
  const done    = myMissions.filter(m => m.status === 'delivered');

  return (
    <DashboardLayout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🚴" label="Available Missions" value={missions.length}  color="brand"  />
        <StatCard icon="📦" label="Active Pickups"     value={active.length}    color="purple" />
        <StatCard icon="✅" label="Deliveries Done"   value={done.length}      color="teal"   />
        <StatCard icon="🏆" label="Your Points"        value={`${points} pts`}  sub={streak > 0 ? `🔥 ${streak}-day streak` : ''} color="amber" />
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['missions','🚴 Available'],['my-missions','📋 My Pickups'],['leaderboard','🥇 Leaderboard'],['badges','🏅 Badges'],['sponsor','💰 Sponsor & Donate']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`text-sm px-4 py-2 rounded-xl font-medium border transition-all
              ${tab === id ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'text-surface-muted border-surface-border hover:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && tab !== 'leaderboard' && tab !== 'badges' ? (
        <p className="text-surface-muted animate-pulse">Loading…</p>
      ) : (
        <>
          {/* Available missions */}
          {tab === 'missions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {missions.length === 0 ? (
                <div className="col-span-full flex flex-col items-center h-48 justify-center gap-3">
                  <span className="text-4xl">📭</span>
                  <p className="text-surface-muted text-sm">No missions available right now.</p>
                </div>
              ) : missions.map(d => (
                <DonationCard key={d.id} donation={d} actions={
                  <button id={`vol-accept-${d.id}`} onClick={() => handleAccept(d.id)} className="btn-primary flex-1 justify-center text-xs py-2">
                    🚴 Accept Mission
                  </button>
                } />
              ))}
            </div>
          )}

          {/* My pickups */}
          {tab === 'my-missions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myMissions.length === 0 ? (
                <div className="col-span-full flex flex-col items-center h-48 justify-center gap-3">
                  <span className="text-4xl">🚴</span>
                  <p className="text-surface-muted text-sm">No active missions yet.</p>
                </div>
              ) : myMissions.map(d => (
                <DonationCard key={d.id} donation={d} actions={
                  d.status === 'assigned' ? (
                    <button id={`pickup-${d.id}`} onClick={() => handlePickup(d.id)} className="btn-primary flex-1 justify-center text-xs py-2">
                      📦 Mark Picked Up
                    </button>
                  ) : d.status === 'picked_up' ? (
                    <button id={`deliver-${d.id}`} onClick={() => handleDeliver(d.id)} className="btn-primary flex-1 justify-center text-xs py-2">
                      ✅ Mark Delivered
                    </button>
                  ) : null
                } />
              ))}
            </div>
          )}

          {/* Leaderboard */}
          {tab === 'leaderboard' && (
            <div className="max-w-xl">
              <div className="glass overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-border">
                  <h3 className="font-semibold text-slate-100">🥇 Top Volunteers</h3>
                </div>
                {leaderboard.length === 0 ? (
                  <p className="text-center py-10 text-surface-muted">No data yet.</p>
                ) : leaderboard.map((v, i) => (
                  <div key={v.uid} className={`flex items-center gap-4 px-5 py-3 border-b border-surface-border/50 last:border-0
                    ${i < 3 ? 'bg-brand-500/5' : ''}`}>
                    <span className="text-xl w-7 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 text-sm truncate">{v.name}</p>
                      <p className="text-xs text-surface-muted truncate">{v.organization}</p>
                    </div>
                    <span className="text-brand-400 font-bold text-sm">{v.rewards?.points || 0} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {tab === 'badges' && (
            <div className="max-w-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(BADGES_META).map(([id, b]) => {
                  const earned = badges.includes(id);
                  return (
                    <div key={id} className={`glass p-5 flex flex-col items-center gap-2 text-center transition-all duration-200
                      ${earned ? 'ring-1 ring-brand-400/50 shadow-glow' : 'opacity-50 grayscale'}`}>
                      <span className="text-4xl">{b.icon}</span>
                      <p className="font-semibold text-slate-100 text-sm">{b.name}</p>
                      <p className="text-xs text-surface-muted">{b.desc}</p>
                      {earned ? (
                        <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/30">Earned ✓</span>
                      ) : (
                        <span className="text-xs text-surface-muted">Locked</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sponsor & Donate */}
          {tab === 'sponsor' && (
            <div className="max-w-2xl">
              <div className="glass p-6">
                <h2 className="text-xl font-bold text-slate-100 mb-2">Fund a Partner NGO</h2>
                <p className="text-sm text-surface-muted mb-6">Your financial contributions help NGOs expand their rescue fleets and community kitchens.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">Select an Organization</label>
                    <select className="input cursor-pointer">
                      <option>Food Rescue Hope</option>
                      <option>Zero Waste Heroes</option>
                      <option>Community Hearts</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Donation Amount (INR)</label>
                    <div className="flex gap-2">
                       {['500', '1000', '5000'].map(amt => (
                         <button key={amt} className="btn-secondary flex-1 py-2 font-mono text-sm border-brand-500/30 text-brand-300 bg-brand-500/10 hover:bg-brand-500/20">₹{amt}</button>
                       ))}
                       <input type="number" placeholder="Custom Amount" className="input flex-[2]" />
                    </div>
                  </div>
                  <button className="btn-primary w-full justify-center mt-4 text-base py-3" onClick={() => notify("Redirecting to payment gateway...")}>
                    💖 Proceed to Donate
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

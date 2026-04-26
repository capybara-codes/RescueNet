import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/StatCard';
import api from '../api';

export default function AdminDashboard() {
  const [overview,   setOverview]   = useState(null);
  const [users,      setUsers]      = useState([]);
  const [donations,  setDonations]  = useState([]);
  const [tab,        setTab]        = useState('overview');
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ov, us, dn] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get('/admin/donations'),
      ]);
      setOverview(ov.data);
      setUsers(us.data);
      setDonations(dn.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleVerify = async (uid) => {
    try {
      await api.patch(`/admin/users/${uid}/verify`);
      setMsg('✅ User verified!');
      fetchAll();
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDeleteDonation = async (id) => {
    if (!window.confirm('Delete this donation?')) return;
    try {
      await api.delete(`/admin/donations/${id}`);
      setMsg('Donation deleted.');
      fetchAll();
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setTimeout(() => setMsg(''), 3000);
  };

  const ov = overview || {};
  const roleColors = {
    restaurant:'bg-amber-400/10 text-amber-400', college:'bg-blue-400/10 text-blue-400',
    bakery:'bg-pink-400/10 text-pink-400', ngo:'bg-purple-400/10 text-purple-400',
    volunteer:'bg-cyan-400/10 text-cyan-400', admin:'bg-rose-400/10 text-rose-400',
  };

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Platform management & oversight">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="👥" label="Total Users"       value={ov.total_users || 0}          color="brand"  />
        <StatCard icon="✅" label="Verified"          value={ov.verified_users || 0}       color="teal"   />
        <StatCard icon="⏳" label="Pending Verify"    value={ov.pending_verification || 0} color="amber"  />
        <StatCard icon="📦" label="Total Donations"   value={ov.total_donations || 0}      color="purple" />
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm">{msg}</div>
      )}

      <div className="flex gap-2 mb-5 flex-wrap">
        {[['overview','📊 Overview'],['users','👥 Users'],['donations','📦 Donations']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`text-sm px-4 py-2 rounded-xl font-medium border transition-all
              ${tab === id ? 'bg-brand-500/20 text-brand-400 border-brand-500/40' : 'text-surface-muted border-surface-border hover:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-surface-muted animate-pulse">Loading…</p>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass p-5">
                <h3 className="font-semibold text-slate-100 mb-4">User Roles</h3>
                <div className="space-y-2">
                  {Object.entries(ov.role_breakdown || {}).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${roleColors[role] || 'bg-slate-400/10 text-slate-400'}`}>{role}</span>
                      <div className="flex items-center gap-2 flex-1 mx-3">
                        <div className="flex-1 h-1.5 bg-surface-border rounded-full">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(count / (ov.total_users || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-300 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass p-5">
                <h3 className="font-semibold text-slate-100 mb-4">Donation Status</h3>
                <div className="space-y-2">
                  {Object.entries(ov.donation_status_breakdown || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="text-surface-muted capitalize">{status.replace('_',' ')}</span>
                      <span className="font-bold text-slate-300">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="glass overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Name','Email','Role','Status','Action'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-surface-muted font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.uid} className="border-b border-surface-border/50 hover:bg-surface/40 transition-colors">
                      <td className="px-5 py-3 text-slate-200 font-medium">{u.name}</td>
                      <td className="px-5 py-3 text-surface-muted">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${roleColors[u.role] || ''}`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3">
                        {u.verified
                          ? <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">Verified ✓</span>
                          : <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Pending</span>}
                      </td>
                      <td className="px-5 py-3">
                        {!u.verified && (
                          <button id={`verify-${u.uid}`} onClick={() => handleVerify(u.uid)} className="btn-primary py-1 px-3 text-xs">Verify</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'donations' && (
            <div className="glass overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Food','Qty (kg)','Priority','Status','Action'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-surface-muted font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d.id} className="border-b border-surface-border/50 hover:bg-surface/40 transition-colors">
                      <td className="px-5 py-3 text-slate-200 font-medium">{d.food_type}</td>
                      <td className="px-5 py-3 text-slate-300">{d.quantity_kg}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                          ${d.priority==='high' ? 'bg-rose-500/20 text-rose-400' :
                            d.priority==='medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'}`}>
                          {d.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-300 capitalize">{d.status?.replace('_',' ')}</td>
                      <td className="px-5 py-3">
                        <button id={`del-${d.id}`} onClick={() => handleDeleteDonation(d.id)} className="btn-danger py-1 px-3 text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

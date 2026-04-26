import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/StatCard';
import DonationCard from '../components/DonationCard';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function NGODashboard() {
  const { profile } = useAuth();
  const [available, setAvailable]   = useState([]);
  const [accepted,  setAccepted]    = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [tab,       setTab]         = useState('available');
  const [msg,       setMsg]         = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [avRes, acRes] = await Promise.all([
        api.get('/ngo/available-donations'),
        api.get('/ngo/my-accepted'),
      ]);
      setAvailable(avRes.data);
      setAccepted(acRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (id) => {
    try {
      await api.post(`/ngo/accept/${id}`);
      setMsg('✅ Donation accepted!');
      fetchData();
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/ngo/reject/${id}`);
      setMsg('Donation released back.');
      fetchData();
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setTimeout(() => setMsg(''), 3000);
  };

  const inProgress = accepted.filter(d => !['delivered','expired'].includes(d.status));
  const history    = accepted.filter(d =>  ['delivered','expired'].includes(d.status));

  return (
    <DashboardLayout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🔍" label="Available Now"     value={available.length}   color="brand"  />
        <StatCard icon="✅" label="Accepted"          value={accepted.length}    color="teal"   />
        <StatCard icon="🚴" label="In Progress"       value={inProgress.length}  color="purple" />
        <StatCard icon="📦" label="Completed"         value={history.length}     color="cyan"   />
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['available','🔍 Available Food'],['accepted','✅ Accepted & In-Progress'],['history','📜 History']].map(([id,label]) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tab === 'available' && available.map(d => (
            <DonationCard key={d.id} donation={d} actions={
              <>
                <button id={`accept-${d.id}`} onClick={() => handleAccept(d.id)} className="btn-primary flex-1 justify-center text-xs py-2">
                  ✅ Accept
                </button>
              </>
            } />
          ))}
          {tab === 'accepted' && inProgress.map(d => (
            <DonationCard key={d.id} donation={d} actions={
              <button id={`reject-${d.id}`} onClick={() => handleReject(d.id)} className="btn-danger flex-1 justify-center text-xs py-2">
                ✕ Release
              </button>
            } />
          ))}
          {tab === 'history' && history.map(d => (
            <DonationCard key={d.id} donation={d} />
          ))}
          {((tab === 'available' && available.length === 0) ||
            (tab === 'accepted' && inProgress.length === 0) ||
            (tab === 'history'  && history.length === 0)) && (
            <div className="col-span-full flex flex-col items-center justify-center h-48 gap-3">
              <span className="text-4xl">📭</span>
              <p className="text-surface-muted text-sm">Nothing here yet.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

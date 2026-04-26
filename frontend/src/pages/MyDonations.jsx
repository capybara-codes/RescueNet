import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import DonationCard from '../components/DonationCard';
import api from '../api';

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    api.get('/donations/mine')
      .then(r => setDonations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statuses = ['all', 'available', 'accepted', 'assigned', 'picked_up', 'delivered', 'expired'];
  const filtered = filter === 'all' ? donations : donations.filter(d => d.status === filter);

  return (
    <DashboardLayout title="My Donations" subtitle="Track all your food donations">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {statuses.map(s => (
          <button
            key={s}
            id={`filter-${s}`}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-all duration-150 border
              ${filter === s
                ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                : 'text-surface-muted border-surface-border hover:text-slate-300'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-surface-muted animate-pulse">Loading donations…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 gap-3">
          <span className="text-5xl">📭</span>
          <p className="text-surface-muted">No donations found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

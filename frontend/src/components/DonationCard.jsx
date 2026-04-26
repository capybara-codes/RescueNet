import PriorityBadge from './PriorityBadge';

export default function DonationCard({ donation, actions }) {
  const expiryDate = donation.expires_at
    ? new Date(donation.expires_at).toLocaleString()
    : '—';

  const statusColor = {
    available: 'text-brand-400',
    accepted:  'text-cyan-400',
    assigned:  'text-purple-400',
    picked_up: 'text-amber-400',
    delivered: 'text-teal-400',
    expired:   'text-rose-400',
  }[donation.status] || 'text-slate-400';

  return (
    <div className="glass p-4 flex flex-col gap-3 hover:shadow-glow transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm">{donation.food_type}</h3>
          <p className="text-xs text-surface-muted mt-0.5">{donation.address}</p>
        </div>
        <PriorityBadge priority={donation.priority} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-surface-muted">Quantity</span>
        <span className="text-slate-300 font-medium">{donation.quantity_kg} kg</span>

        <span className="text-surface-muted">Type</span>
        <span className={donation.is_vegetarian ? 'text-brand-400' : 'text-rose-400'}>
          {donation.is_vegetarian ? '🟢 Veg' : '🔴 Non-Veg'}
        </span>

        <span className="text-surface-muted">Expires</span>
        <span className="text-slate-300">{expiryDate}</span>

        <span className="text-surface-muted">Status</span>
        <span className={`font-semibold capitalize ${statusColor}`}>{donation.status?.replace('_', ' ')}</span>
      </div>

      {/* Packed badge */}
      {donation.is_packed && (
        <span className="self-start text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/30">
          📦 Packed & Ready
        </span>
      )}

      {/* Actions */}
      {actions && <div className="flex gap-2 mt-1">{actions}</div>}
    </div>
  );
}

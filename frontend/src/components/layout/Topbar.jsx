import { useAuth } from '../../contexts/AuthContext';

const roleColors = {
  restaurant: 'text-amber-400 bg-amber-400/10',
  college:    'text-blue-400 bg-blue-400/10',
  bakery:     'text-pink-400 bg-pink-400/10',
  ngo:        'text-purple-400 bg-purple-400/10',
  volunteer:  'text-cyan-400 bg-cyan-400/10',
  admin:      'text-rose-400 bg-rose-400/10',
};

export default function Topbar({ title, subtitle }) {
  const { profile } = useAuth();
  const role = profile?.role || 'restaurant';
  const colorCls = roleColors[role] || roleColors.restaurant;
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' :
    now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="h-16 bg-surface-card/40 backdrop-blur border-b border-surface-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        {title ? (
          <>
            <h2 className="font-bold text-slate-100 text-lg leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-surface-muted">{subtitle}</p>}
          </>
        ) : (
          <p className="font-semibold text-slate-200">
            {greeting}, <span className="text-brand-400">{profile?.name?.split(' ')[0] || 'there'}</span> 👋
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${colorCls}`}>
          {role}
        </span>
        {/* Points pill */}
        <div className="glass px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-brand-400 font-bold text-sm">{profile?.rewards?.points ?? 0}</span>
          <span className="text-xs text-surface-muted">pts</span>
        </div>
      </div>
    </header>
  );
}

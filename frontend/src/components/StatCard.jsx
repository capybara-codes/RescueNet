export default function StatCard({ icon, label, value, sub, color = 'brand' }) {
  const colorMap = {
    brand:  'text-brand-400 bg-brand-400/10',
    cyan:   'text-cyan-400 bg-cyan-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    amber:  'text-amber-400 bg-amber-400/10',
    rose:   'text-rose-400 bg-rose-400/10',
    teal:   'text-teal-400 bg-teal-400/10',
  };
  const cls = colorMap[color] || colorMap.brand;

  return (
    <div className="stat-card group cursor-default">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 ${cls} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <p className="text-surface-muted text-xs font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-surface-muted mt-0.5">{sub}</p>}
    </div>
  );
}

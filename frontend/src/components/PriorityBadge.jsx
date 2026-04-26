export default function PriorityBadge({ priority }) {
  const map = {
    high:   { label: 'High Priority', cls: 'bg-rose-500/20 text-rose-400 border-rose-500/40', dot: 'bg-rose-400' },
    medium: { label: 'Medium',        cls: 'bg-amber-500/20 text-amber-400 border-amber-500/40', dot: 'bg-amber-400' },
    low:    { label: 'Low',           cls: 'bg-slate-500/20 text-slate-400 border-slate-500/40', dot: 'bg-slate-400' },
  };
  const { label, cls, dot } = map[priority] || map.low;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${priority === 'high' ? 'pulse-badge' : ''}`} />
      {label}
    </span>
  );
}

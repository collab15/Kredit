export default function StatCard({ title, value, icon: Icon, iconBg, iconColor, suffix = '', loading }) {
  return (
    <div className="k-card p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] text-muted uppercase tracking-widest mb-3">{title}</p>
          <p className="font-mono text-2xl font-bold text-white tabular-nums">
            {loading
              ? <span className="text-muted animate-pulse">—</span>
              : <>{suffix}{typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}</>
            }
          </p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={15} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
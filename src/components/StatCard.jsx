export default function StatCard({ title, value, icon, gradient = 'gradient-primary', subtitle }) {
  return (
    <div className="glass-premium p-6 hover-lift animate-fade-in group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 group-hover:text-primary-400 transition-colors">{title}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-white" style={{ color: '#ffffff' }}>{value}</h2>
            {subtitle && <span className="text-xs text-gray-500 font-medium">{subtitle}</span>}
          </div>
        </div>
        <div className={`${gradient} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-xl font-bold">{icon}</span>
        </div>
      </div>
    </div>
  );
}

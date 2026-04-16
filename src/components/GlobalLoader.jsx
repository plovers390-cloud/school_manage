import { useSelector } from 'react-redux';
import LoadingSpinner from './LoadingSpinner';

export default function GlobalLoader() {
  const { loadingCount } = useSelector((state) => state.ui);

  if (loadingCount === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-auto">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <span className="text-blue-400 font-medium animate-pulse">Processing...</span>
      </div>
    </div>
  );
}

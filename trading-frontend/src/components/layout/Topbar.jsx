import { Menu } from 'lucide-react';
import MarketStatus from '../common/MarketStatus';
import { useHealth } from '../../hooks/useMarketData';

export default function Topbar({ title, onMenuClick }) {
  const { data: health, isError } = useHealth();
  const backendUp = !isError && health?.data?.status === 'OK';

  return (
    <header className="h-16 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-[#9CA3AF] hover:text-white">
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <MarketStatus />
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${backendUp ? 'bg-[#10B981]' : 'bg-[#EF4444]'} animate-pulse-dot`} />
          <span className="text-xs text-[#9CA3AF] hidden sm:block">
            {backendUp ? 'Backend Up' : 'Backend Down'}
          </span>
        </div>
      </div>
    </header>
  );
}

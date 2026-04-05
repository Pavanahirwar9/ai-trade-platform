import { formatINR, formatPercent } from '../../utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PortfolioCard({ label, value, subValue, trend, icon: Icon }) {
  const positive = (trend ?? 0) >= 0;
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 hover:border-[#374151] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
            <Icon size={16} className="text-[#3B82F6]" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold font-mono text-white mb-1">{value}</p>
      {subValue !== undefined && (
        <div className="flex items-center gap-1">
          {positive ? <TrendingUp size={12} className="text-[#10B981]" /> : <TrendingDown size={12} className="text-[#EF4444]" />}
          <span className={`text-xs font-medium ${positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {subValue}
          </span>
        </div>
      )}
    </div>
  );
}

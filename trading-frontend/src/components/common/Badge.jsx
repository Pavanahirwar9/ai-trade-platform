import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const config = {
  BUY: { bg: 'bg-[#064E3B]', text: 'text-[#10B981]', border: 'border-[#10B981]', Icon: TrendingUp },
  SELL: { bg: 'bg-[#7F1D1D]', text: 'text-[#EF4444]', border: 'border-[#EF4444]', Icon: TrendingDown },
  HOLD: { bg: 'bg-[#78350F]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]', Icon: Minus },
};

export default function Badge({ signal, size = 'md', showIcon = true }) {
  const c = config[signal] || config.HOLD;
  const sizeClass =
    size === 'lg' ? 'px-4 py-2 text-base gap-2' :
    size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' :
    'px-3 py-1 text-sm gap-1.5';
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${c.bg} ${c.text} ${sizeClass}`}>
      {showIcon && <c.Icon size={size === 'lg' ? 18 : size === 'sm' ? 12 : 14} />}
      {signal}
    </span>
  );
}

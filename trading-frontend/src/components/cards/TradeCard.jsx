import Badge from '../common/Badge';
import { formatINR, formatDate } from '../../utils/formatters';

export default function TradeCard({ trade }) {
  if (!trade) return null;
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 hover:border-[#374151] transition-colors animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Badge signal={trade.type || trade.signal} size="sm" />
          <span className="font-bold text-white text-sm">{trade.symbol?.replace('.NS', '')}</span>
        </div>
        <span className="text-xs text-[#6B7280]">{formatDate(trade.timestamp)}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-[#6B7280]">Qty</span>
          <p className="font-mono text-[#9CA3AF]">{trade.quantity}</p>
        </div>
        <div>
          <span className="text-[#6B7280]">Price</span>
          <p className="font-mono text-[#9CA3AF]">{formatINR(trade.price)}</p>
        </div>
        <div>
          <span className="text-[#6B7280]">Total</span>
          <p className="font-mono text-[#9CA3AF]">{formatINR(trade.totalCost)}</p>
        </div>
      </div>
    </div>
  );
}

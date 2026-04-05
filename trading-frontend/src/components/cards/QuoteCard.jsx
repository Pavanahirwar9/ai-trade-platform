import { formatINR, formatChange, formatVolume } from '../../utils/formatters';

export default function QuoteCard({ quote, onClick, selected }) {
  if (!quote) return null;
  const positive = (quote.change || 0) >= 0;

  return (
    <div onClick={onClick}
      className={`bg-[#111827] rounded-xl border cursor-pointer transition-all duration-200 hover:bg-[#1a2235] hover:border-[#374151] ${
        selected ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/30' : 'border-[#1F2937]'
      }`}>
      {/* Top color bar */}
      <div className={`h-1 rounded-t-xl ${positive ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white">{quote.symbol?.replace('.NS', '')}</h3>
            <p className="text-xs text-[#6B7280] truncate max-w-[140px]">{quote.name}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            positive ? 'bg-[#064E3B] text-[#10B981]' : 'bg-[#7F1D1D] text-[#EF4444]'}`}>
            {positive ? '▲' : '▼'} {Math.abs(quote.changePercent || 0).toFixed(2)}%
          </span>
        </div>

        {/* Price */}
        <p className="text-2xl font-bold font-mono text-white mb-3">
          {formatINR(quote.price)}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#0A0E17] rounded-lg px-2 py-1.5">
            <span className="text-[#6B7280]">Open</span>
            <span className="float-right font-mono text-[#9CA3AF]">{formatINR(quote.open)}</span>
          </div>
          <div className="bg-[#0A0E17] rounded-lg px-2 py-1.5">
            <span className="text-[#6B7280]">High</span>
            <span className="float-right font-mono text-[#9CA3AF]">{formatINR(quote.dayHigh)}</span>
          </div>
          <div className="bg-[#0A0E17] rounded-lg px-2 py-1.5">
            <span className="text-[#6B7280]">Low</span>
            <span className="float-right font-mono text-[#9CA3AF]">{formatINR(quote.dayLow)}</span>
          </div>
          <div className="bg-[#0A0E17] rounded-lg px-2 py-1.5">
            <span className="text-[#6B7280]">Vol</span>
            <span className="float-right font-mono text-[#9CA3AF]">{formatVolume(quote.volume)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

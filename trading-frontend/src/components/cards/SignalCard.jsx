import Badge from '../common/Badge';
import { formatINR } from '../../utils/formatters';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function SignalCard({ signal, onExecute }) {
  if (!signal) return null;
  const borderColor =
    signal.signal === 'BUY' ? 'border-l-[#10B981]' :
    signal.signal === 'SELL' ? 'border-l-[#EF4444]' :
    'border-l-[#F59E0B]';
  const bgTint =
    signal.signal === 'BUY' ? 'bg-[#064E3B]/20' :
    signal.signal === 'SELL' ? 'bg-[#7F1D1D]/20' :
    '';

  // Mini sparkline data
  const sparkData = signal.sma50 && signal.sma200 ? [
    { s: signal.sma200 * 0.99, l: signal.sma200 * 1.01 },
    { s: signal.sma200, l: signal.sma200 },
    { s: (signal.sma50 + signal.sma200) / 2, l: (signal.sma50 + signal.sma200) / 2 },
    { s: signal.sma50, l: signal.sma200 },
    { s: signal.sma50 * 1.005, l: signal.sma200 * 0.995 },
  ] : [];

  return (
    <div className={`bg-[#111827] rounded-xl border border-[#1F2937] border-l-4 ${borderColor} ${bgTint} overflow-hidden animate-fade-in`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{signal.symbol?.replace('.NS', '')}</h3>
            <p className="text-sm font-mono text-[#9CA3AF]">{formatINR(signal.currentPrice)}</p>
          </div>
          <Badge signal={signal.signal} size="lg" />
        </div>

        {/* Mini sparkline */}
        {sparkData.length > 0 && (
          <div className="mb-4 bg-[#0A0E17] rounded-lg p-2">
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="s" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="l" stroke="#F97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-[10px] mt-1">
              <span className="text-[#3B82F6]">● SMA50</span>
              <span className="text-[#F97316]">● SMA200</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#0A0E17] rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#6B7280] uppercase">SMA 50</p>
            <p className="text-xs font-mono text-[#3B82F6] font-semibold">
              {signal.sma50 ? formatINR(signal.sma50) : '—'}
            </p>
          </div>
          <div className="bg-[#0A0E17] rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#6B7280] uppercase">SMA 200</p>
            <p className="text-xs font-mono text-[#F97316] font-semibold">
              {signal.sma200 ? formatINR(signal.sma200) : '—'}
            </p>
          </div>
          <div className="bg-[#0A0E17] rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#6B7280] uppercase">Crossover</p>
            <p className="text-xs font-mono text-[#FBBF24] font-semibold">
              {signal.crossoverType?.replace('_', ' ') || 'NONE'}
            </p>
          </div>
        </div>

        {/* Confidence + action */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            signal.confidence === 'HIGH' ? 'bg-[#064E3B] text-[#10B981]' :
            signal.confidence === 'MEDIUM' ? 'bg-[#78350F] text-[#F59E0B]' :
            'bg-[#1F2937] text-[#9CA3AF]'
          }`}>
            {signal.confidence || 'LOW'} confidence
          </span>
          {signal.signal !== 'HOLD' && (
            <button onClick={() => onExecute?.(signal)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                signal.signal === 'BUY'
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                  : 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
              }`}>
              Execute {signal.signal}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

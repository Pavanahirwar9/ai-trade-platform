import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { formatINR, formatDateShort } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#9CA3AF] mb-1">{d.date}</p>
      <p className="text-white font-mono font-semibold">{d.symbol}</p>
      <p className={`font-mono font-semibold ${d.pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
        {formatINR(d.pnl)}
      </p>
    </div>
  );
};

export default function PnLChart({ trades, height = 250 }) {
  if (!trades?.length) return <p className="text-[#6B7280] text-sm text-center py-8">No trade data available</p>;

  const chartData = trades
    .filter((t) => t.type === 'SELL')
    .map((t) => ({
      date: formatDateShort(t.timestamp),
      pnl: t.totalCost - (t.price * t.quantity),
      symbol: t.symbol?.replace('.NS', ''),
    }));

  if (!chartData.length) return <p className="text-[#6B7280] text-sm text-center py-8">No realized P&L yet</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
        <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6B7280' }} axisLine={{ stroke: '#1F2937' }} />
        <YAxis fontSize={10} tick={{ fill: '#6B7280' }} axisLine={{ stroke: '#1F2937' }}
          tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.pnl >= 0 ? '#10B981' : '#EF4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

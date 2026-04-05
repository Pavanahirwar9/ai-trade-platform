import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatINR, formatDateShort } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#9CA3AF] mb-1">{label}</p>
      <p className="text-white font-mono font-semibold">{formatINR(payload[0].value)}</p>
    </div>
  );
};

export default function PriceChart({ data, height = 300 }) {
  if (!data?.length) return <p className="text-[#6B7280] text-sm text-center py-8">No data available</p>;

  const chartData = data.map((d) => ({
    date: formatDateShort(d.date),
    close: d.close,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
        <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6B7280' }} axisLine={{ stroke: '#1F2937' }} tickLine={false} />
        <YAxis fontSize={10} tick={{ fill: '#6B7280' }} axisLine={{ stroke: '#1F2937' }} tickLine={false}
          tickFormatter={(v) => `₹${(v / 1).toLocaleString('en-IN')}`} width={70} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="close" stroke="#3B82F6" strokeWidth={2} fill="url(#priceGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatINR, formatDateShort } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#9CA3AF] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.stroke || p.color }} />
          <span className="text-[#9CA3AF]">{p.name}</span>
          <span className="font-mono text-white ml-auto">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function SMAChart({ data, sma50Period = 50, sma200Period = 200, height = 350 }) {
  if (!data?.length) return <p className="text-[#6B7280] text-sm text-center py-8">No data available</p>;

  const closePrices = data.map((d) => d.close);

  // Calculate SMA inline
  const calcSMA = (prices, period) => {
    return prices.map((_, i) => {
      if (i < period - 1) return null;
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += prices[j];
      return parseFloat((sum / period).toFixed(2));
    });
  };

  const sma50 = calcSMA(closePrices, sma50Period);
  const sma200 = calcSMA(closePrices, sma200Period);

  const chartData = data.map((d, i) => ({
    date: formatDateShort(d.date),
    price: d.close,
    sma50: sma50[i],
    sma200: sma200[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="smaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
        <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6B7280' }} axisLine={{ stroke: '#1F2937' }} tickLine={false}
          interval={Math.floor(chartData.length / 8)} />
        <YAxis fontSize={10} tick={{ fill: '#6B7280' }} axisLine={{ stroke: '#1F2937' }} tickLine={false}
          tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} width={70} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
        <Area type="monotone" dataKey="price" name="Price" stroke="#3B82F6" strokeWidth={2} fill="url(#smaGradient)" />
        <Line type="monotone" dataKey="sma50" name="SMA 50" stroke="#FBBF24" strokeWidth={1.5} dot={false} strokeDasharray="4 2"
          connectNulls={false} />
        <Line type="monotone" dataKey="sma200" name="SMA 200" stroke="#F97316" strokeWidth={1.5} dot={false} strokeDasharray="6 3"
          connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

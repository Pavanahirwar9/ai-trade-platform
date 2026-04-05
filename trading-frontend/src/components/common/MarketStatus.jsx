import { useState, useEffect } from 'react';
import { isMarketOpen, getISTTime, getNextMarketOpen } from '../../utils/marketHours';

export default function MarketStatus() {
  const [open, setOpen] = useState(isMarketOpen());
  const [time, setTime] = useState(getISTTime());

  useEffect(() => {
    const id = setInterval(() => {
      setOpen(isMarketOpen());
      setTime(getISTTime());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#9CA3AF] font-mono hidden md:block">{time}</span>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        open ? 'bg-[#064E3B] text-[#10B981]' : 'bg-[#7F1D1D] text-[#EF4444]'
      }`}>
        <span className={`w-2 h-2 rounded-full ${open ? 'bg-[#10B981]' : 'bg-[#EF4444]'} animate-pulse-dot`} />
        {open ? 'Market Open' : 'Market Closed'}
      </div>
    </div>
  );
}

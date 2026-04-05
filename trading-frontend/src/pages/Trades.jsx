import { useState, useMemo } from 'react';
import { Search, Filter, ClipboardList } from 'lucide-react';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { useTradeHistory } from '../hooks/usePortfolio';
import { formatINR, formatDate } from '../utils/formatters';

export default function Trades() {
  const { data: tradeData, isLoading } = useTradeHistory();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const allTrades = tradeData?.data || [];

  const filtered = useMemo(() => {
    return allTrades
      .filter((t) => {
        if (search && !t.symbol?.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterType !== 'ALL' && t.type !== filterType) return false;
        return true;
      })
      .reverse();
  }, [allTrades, search, filterType]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // Summary
  const totalBuy = allTrades.filter(t => t.type === 'BUY').length;
  const totalSell = allTrades.filter(t => t.type === 'SELL').length;
  const totalBrokerage = allTrades.reduce((s, t) => s + (t.brokerage || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
            <ClipboardList className="text-[#3B82F6]" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Trade History</h2>
            <p className="text-xs text-[#6B7280]">{allTrades.length} total trades</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={16} />
          <input type="text" placeholder="Search symbol..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#111827] border border-[#1F2937] rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
          />
        </div>
        <div className="flex gap-1">
          {['ALL', 'BUY', 'SELL'].map((f) => (
            <button key={f} onClick={() => { setFilterType(f); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                filterType === f ? 'bg-[#3B82F6] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">
        {isLoading ? <div className="p-5"><Loader rows={6} /></div> : !paged.length ? (
          <div className="text-center py-16">
            <ClipboardList size={40} className="text-[#374151] mx-auto mb-3" />
            <p className="text-[#6B7280] text-sm">No trades yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#6B7280] text-left text-xs uppercase bg-[#0A0E17]">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Signal</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Brokerage</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t, i) => (
                  <tr key={t.id} className="border-t border-[#1F2937]/50 hover:bg-[#1a2235]">
                    <td className="px-4 py-3 text-[#6B7280] text-xs">{(page - 1) * perPage + i + 1}</td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">{formatDate(t.timestamp)}</td>
                    <td className="px-4 py-3 font-semibold text-white">{t.symbol?.replace('.NS', '')}</td>
                    <td className="px-4 py-3"><Badge signal={t.type} size="sm" /></td>
                    <td className="px-4 py-3 font-mono text-[#9CA3AF]">{t.quantity}</td>
                    <td className="px-4 py-3 font-mono text-[#9CA3AF]">{formatINR(t.price)}</td>
                    <td className="px-4 py-3 font-mono text-[#9CA3AF]">{formatINR(t.totalCost)}</td>
                    <td className="px-4 py-3 font-mono text-[#F59E0B] text-xs">{formatINR(t.brokerage)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#064E3B] text-[#10B981]">{t.status || 'EXECUTED'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                page === i + 1 ? 'bg-[#3B82F6] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'
              }`}>{i + 1}</button>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 text-center">
          <p className="text-xs text-[#9CA3AF] mb-1">Total Trades</p>
          <p className="text-lg font-bold text-white">{allTrades.length}</p>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 text-center">
          <p className="text-xs text-[#9CA3AF] mb-1">Total BUY</p>
          <p className="text-lg font-bold text-[#10B981]">{totalBuy}</p>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 text-center">
          <p className="text-xs text-[#9CA3AF] mb-1">Total SELL</p>
          <p className="text-lg font-bold text-[#EF4444]">{totalSell}</p>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 text-center">
          <p className="text-xs text-[#9CA3AF] mb-1">Brokerage Paid</p>
          <p className="text-lg font-bold text-[#F59E0B]">{formatINR(totalBrokerage)}</p>
        </div>
      </div>
    </div>
  );
}

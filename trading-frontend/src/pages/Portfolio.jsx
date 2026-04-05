import { useState } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import PortfolioCard from '../components/cards/PortfolioCard';
import PnLChart from '../components/charts/PnLChart';
import TradeModal from '../components/modals/TradeModal';
import Loader from '../components/common/Loader';
import { usePortfolio, usePortfolioPnL, useTradeHistory } from '../hooks/usePortfolio';
import { formatINR, formatPercent } from '../utils/formatters';

export default function Portfolio() {
  const [tradeModal, setTradeModal] = useState({ open: false, symbol: '', signal: '', price: 0 });
  const { data: pfData, isLoading: pfLoading } = usePortfolio();
  const { data: pnlData } = usePortfolioPnL();
  const { data: tradeData } = useTradeHistory();

  const pf = pfData?.data || pnlData?.data || {};
  const trades = tradeData?.data || [];
  const holdings = pf.holdings || [];

  const bestPerformer = holdings.length ? holdings.reduce((a, b) => ((a.pnl || 0) > (b.pnl || 0) ? a : b)) : null;
  const worstPerformer = holdings.length ? holdings.reduce((a, b) => ((a.pnl || 0) < (b.pnl || 0) ? a : b)) : null;
  const totalRealized = pf.realizedPnL || 0;
  const sellTrades = trades.filter(t => t.type === 'SELL');
  const winRate = sellTrades.length ? ((sellTrades.filter(t => (t.totalCost || 0) > (t.price * t.quantity)).length / sellTrades.length) * 100).toFixed(1) : '0.0';

  const overallPnL = (pf.unrealizedPnL || 0) + totalRealized;
  const profitable = overallPnL >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className={`rounded-2xl p-6 border ${profitable ? 'bg-[#064E3B]/30 border-[#10B981]/30' : 'bg-[#7F1D1D]/30 border-[#EF4444]/30'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[#9CA3AF] mb-1">Total Value</p>
            <p className="text-xl font-bold font-mono text-white">{formatINR(pf.currentValue || pf.cashBalance || 1000000)}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] mb-1">Cash</p>
            <p className="text-xl font-bold font-mono text-white">{formatINR(pf.cashBalance || 1000000)}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] mb-1">Invested</p>
            <p className="text-xl font-bold font-mono text-white">{formatINR(pf.totalInvested || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] mb-1">Overall P&L</p>
            <p className={`text-xl font-bold font-mono ${profitable ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {overallPnL >= 0 ? '+' : ''}{formatINR(overallPnL)} ({formatPercent(pf.unrealizedPnLPercent || 0)})
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PortfolioCard label="Best Performer" value={bestPerformer?.symbol?.replace('.NS', '') || '—'}
          subValue={bestPerformer ? formatINR(bestPerformer.pnl || 0) : undefined} trend={bestPerformer?.pnl} icon={Award} />
        <PortfolioCard label="Worst Performer" value={worstPerformer?.symbol?.replace('.NS', '') || '—'}
          subValue={worstPerformer ? formatINR(worstPerformer.pnl || 0) : undefined} trend={worstPerformer?.pnl} icon={TrendingDown} />
        <PortfolioCard label="Realized P&L" value={formatINR(totalRealized)} trend={totalRealized} icon={Target} />
        <PortfolioCard label="Win Rate" value={`${winRate}%`} icon={TrendingUp} />
      </div>

      {/* P&L Chart */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Realized P&L by Trade</h2>
        <PnLChart trades={trades} />
      </div>

      {/* Holdings Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Holdings</h2>
        {pfLoading ? <Loader rows={4} /> : !holdings.length ? (
          <div className="text-center py-12">
            <Briefcase size={40} className="text-[#374151] mx-auto mb-3" />
            <p className="text-[#6B7280] text-sm">No holdings yet. Go to Signals to find trades.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#6B7280] text-left text-xs uppercase border-b border-[#1F2937]">
                  <th className="pb-3 pr-4">Symbol</th>
                  <th className="pb-3 pr-4">Qty</th>
                  <th className="pb-3 pr-4">Avg Buy</th>
                  <th className="pb-3 pr-4">Current</th>
                  <th className="pb-3 pr-4">Invested</th>
                  <th className="pb-3 pr-4">Current Val</th>
                  <th className="pb-3 pr-4">P&L</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const invested = h.avgBuyPrice * h.qty;
                  const currentVal = (h.currentPrice || h.avgBuyPrice) * h.qty;
                  const pnl = h.pnl || (currentVal - invested);
                  return (
                    <tr key={h.symbol} className="border-b border-[#1F2937]/50 hover:bg-[#1a2235]">
                      <td className="py-3 font-semibold text-white">{h.symbol?.replace('.NS', '')}</td>
                      <td className="py-3 font-mono text-[#9CA3AF]">{h.qty}</td>
                      <td className="py-3 font-mono text-[#9CA3AF]">{formatINR(h.avgBuyPrice)}</td>
                      <td className="py-3 font-mono text-[#9CA3AF]">{formatINR(h.currentPrice || h.avgBuyPrice)}</td>
                      <td className="py-3 font-mono text-[#9CA3AF]">{formatINR(invested)}</td>
                      <td className="py-3 font-mono text-[#9CA3AF]">{formatINR(currentVal)}</td>
                      <td className={`py-3 font-mono font-semibold ${pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {formatINR(pnl)}
                      </td>
                      <td className="py-3">
                        <button onClick={() => setTradeModal({ open: true, symbol: h.symbol, signal: 'SELL', price: h.currentPrice || h.avgBuyPrice })}
                          className="px-3 py-1 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] rounded-lg text-xs font-medium transition-colors">
                          Sell All
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TradeModal isOpen={tradeModal.open} onClose={() => setTradeModal({ ...tradeModal, open: false })}
        symbol={tradeModal.symbol} signal={tradeModal.signal} price={tradeModal.price} />
    </div>
  );
}

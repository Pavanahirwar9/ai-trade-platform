import { useState } from 'react';
import { Wallet, DollarSign, TrendingUp, ClipboardList, RefreshCw } from 'lucide-react';
import PortfolioCard from '../components/cards/PortfolioCard';
import SignalCard from '../components/cards/SignalCard';
import SMAChart from '../components/charts/SMAChart';
import TradeModal from '../components/modals/TradeModal';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { usePortfolio, useTradeHistory } from '../hooks/usePortfolio';
import { useMarketHistory } from '../hooks/useMarketData';
import { useScanSignals } from '../hooks/useSignals';
import { formatINR, formatPercent } from '../utils/formatters';

const SCAN_SYMBOLS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'WIPRO.NS'];

export default function Dashboard() {
  const [tradeModal, setTradeModal] = useState({ open: false, symbol: '', signal: '', price: 0 });
  const { data: portfolio, isLoading: pfLoading } = usePortfolio();
  const { data: trades, isLoading: trLoading } = useTradeHistory();
  const { data: historyData, isLoading: histLoading } = useMarketHistory('RELIANCE.NS', '14');
  const scanMutation = useScanSignals();

  const pf = portfolio?.data || {};
  const tradeList = trades?.data || [];
  const history = historyData?.data || [];

  const handleScan = () => scanMutation.mutate(SCAN_SYMBOLS);
  const signals = scanMutation.data?.data || [];

  const totalTrades = tradeList.length;
  const currentValue = pf.currentValue || 0;
  const unrealizedPnL = pf.unrealizedPnL || 0;
  const unrealizedPct = pf.unrealizedPnLPercent || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PortfolioCard label="Portfolio Value" value={formatINR(currentValue || pf.cashBalance || 1000000)}
          trend={unrealizedPnL} subValue={formatPercent(unrealizedPct)} icon={Wallet} />
        <PortfolioCard label="Cash Balance" value={formatINR(pf.cashBalance || 1000000)} icon={DollarSign} />
        <PortfolioCard label="Unrealized P&L" value={formatINR(unrealizedPnL)}
          trend={unrealizedPnL} subValue={formatPercent(unrealizedPct)} icon={TrendingUp} />
        <PortfolioCard label="Total Trades" value={totalTrades.toString()} icon={ClipboardList} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* SMA Chart — 60% */}
        <div className="lg:col-span-3 bg-[#111827] border border-[#1F2937] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">RELIANCE.NS — SMA Crossover</h2>
              <p className="text-xs text-[#6B7280]">Price with SMA 50 & SMA 200 overlay</p>
            </div>
          </div>
          {histLoading ? <Loader rows={4} /> : <SMAChart data={history} />}
        </div>

        {/* Signal Scanner — 40% */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Watchlist Signals</h2>
            <button onClick={handleScan} disabled={scanMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
              <RefreshCw size={12} className={scanMutation.isPending ? 'animate-spin' : ''} />
              Scan All
            </button>
          </div>
          {scanMutation.isPending ? (
            <Loader rows={5} />
          ) : signals.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {signals.map((s, i) => (
                s.success && s.data ? (
                  <div key={i} className="flex items-center justify-between bg-[#0A0E17] rounded-lg p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{s.data.symbol?.replace('.NS', '')}</p>
                      <p className="text-xs font-mono text-[#9CA3AF]">{formatINR(s.data.currentPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        s.data.signal === 'BUY' ? 'bg-[#064E3B] text-[#10B981]' :
                        s.data.signal === 'SELL' ? 'bg-[#7F1D1D] text-[#EF4444]' :
                        'bg-[#78350F] text-[#F59E0B]'
                      }`}>{s.data.signal}</span>
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#6B7280] text-sm mb-2">Click "Scan All" to generate signals</p>
              <p className="text-[#4B5563] text-xs">Watchlist: {SCAN_SYMBOLS.map(s => s.replace('.NS','')).join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trades */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Recent Trades</h2>
          {trLoading ? <Loader rows={3} /> : tradeList.length === 0 ? (
            <p className="text-[#6B7280] text-sm text-center py-6">No trades yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-[#6B7280] text-left border-b border-[#1F2937]">
                  <th className="pb-2">Symbol</th><th className="pb-2">Signal</th><th className="pb-2">Qty</th>
                  <th className="pb-2">Price</th><th className="pb-2">Total</th>
                </tr></thead>
                <tbody>
                  {tradeList.slice(-5).reverse().map((t) => (
                    <tr key={t.id} className="border-b border-[#1F2937]/50">
                      <td className="py-2 font-medium text-white">{t.symbol?.replace('.NS', '')}</td>
                      <td><span className={`font-semibold ${t.type === 'BUY' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{t.type}</span></td>
                      <td className="font-mono text-[#9CA3AF]">{t.quantity}</td>
                      <td className="font-mono text-[#9CA3AF]">{formatINR(t.price)}</td>
                      <td className="font-mono text-[#9CA3AF]">{formatINR(t.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Holdings */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Holdings</h2>
          {pfLoading ? <Loader rows={3} /> : !pf.holdings?.length ? (
            <p className="text-[#6B7280] text-sm text-center py-6">No holdings yet. Go to Signals to find trades.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-[#6B7280] text-left border-b border-[#1F2937]">
                  <th className="pb-2">Symbol</th><th className="pb-2">Qty</th><th className="pb-2">Avg Price</th>
                  <th className="pb-2">P&L</th>
                </tr></thead>
                <tbody>
                  {pf.holdings.map((h) => (
                    <tr key={h.symbol} className="border-b border-[#1F2937]/50">
                      <td className="py-2 font-medium text-white">{h.symbol?.replace('.NS', '')}</td>
                      <td className="font-mono text-[#9CA3AF]">{h.qty}</td>
                      <td className="font-mono text-[#9CA3AF]">{formatINR(h.avgBuyPrice)}</td>
                      <td className={`font-mono font-semibold ${(h.pnl || 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {formatINR(h.pnl || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <TradeModal isOpen={tradeModal.open} onClose={() => setTradeModal({ ...tradeModal, open: false })}
        symbol={tradeModal.symbol} signal={tradeModal.signal} price={tradeModal.price} />
    </div>
  );
}

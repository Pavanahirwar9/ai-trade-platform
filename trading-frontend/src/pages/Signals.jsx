import { useState } from 'react';
import { Radar, X, Plus, RefreshCw } from 'lucide-react';
import SignalCard from '../components/cards/SignalCard';
import TradeModal from '../components/modals/TradeModal';
import Loader from '../components/common/Loader';
import { useScanSignals } from '../hooks/useSignals';
import useWatchlistStore from '../store/watchlistStore';
import { formatDate } from '../utils/formatters';

export default function Signals() {
  const [inputValue, setInputValue] = useState('');
  const [tradeModal, setTradeModal] = useState({ open: false, symbol: '', signal: '', price: 0 });
  const [lastScan, setLastScan] = useState(null);
  const { watchlist, addSymbol, removeSymbol } = useWatchlistStore();
  const scanMutation = useScanSignals();

  const handleScan = () => {
    scanMutation.mutate(watchlist);
    setLastScan(new Date().toISOString());
  };

  const handleAddSymbol = () => {
    if (!inputValue.trim()) return;
    const sym = inputValue.trim().toUpperCase();
    addSymbol(sym.endsWith('.NS') ? sym : `${sym}.NS`);
    setInputValue('');
  };

  const handleExecute = (signal) => {
    setTradeModal({ open: true, symbol: signal.symbol, signal: signal.signal, price: signal.currentPrice });
  };

  const signals = scanMutation.data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
            <Radar className="text-[#3B82F6]" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Signal Scanner</h2>
            {lastScan && <p className="text-xs text-[#6B7280]">Last scan: {formatDate(lastScan)}</p>}
          </div>
        </div>
        <button onClick={handleScan} disabled={scanMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
          <RefreshCw size={16} className={scanMutation.isPending ? 'animate-spin' : ''} />
          Scan Watchlist
        </button>
      </div>

      {/* Watchlist chips */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <p className="text-xs text-[#9CA3AF] mb-3 uppercase tracking-wide">Watchlist Symbols</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {watchlist.map((sym) => (
            <span key={sym} className="flex items-center gap-1.5 bg-[#1F2937] text-[#9CA3AF] px-3 py-1.5 rounded-full text-xs font-medium">
              {sym.replace('.NS', '')}
              <button onClick={() => removeSymbol(sym)} className="hover:text-white"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Add symbol (e.g. SBIN)" value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
            className="flex-1 bg-[#0A0E17] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
          />
          <button onClick={handleAddSymbol}
            className="px-3 py-2 bg-[#1F2937] hover:bg-[#374151] text-white rounded-lg">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Results */}
      {scanMutation.isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Loader key={i} rows={4} />)}
        </div>
      ) : signals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signals.map((s, i) =>
            s.success && s.data ? (
              <SignalCard key={i} signal={s.data} onExecute={handleExecute} />
            ) : (
              <div key={i} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 text-center">
                <p className="text-[#EF4444] text-sm">{s.symbol}: {s.error}</p>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <Radar size={48} className="text-[#374151] mx-auto mb-4" />
          <p className="text-[#6B7280] text-sm">Click "Scan Watchlist" to generate trading signals</p>
        </div>
      )}

      <TradeModal isOpen={tradeModal.open} onClose={() => setTradeModal({ ...tradeModal, open: false })}
        symbol={tradeModal.symbol} signal={tradeModal.signal} price={tradeModal.price} />
    </div>
  );
}

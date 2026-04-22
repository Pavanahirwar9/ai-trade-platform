import { useEffect, useMemo, useState } from 'react';
import { Calendar, Play, Square, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PriceChart from '../components/charts/PriceChart';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import {
  createManualStrategy,
  listManualStrategies,
  cancelManualStrategy,
  stopManualStrategy,
} from '../api/manualStrategy';
import { useMarketHistory } from '../hooks/useMarketData';
import { useMarketSearch } from '../hooks/useMarketData';

const DEFAULT_SYMBOL = 'RELIANCE.NS';

type ManualStrategyItem = {
  id: string;
  symbol: string;
  quantity: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  startAt?: string;
  status: string;
  rationale?: string;
};

const formatIst = (iso) =>
  new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

const normalizeSymbol = (value) => {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return '';
  return trimmed.endsWith('.NS') ? trimmed : `${trimmed}.NS`;
};

export default function ManualStrategy() {
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL);
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [rationale, setRationale] = useState('');
  const [strategies, setStrategies] = useState<ManualStrategyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const historySymbol = useMemo(() => normalizeSymbol(selectedSymbol) || DEFAULT_SYMBOL, [selectedSymbol]);
  const { data: historyData, isLoading: histLoading, isError: histError } = useMarketHistory(historySymbol, '6');
  const { data: searchResults, isLoading: isSearching } = useMarketSearch(debouncedQuery);
  const history = historyData?.data || [];
  const instruments = searchResults?.data || [];

  const isFormValid = useMemo(() => {
    const entryValue = Number(entry);
    const stopValue = Number(stopLoss);
    const targetValue = Number(takeProfit);

    if (!symbolInput.trim()) return false;
    if (!Number.isFinite(entryValue) || !Number.isFinite(stopValue) || !Number.isFinite(targetValue)) return false;
    if (entryValue <= 0 || stopValue <= 0 || targetValue <= 0) return false;
    if (stopValue >= entryValue) return false;
    if (targetValue <= entryValue) return false;
    return true;
  }, [symbolInput, entry, stopLoss, takeProfit]);

  const fetchStrategies = async () => {
    try {
      const res = await listManualStrategies();
      setStrategies(res?.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load strategies.';
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchStrategies();
    const interval = setInterval(fetchStrategies, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const query = symbolInput.trim();
      setDebouncedQuery(query);
      setShowDropdown(!!query);
    }, 400);
    return () => clearTimeout(timer);
  }, [symbolInput]);

  const handleSelectSymbol = (value: string) => {
    const normalized = normalizeSymbol(value);
    if (normalized) {
      setSymbolInput(normalized);
      setSelectedSymbol(normalized);
    }
    setShowDropdown(false);
  };

  const handleCreate = async () => {
    if (!isFormValid) {
      toast.error('Please fill all fields correctly. Stop loss must be below entry and target above entry.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        symbol: normalizeSymbol(symbolInput),
        quantity,
        entry: Number(entry),
        stopLoss: Number(stopLoss),
        takeProfit: Number(takeProfit),
        rationale: rationale.trim() || undefined,
      };

      await createManualStrategy(payload);
      toast.success('Manual strategy scheduled for next trading day.');
      setEntry('');
      setStopLoss('');
      setTakeProfit('');
      setRationale('');
      fetchStrategies();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create strategy.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelManualStrategy(id);
      fetchStrategies();
      toast.success('Strategy cancelled.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel strategy.';
      toast.error(message);
    }
  };

  const handleStop = async (id) => {
    try {
      await stopManualStrategy(id);
      fetchStrategies();
      toast.success('Strategy stopped.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop strategy.';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
          <Target className="text-[#3B82F6]" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Manual Strategy</h2>
          <p className="text-xs text-[#6B7280]">Create your own next-day strategy and auto trade it.</p>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative">
            <input
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              onFocus={() => setShowDropdown(!!symbolInput.trim())}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const normalized = normalizeSymbol(symbolInput);
                  if (normalized && normalized.length >= 4) {
                    setSelectedSymbol(normalized);
                    setShowDropdown(false);
                  }
                }
              }}
              placeholder="Symbol (e.g. RELIANCE.NS)"
              className="w-full bg-[#0A0E17] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm"
            />
            {showDropdown && debouncedQuery.length >= 2 && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#111827] border border-[#1F2937] rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto z-20">
                {isSearching ? (
                  <div className="p-3 text-center text-xs text-[#6B7280]">Searching...</div>
                ) : instruments.length > 0 ? (
                  <ul className="divide-y divide-[#1F2937]/50">
                    {instruments.map((inst, idx) => (
                      <li
                        key={`${inst.symbol}-${idx}`}
                        className="p-3 hover:bg-[#1F2937] cursor-pointer transition-colors flex justify-between items-center"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSymbol(inst.symbol);
                        }}
                      >
                        <span className="font-semibold text-white text-sm">{inst.symbol}</span>
                        <span className="text-xs text-[#6B7280] truncate max-w-[180px]">{inst.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-center text-xs text-[#6B7280]">No stocks found for "{debouncedQuery}"</div>
                )}
              </div>
            )}
          </div>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
            className="bg-[#0A0E17] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="number"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Entry"
            className="bg-[#0A0E17] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Stop Loss"
            className="bg-[#0A0E17] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="Take Profit"
            className="bg-[#0A0E17] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Play size={16} />
            Schedule
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Optional notes"
            className="bg-[#0A0E17] border border-[#1F2937] rounded-lg px-3 py-2 text-white text-sm"
          />
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
            <Calendar size={14} />
            Scheduled for next trading day at 09:15 IST.
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          {historySymbol || DEFAULT_SYMBOL} — Price Chart
        </h3>
        {histLoading ? (
          <Loader rows={4} />
        ) : histError ? (
          <ErrorState message="Could not load chart data for this symbol." />
        ) : (
          <PriceChart data={history} height={320} />
        )}
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Scheduled Strategies</h3>
        {strategies.length === 0 ? (
          <p className="text-xs text-[#6B7280]">No manual strategies yet.</p>
        ) : (
          <div className="space-y-3">
            {strategies.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSymbol(s.symbol)}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#0A0E17] border border-[#1F2937] rounded-lg p-3 cursor-pointer hover:border-[#3B82F6]/50"
              >
                <div>
                  <p className="text-sm text-white font-semibold">{s.symbol}</p>
                  <p className="text-xs text-[#9CA3AF]">
                    Entry: {s.entry} | Stop: {s.stopLoss} | Target: {s.takeProfit} | Qty: {s.quantity}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">Start: {s.startAt ? formatIst(s.startAt) : '—'}</p>
                  {s.rationale && <p className="text-[11px] text-[#6B7280]">Notes: {s.rationale}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    s.status === 'RUNNING'
                      ? 'bg-[#064E3B] text-[#10B981]'
                      : s.status === 'SCHEDULED'
                        ? 'bg-[#1F2937] text-[#9CA3AF]'
                        : s.status === 'FAILED'
                          ? 'bg-[#7F1D1D] text-[#EF4444]'
                          : 'bg-[#0B3B2A] text-[#6EE7B7]'
                  }`}>{s.status}</span>
                  {s.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleCancel(s.id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-white"
                    >
                      <Square size={14} />
                      Cancel
                    </button>
                  )}
                  {s.status === 'RUNNING' && (
                    <button
                      onClick={() => handleStop(s.id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#7F1D1D] hover:bg-[#B91C1C] text-white"
                    >
                      <Square size={14} />
                      Stop
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

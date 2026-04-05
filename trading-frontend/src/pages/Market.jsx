import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import QuoteCard from '../components/cards/QuoteCard';
import PriceChart from '../components/charts/PriceChart';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { useMarketQuote, useMarketHistory, useMultipleQuotes } from '../hooks/useMarketData';
import { DEFAULT_WATCHLIST } from '../utils/constants';

export default function Market() {
  const [searchInput, setSearchInput] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('6');

  const watchlistSymbols = DEFAULT_WATCHLIST.map((w) => w.symbol);
  const { data: quotesData, isLoading: quotesLoading } = useMultipleQuotes(watchlistSymbols);
  const { data: searchData, isLoading: searchLoading, isError: searchError } = useMarketQuote(searchSymbol);
  const { data: historyData, isLoading: histLoading } = useMarketHistory(selectedSymbol, timeframe);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim()) {
        const sym = searchInput.trim().toUpperCase();
        setSearchSymbol(sym.endsWith('.NS') ? sym : `${sym}.NS`);
      } else {
        setSearchSymbol('');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const quotes = quotesData?.data || [];
  const history = historyData?.data || [];
  const searchQuote = searchData?.data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
        <input type="text" placeholder="Search NSE stock (e.g. TCS, RELIANCE)..."
          value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          className="w-full bg-[#111827] border border-[#1F2937] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
        />
      </div>

      {/* Search result */}
      {searchSymbol && (
        <div className="max-w-sm">
          {searchLoading ? <Loader rows={2} /> :
           searchError ? <ErrorState message="Could not fetch quote. Check the symbol." /> :
           searchQuote ? <QuoteCard quote={searchQuote} onClick={() => setSelectedSymbol(searchQuote.symbol)} /> : null}
        </div>
      )}

      {/* Watchlist */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Watchlist</h2>
        {quotesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Loader key={i} rows={2} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quotes.map((q, i) =>
              q.success ? (
                <QuoteCard key={i} quote={q.data}
                  selected={q.data.symbol === selectedSymbol}
                  onClick={() => setSelectedSymbol(q.data.symbol)} />
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Price Chart */}
      {selectedSymbol && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">
              {selectedSymbol.replace('.NS', '')} — Price Chart
            </h2>
            <div className="flex gap-1">
              {[{ l: '1M', v: '1' }, { l: '3M', v: '3' }, { l: '6M', v: '6' }].map(({ l, v }) => (
                <button key={v} onClick={() => setTimeframe(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timeframe === v ? 'bg-[#3B82F6] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
          {histLoading ? <Loader rows={4} /> : <PriceChart data={history} height={350} />}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import QuoteCard from '../components/cards/QuoteCard';
import PriceChart from '../components/charts/PriceChart';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { useMarketQuote, useMarketHistory, useMultipleQuotes, useMarketSearch } from '../hooks/useMarketData';
import useWatchlistStore from '../store/watchlistStore';

export default function Market() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('6');
  const [showDropdown, setShowDropdown] = useState(false);

  const { watchlist, addSymbol, removeSymbol } = useWatchlistStore();
  
  const { data: quotesData, isLoading: quotesLoading } = useMultipleQuotes(watchlist);
  const { data: searchResults, isLoading: isSearching } = useMarketSearch(debouncedQuery);
  const { data: searchData, isLoading: searchLoading, isError: searchError } = useMarketQuote(searchSymbol);
  const { data: historyData, isLoading: histLoading } = useMarketHistory(selectedSymbol, timeframe);

  // Debounce search input for dropdown
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setShowDropdown(!!searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSelectSymbol = (symbol) => {
    // Make sure we append .NS for Indian stocks to match backend standard
    const formattedSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
    setSearchInput(symbol);
    setSearchSymbol(formattedSymbol);
    setSelectedSymbol(formattedSymbol);
    setShowDropdown(false);
  };

  const quotes = quotesData?.data || [];
  const history = historyData?.data || [];
  const searchQuote = searchData?.data;
  const instruments = searchResults?.data || [];

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Search */}
      <div className="relative max-w-md z-50">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
        <input type="text" placeholder="Search NSE stock (e.g. TCS, RELIANCE)..."
          value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => setShowDropdown(!!searchInput.trim())}
          className="w-full bg-[#111827] border border-[#1F2937] rounded-xl pl-10 pr-4 py-3 text-white placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
        />
        
        {/* Dropdown Results */}
        {showDropdown && (debouncedQuery.length >= 2) && (
          <div className="absolute top-full left-0 w-full mt-2 bg-[#111827] border border-[#1F2937] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-[#6B7280]">Searching...</div>
            ) : instruments.length > 0 ? (
              <ul className="divide-y divide-[#1F2937]/50">
                {instruments.map((inst, idx) => (
                  <li key={idx} 
                    className="p-3 hover:bg-[#1F2937] cursor-pointer transition-colors flex justify-between items-center"
                    onClick={() => handleSelectSymbol(inst.symbol)}>
                    <span className="font-semibold text-white text-sm">{inst.symbol}</span>
                    <span className="text-xs text-[#6B7280] truncate max-w-[180px]">{inst.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-[#6B7280]">No stocks found for "{debouncedQuery}"</div>
            )}
          </div>
        )}
      </div>

      {/* Backdrop for dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}

      {/* Search result Quote */}
      {searchSymbol && !showDropdown && (
        <div className="max-w-sm relative z-0">
          {searchLoading ? <Loader rows={2} /> :
           searchError ? <ErrorState message="Could not fetch quote. Check the symbol." /> :
           searchQuote ? (
             <div className="relative group">
                <QuoteCard quote={searchQuote} onClick={() => setSelectedSymbol(searchQuote.symbol)} />
                <button 
                  onClick={() => watchlist.includes(searchQuote.symbol) ? removeSymbol(searchQuote.symbol) : addSymbol(searchQuote.symbol)}
                  className={`absolute top-4 right-4 p-2 rounded-lg border z-10 transition-colors ${
                    watchlist.includes(searchQuote.symbol) 
                      ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20' 
                      : 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20'
                  }`}
                  title={watchlist.includes(searchQuote.symbol) ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  {watchlist.includes(searchQuote.symbol) ? <Minus size={18} /> : <Plus size={18} />}
                </button>
             </div>
           ) : null}
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
                <div key={i} className="relative group">
                  <QuoteCard quote={q.data}
                    selected={q.data.symbol === selectedSymbol}
                    onClick={() => setSelectedSymbol(q.data.symbol)} />
                  <button 
                    onClick={() => removeSymbol(q.data.symbol)}
                    className="absolute top-4 right-4 p-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from Watchlist"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ) : null
            )}
            
            {quotes.length === 0 && (
              <div className="col-span-full py-8 text-center text-[#6B7280]">
                Your watchlist is empty. Search for stocks above and add them!
              </div>
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

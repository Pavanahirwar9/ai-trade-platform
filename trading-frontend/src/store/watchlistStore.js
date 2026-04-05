import { create } from 'zustand';
import { DEFAULT_WATCHLIST } from '../utils/constants';

const useWatchlistStore = create((set) => ({
  watchlist: DEFAULT_WATCHLIST.map((w) => w.symbol),
  addSymbol: (symbol) =>
    set((s) => ({
      watchlist: s.watchlist.includes(symbol) ? s.watchlist : [...s.watchlist, symbol],
    })),
  removeSymbol: (symbol) =>
    set((s) => ({ watchlist: s.watchlist.filter((w) => w !== symbol) })),
  resetWatchlist: () =>
    set({ watchlist: DEFAULT_WATCHLIST.map((w) => w.symbol) }),
}));

export default useWatchlistStore;

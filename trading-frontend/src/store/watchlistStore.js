import { create } from 'zustand';
import { DEFAULT_WATCHLIST } from '../utils/constants';
import { getWatchlist, addWatchlistSymbol, removeWatchlistSymbol } from '../api/market';

const useWatchlistStore = create((set, get) => ({
  watchlist: [], // Will be populated from DB
  isLoading: false,

  fetchWatchlist: async () => {
    set({ isLoading: true });
    try {
      const response = await getWatchlist();
      // response is already { success: true, data: [...] } because of axios interceptor
      set({ watchlist: response.data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch watchlist from server', error);
      // Fallback on error so UI doesn't completely break
      set({ watchlist: DEFAULT_WATCHLIST.map((w) => w.symbol), isLoading: false });
    }
  },

  addSymbol: async (symbol) => {
    const current = get().watchlist;
    if (current.includes(symbol)) return;

    // Optimistic UI update
    set({ watchlist: [...current, symbol] });

    try {
      await addWatchlistSymbol(symbol);
    } catch (err) {
      console.error('Failed to add symbol to DB', err);
      // Revert on error
      set({ watchlist: current });
    }
  },

  removeSymbol: async (symbol) => {
    const current = get().watchlist;
    // Optimistic UI update
    set({ watchlist: current.filter((w) => w !== symbol) });

    try {
      await removeWatchlistSymbol(symbol);
    } catch (err) {
      console.error('Failed to remove symbol from DB', err);
      // Revert on error
      set({ watchlist: current });
    }
  },

  resetWatchlist: () =>
    set({ watchlist: DEFAULT_WATCHLIST.map((w) => w.symbol) }),
}));

export default useWatchlistStore;

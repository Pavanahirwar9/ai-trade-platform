import { create } from 'zustand';

const usePortfolioStore = create((set) => ({
  cashBalance: 1000000,
  holdings: [],
  totalInvested: 0,
  setCashBalance: (val) => set({ cashBalance: val }),
  setHoldings: (arr) => set({ holdings: arr }),
  setPortfolio: (data) =>
    set({
      cashBalance: data.cashBalance ?? 1000000,
      holdings: data.holdings ?? [],
      totalInvested: data.totalInvested ?? 0,
    }),
}));

export default usePortfolioStore;

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Signals from './pages/Signals';
import Portfolio from './pages/Portfolio';
import Trades from './pages/Trades';
import AiStrategy from './pages/AiStrategy';
import useWatchlistStore from './store/watchlistStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export default function App() {
  const fetchWatchlist = useWatchlistStore((state) => state.fetchWatchlist);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market" element={<Market />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/ai-strategy" element={<AiStrategy />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#111827', color: '#F9FAFB', border: '1px solid #1F2937', fontSize: '14px' },
        success: { iconTheme: { primary: '#10B981', secondary: '#F9FAFB' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#F9FAFB' } },
      }} />
    </QueryClientProvider>
  );
}

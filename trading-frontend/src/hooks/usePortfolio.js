import { useQuery } from '@tanstack/react-query';
import { getPortfolio, getPortfolioPnL } from '../api/portfolio';
import { getTradeHistory } from '../api/trades';
import usePortfolioStore from '../store/portfolioStore';
import { useEffect } from 'react';

export const usePortfolio = () => {
  const setPortfolio = usePortfolioStore((s) => s.setPortfolio);
  const query = useQuery({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
    refetchInterval: 3000, // Faster refetch for real-time
    staleTime: 25000,
  });
  useEffect(() => {
    if (query.data?.data) setPortfolio(query.data.data);
  }, [query.data, setPortfolio]);
  return query;
};

export const usePortfolioPnL = () =>
  useQuery({
    queryKey: ['portfolio', 'pnl'],
    queryFn: getPortfolioPnL,
    refetchInterval: 3000, // Faster refetch for real-time
    staleTime: 25000,
  });

export const useTradeHistory = () =>
  useQuery({
    queryKey: ['trades'],
    queryFn: getTradeHistory,
    staleTime: 10000,
    refetchInterval: 3000, // Makes it real-time update
  });

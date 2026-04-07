import { useQuery } from '@tanstack/react-query';
import { getQuote, getHistory, getMultipleQuotes, getHealth, searchInstruments } from '../api/market';

export const useMarketSearch = (query) =>
  useQuery({
    queryKey: ['search', query],
    queryFn: () => searchInstruments(query),
    enabled: !!query && query.length >= 2,
    staleTime: 600000,
  });

export const useMarketQuote = (symbol) =>
  useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => getQuote(symbol),
    enabled: !!symbol,
    refetchInterval: 30000,
    staleTime: 25000,
    retry: 2,
  });

export const useMarketHistory = (symbol, period) =>
  useQuery({
    queryKey: ['history', symbol, period],
    queryFn: () => getHistory(symbol, period),
    enabled: !!symbol,
    staleTime: 300000,
    retry: 2,
  });

export const useMultipleQuotes = (symbols) =>
  useQuery({
    queryKey: ['quotes', symbols?.join(',')],
    queryFn: () => getMultipleQuotes(symbols),
    enabled: !!symbols?.length,
    refetchInterval: 30000,
    staleTime: 25000,
  });

export const useHealth = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30000,
    staleTime: 25000,
    retry: 1,
  });

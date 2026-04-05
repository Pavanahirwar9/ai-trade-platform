import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSignal, scanSignals } from '../api/signals';

export const useSignal = (symbol) =>
  useQuery({
    queryKey: ['signal', symbol],
    queryFn: () => getSignal(symbol),
    enabled: !!symbol,
    staleTime: 60000,
    retry: 2,
  });

export const useScanSignals = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (symbols) => scanSignals(symbols),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signal'] }),
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeTrade } from '../api/trades';

/**
 * Custom hook to execute a trade and instantly update the UI.
 * 
 * Includes automatic cache invalidation for ['portfolio'] and ['trades'].
 */
export const useExecuteTrade = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ symbol, action, quantity }) => executeTrade(symbol, action, quantity),
        onSuccess: () => {
            // Invalidate queries so that portfolio and trades automatically refresh in the background
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['trades'] });
        },
    });
};


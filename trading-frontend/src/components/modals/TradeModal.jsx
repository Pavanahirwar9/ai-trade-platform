import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { executeTrade } from '../../api/trades';
import { formatINR } from '../../utils/formatters';
import usePortfolioStore from '../../store/portfolioStore';

export default function TradeModal({ isOpen, onClose, symbol, signal, price }) {
  const [quantity, setQuantity] = useState(1);
  const qc = useQueryClient();
  const cash = usePortfolioStore((s) => s.cashBalance);

  const isBuy = signal === 'BUY';
  const grossAmount = price * quantity;
  const brokerage = grossAmount * 0.001;
  const stt = isBuy ? 0 : grossAmount * 0.001;
  const netAmount = isBuy ? grossAmount + brokerage : grossAmount - brokerage - stt;

  const mutation = useMutation({
    mutationFn: () => executeTrade(symbol, signal, quantity),
    onSuccess: () => {
      toast.success(`✅ ${signal} order placed for ${quantity} shares of ${symbol?.replace('.NS', '')}`);
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['portfolio', 'pnl'] });
      onClose();
    },
    onError: (err) => {
      toast.error(`❌ ${err.message}`);
    },
  });

  useEffect(() => { setQuantity(1); }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b border-[#1F2937] rounded-t-2xl ${
          isBuy ? 'bg-[#064E3B]/30' : 'bg-[#7F1D1D]/30'
        }`}>
          <h2 className="text-lg font-bold text-white">Execute Trade — {symbol?.replace('.NS', '')}</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Signal + Price */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9CA3AF]">Signal</p>
              <span className={`text-lg font-bold ${isBuy ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{signal}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF]">Current Price</p>
              <p className="text-lg font-bold font-mono text-white">{formatINR(price)}</p>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs text-[#9CA3AF] block mb-2">Quantity</label>
            <input type="number" min={1} value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#0A0E17] border border-[#1F2937] rounded-lg px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>

          {/* Calculation preview */}
          <div className="bg-[#0A0E17] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#9CA3AF]">{isBuy ? 'Total Cost' : 'Gross Proceeds'}</span>
              <span className="font-mono text-white">{formatINR(grossAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9CA3AF]">Brokerage (0.1%)</span>
              <span className="font-mono text-[#F59E0B]">- {formatINR(brokerage)}</span>
            </div>
            {!isBuy && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">STT (0.1%)</span>
                <span className="font-mono text-[#F59E0B]">- {formatINR(stt)}</span>
              </div>
            )}
            <hr className="border-[#1F2937]" />
            <div className="flex justify-between text-base font-bold">
              <span className="text-white">Net Amount</span>
              <span className="font-mono text-white">{formatINR(netAmount)}</span>
            </div>
          </div>

          {/* Available */}
          <p className="text-xs text-[#6B7280]">
            Available Cash: <span className="font-mono text-[#9CA3AF]">{formatINR(cash)}</span>
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-[#1F2937] hover:bg-[#374151] text-[#9CA3AF] rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 ${
                isBuy ? 'bg-[#10B981] hover:bg-[#059669]' : 'bg-[#EF4444] hover:bg-[#DC2626]'
              }`}>
              {mutation.isPending ? 'Executing...' : `Confirm ${signal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

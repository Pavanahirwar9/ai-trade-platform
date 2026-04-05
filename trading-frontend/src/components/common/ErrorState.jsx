import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 bg-[#7F1D1D] rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="text-[#EF4444]" size={28} />
      </div>
      <p className="text-[#9CA3AF] text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm transition-colors">
          Retry
        </button>
      )}
    </div>
  );
}

export default function Loader({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-shimmer rounded-lg h-16 w-full" />
      ))}
    </div>
  );
}

export function CardLoader() {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 space-y-3">
      <div className="animate-shimmer rounded h-4 w-1/3" />
      <div className="animate-shimmer rounded h-8 w-2/3" />
      <div className="animate-shimmer rounded h-4 w-1/2" />
    </div>
  );
}

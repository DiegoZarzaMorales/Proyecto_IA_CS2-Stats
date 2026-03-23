interface MetricCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export function MetricCard({ label, value, accent = true }: MetricCardProps) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-4">
      <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">{label}</div>
      <div 
        className={`text-2xl font-bold ${
          accent ? 'text-[#f97316]' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
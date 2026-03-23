interface PerformanceData {
  name: string;
  value: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-5">
      <h3 className="text-white font-semibold mb-5">Rendimiento por variable</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between mb-1.5">
              <span className="text-gray-400 text-sm">{item.name}</span>
              <span className="text-white font-semibold text-sm">{item.value}%</span>
            </div>
            <div className="w-full bg-[#0f0f1a] rounded h-2 overflow-hidden">
              <div
                className="h-full bg-[#f97316] rounded transition-all duration-500"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
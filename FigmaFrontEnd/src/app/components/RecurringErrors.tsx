import { AlertTriangle } from 'lucide-react';

interface ErrorItem {
  error: string;
  frequency: number;
  impact: string;
}

interface RecurringErrorsProps {
  errors: ErrorItem[];
}

export function RecurringErrors({ errors }: RecurringErrorsProps) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h3 className="text-white font-semibold">Errores Recurrentes</h3>
      </div>
      <div className="space-y-3">
        {errors.map((item, index) => (
          <div key={index} className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-3">
            <div className="flex items-start justify-between mb-2">
              <span className="text-white text-sm font-medium">{item.error}</span>
              <span className="text-red-400 text-xs font-semibold bg-red-400/10 px-2 py-1 rounded">
                {item.frequency}x
              </span>
            </div>
            <p className="text-gray-400 text-xs">{item.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

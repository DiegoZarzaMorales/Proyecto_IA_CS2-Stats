import { TrendingUp } from 'lucide-react';

interface ImprovementItem {
  area: string;
  current: number;
  target: number;
  priority: 'Alta' | 'Media' | 'Baja';
}

interface ImprovementAreasProps {
  areas: ImprovementItem[];
}

const priorityColors = {
  Alta: 'text-red-400 bg-red-400/10',
  Media: 'text-yellow-400 bg-yellow-400/10',
  Baja: 'text-blue-400 bg-blue-400/10',
};

export function ImprovementAreas({ areas }: ImprovementAreasProps) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#f97316]" />
        <h3 className="text-white font-semibold">Áreas de Mejora</h3>
      </div>
      <div className="space-y-3">
        {areas.map((item, index) => (
          <div key={index} className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">{item.area}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${priorityColors[item.priority]}`}>
                {item.priority}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-gray-500">Actual: </span>
                <span className="text-gray-300 font-semibold">{item.current}%</span>
              </div>
              <div className="text-gray-600">→</div>
              <div>
                <span className="text-gray-500">Objetivo: </span>
                <span className="text-[#f97316] font-semibold">{item.target}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

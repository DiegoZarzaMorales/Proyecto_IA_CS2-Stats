import { AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

type Priority = 'Alta' | 'Media' | 'Mantener';

interface RecommendationCardProps {
  priority: Priority;
  title: string;
  description: string;
}

const priorityConfig: Record<Priority, { color: string; bgColor: string; textColor: string; icon: any }> = {
  Alta: { 
    color: 'bg-red-500', 
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    icon: AlertCircle
  },
  Media: { 
    color: 'bg-yellow-500', 
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    icon: TrendingUp
  },
  Mantener: { 
    color: 'bg-green-500', 
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    icon: CheckCircle
  },
};

export function RecommendationCard({ priority, title, description }: RecommendationCardProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;
  
  return (
    <div className={`${config.bgColor} rounded p-3 border border-transparent`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 ${config.textColor} mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${config.textColor}`}>
              {priority}
            </span>
          </div>
          <h4 className="text-white font-medium text-sm mb-1">{title}</h4>
          <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
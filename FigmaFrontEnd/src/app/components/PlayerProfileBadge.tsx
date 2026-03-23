import { Target, Crosshair, Shield, Zap } from 'lucide-react';

interface PlayerProfileBadgeProps {
  primaryProfile: string;
  description: string;
}

const profileIcons: Record<string, any> = {
  'Entry Fragger': Crosshair,
  'Soporte': Shield,
  'Support': Shield,
  'Lurker (Observador)': Target,
  'Lurker': Target,
  'Francotirador (AWPer)': Zap,
  'AWPer': Zap,
  'Líder en el juego (IGL)': Shield,
  'IGL': Shield,
  'Ancla': Shield,
};

export function PlayerProfileBadge({ primaryProfile, description }: PlayerProfileBadgeProps) {
  const PrimaryIcon = profileIcons[primaryProfile] || Target;
  
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded p-5">
      <h3 className="text-white font-semibold mb-5">Tu Perfil de Jugador</h3>
      
      {/* Primary Profile */}
      <div className="bg-[#f97316] rounded p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded p-3">
            <PrimaryIcon className="w-6 h-6 text-white" />
          </div>
          <div className="text-white text-xl font-bold">{primaryProfile}</div>
        </div>
      </div>
      
      {/* Description */}
      <div className="bg-[#0f0f1a] border border-[#2a2a3e] rounded p-4">
        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
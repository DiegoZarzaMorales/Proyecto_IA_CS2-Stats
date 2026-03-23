import { useState } from 'react';

interface SideToggleProps {
  onChange?: (side: 'T' | 'CT') => void;
}

export function SideToggle({ onChange }: SideToggleProps) {
  const [selected, setSelected] = useState<'T' | 'CT'>('T');
  
  const handleToggle = (side: 'T' | 'CT') => {
    setSelected(side);
    onChange?.(side);
  };
  
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-1 flex gap-1">
      <button
        onClick={() => handleToggle('T')}
        className={`px-4 py-2 rounded font-bold text-sm transition-all ${
          selected === 'T'
            ? 'bg-red-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        T
      </button>
      <button
        onClick={() => handleToggle('CT')}
        className={`px-4 py-2 rounded font-bold text-sm transition-all ${
          selected === 'CT'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        CT
      </button>
    </div>
  );
}
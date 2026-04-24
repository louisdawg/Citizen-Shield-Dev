import React from 'react';
import { 
  Home, 
  Compass, 
  MessageSquare, 
  ShieldCheck 
} from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const BottomNav = ({ currentView, onViewChange }: BottomNavProps) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-white/90 backdrop-blur-2xl z-50 border-t border-black/5 shadow-lg">
      <BottomNavItem 
        icon={<Home size={20} />} 
        label="Hub" 
        active={currentView === 'hub'} 
        onClick={() => onViewChange('hub')} 
      />
      <BottomNavItem 
        icon={<Compass size={20} />} 
        label="Regions" 
        active={currentView === 'regions'} 
        onClick={() => onViewChange('regions')} 
      />
      <BottomNavItem 
        icon={<MessageSquare size={20} />} 
        label="Feed" 
        active={currentView === 'security'} 
        onClick={() => onViewChange('security')} 
      />
      <BottomNavItem 
        icon={<ShieldCheck size={20} />} 
        label="Safety" 
        active={currentView === 'safety'} 
        onClick={() => onViewChange('safety')} 
      />
    </nav>
  );
};

const BottomNavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center transition-all active:scale-90 py-1 px-4 rounded-xl ${
      active ? 'text-primary bg-primary/10' : 'text-gray-500'
    }`}
  >
    {icon}
    <span className="font-body text-[10px] uppercase tracking-widest mt-1">{label}</span>
  </button>
);

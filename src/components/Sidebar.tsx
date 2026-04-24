import React from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  Shield,
  Globe,
  LogOut,
  LogIn,
  Gavel,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const { firebaseUser, signIn, signOut } = useAuth();
  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen bg-background border-r border-black/5 z-40 pt-24 pb-8">
      <div className="px-6 mb-8">
        <h2 className="text-xl font-bold text-primary font-headline tracking-tight">COMMUNITY HUB</h2>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.3em] font-bold">Citizen Shield Active</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        <NavItem 
          icon={<Globe size={20} />} 
          label="Global Hub" 
          active={currentView === 'hub'} 
          onClick={() => onViewChange('hub')} 
        />
        <NavItem 
          icon={<MapIcon size={20} />} 
          label="Country Timelines" 
          active={currentView === 'regions'} 
          onClick={() => onViewChange('regions')} 
        />
        <NavItem 
          icon={<Shield size={20} />} 
          label="Secure Feed" 
          active={currentView === 'security'} 
          onClick={() => onViewChange('security')} 
        />
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          active={currentView === 'dashboard'} 
          onClick={() => onViewChange('dashboard')} 
        />
        
        <div className="pt-10 px-4 space-y-2">
          {firebaseUser ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signOut}
              className="w-full py-3 bg-error-container text-white rounded-xl font-bold uppercase text-xs tracking-tighter flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              <LogOut size={14} />
              Sign Out
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signIn}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold uppercase text-xs tracking-tighter flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              <LogIn size={14} />
              Sign In
            </motion.button>
          )}
        </div>
      </nav>
      
      <div className="px-4 space-y-1">
        <a href="#" className="flex items-center gap-3 py-2 px-4 text-xs text-gray-600 hover:text-primary transition-all">
          <Gavel size={14} />
          <span>Safety Protocol</span>
        </a>
        <a href="#" className="flex items-center gap-3 py-2 px-4 text-xs text-gray-600 hover:text-primary transition-all">
          <ShieldCheck size={14} />
          <span>Legal Aid</span>
        </a>
      </div>
    </aside>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-[calc(100%-16px)] flex items-center gap-3 py-3 px-4 mx-2 transition-all duration-200 rounded-lg cursor-pointer ${
      active 
        ? 'bg-primary text-white shadow-sm' 
        : 'text-gray-500 hover:text-primary hover:bg-black/5'
    }`}
  >
    <div className={active ? 'text-white' : 'text-gray-500'}>{icon}</div>
    <span className="font-medium">{label}</span>
  </button>
);

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, ShieldAlert, Globe } from 'lucide-react';
import { Region } from '../types';

interface RegionSelectorProps {
  regions: Region[];
  activeRegionId: string;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({ 
  regions, 
  activeRegionId, 
  onSelect, 
  onClose 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-black/5"
      >
        {/* Header */}
        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="font-headline font-black text-3xl uppercase tracking-tighter">Select Active Region</h2>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em]">Global Community Monitoring Network</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant"
          >
            <X size={24} />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <motion.button
                key={region.id}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelect(index);
                  onClose();
                }}
                className={`relative p-6 rounded-3xl border-2 text-left transition-all group overflow-hidden ${
                  activeRegionId === region.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-black/5 bg-surface-container-low hover:border-primary/20'
                }`}
              >
                {/* Background Image Overlay */}
                <div className="absolute inset-0 z-0 opacity-10 grayscale group-hover:opacity-20 transition-opacity">
                  <img src={region.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-2 rounded-xl ${
                      activeRegionId === region.id ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      <MapPin size={18} />
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                      region.intensity === 'CRITICAL' ? 'bg-primary text-white' : 
                      region.intensity === 'HIGH' ? 'bg-primary-dim text-white' : 
                      region.intensity === 'ALERT' ? 'bg-tertiary text-white' : 'bg-secondary text-white'
                    }`}>
                      {region.intensity}
                    </div>
                  </div>

                  <h3 className="font-headline font-black text-2xl uppercase tracking-tighter mb-2">{region.name}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-6 leading-relaxed">
                    {region.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-black/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Hubs</span>
                      <span className="font-black text-lg">{region.activeHubs}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Signal</span>
                      <span className="font-black text-lg text-primary">{region.connectivity}%</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-surface-container-low border-t border-black/5 text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em]">
            Real-time monitoring active for all verified community hubs
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

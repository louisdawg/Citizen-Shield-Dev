import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Heart, 
  ShieldCheck, 
  Handshake, 
  Info, 
  Map as MapIcon,
  BookOpen,
  PhoneCall,
  Globe,
  Activity
} from 'lucide-react';

import { Region } from '../types';

interface HubViewProps {
  regions: Region[];
}

export const HubView = ({ regions }: HubViewProps) => {
  const totalHubs = regions.reduce((acc, r) => acc + r.activeHubs, 0);
  const avgConnectivity = Math.round(regions.reduce((acc, r) => acc + r.connectivity, 0) / regions.length);

  return (
    <div className="space-y-12">
      <header>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white rounded-full shadow-sm">Global Network Hub</span>
              <span className="text-on-surface-variant text-xs flex items-center gap-2">
                <Globe size={12} />
                Monitoring {regions.length} Active Regions
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter text-on-surface leading-none mb-4 uppercase">
              GLOBAL HUB
            </h1>
            <p className="text-xl text-on-surface-variant max-w-xl">
              Centralized coordination for community-led support, mutual aid resources, and verified safety information worldwide.
            </p>
          </div>
        </motion.div>
      </header>

      {/* Global Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Active Hubs" value={totalHubs.toString()} icon={<Users size={20} />} color="text-primary" />
        <StatCard title="Avg Connectivity" value={`${avgConnectivity}%`} icon={<Activity size={20} />} color="text-secondary" />
        <StatCard title="Active Regions" value={regions.length.toString()} icon={<Globe size={20} />} color="text-tertiary" />
        <StatCard title="Verified Nodes" value="1,240" icon={<ShieldCheck size={20} />} color="text-primary" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Regional Overview */}
        <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-3xl border border-black/5">
          <h3 className="font-headline font-black text-2xl uppercase tracking-tighter mb-6 flex items-center gap-3">
            <MapIcon className="text-primary" />
            Regional Status Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regions.map(region => (
              <div key={region.id} className="p-4 bg-background rounded-2xl border border-black/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-lg uppercase tracking-tighter">{region.name}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                    region.intensity === 'CRITICAL' ? 'bg-primary text-white' : 
                    region.intensity === 'HIGH' ? 'bg-primary-dim text-white' : 
                    region.intensity === 'ALERT' ? 'bg-tertiary text-white' : 'bg-secondary text-white'
                  }`}>
                    {region.intensity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                  <span>Hubs: {region.activeHubs}</span>
                  <span>Signal: {region.connectivity}%</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${region.connectivity}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Resources */}
        <div className="bg-surface-container-low p-8 rounded-3xl border border-black/5 flex flex-col">
          <h3 className="font-headline font-black text-2xl uppercase tracking-tighter mb-6 flex items-center gap-3">
            <BookOpen className="text-secondary" />
            Global Resources
          </h3>
          <div className="space-y-3 flex-1">
            <ResourceItem title="International Legal Rights" category="Legal" />
            <ResourceItem title="Digital Security Protocol" category="Security" />
            <ResourceItem title="Cross-Border Aid Logistics" category="Aid" />
            <ResourceItem title="Crisis Communication Guide" category="Comms" />
            <ResourceItem title="Medical First Response" category="Medical" />
          </div>
          <button className="mt-8 w-full py-4 bg-primary text-white font-black rounded-xl uppercase tracking-tighter hover:scale-[1.02] transition-all">
            Access Resource Library
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) => (
  <div className="bg-surface-container-high p-6 rounded-2xl border border-black/5 flex flex-col justify-between">
    <div className={`p-2 rounded-lg w-fit bg-background mb-4 ${color}`}>
      {icon}
    </div>
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-1">{title}</h4>
      <div className="text-3xl font-headline font-black">{value}</div>
    </div>
  </div>
);

const ResourceItem = ({ title, category }: { title: string, category: string }) => (
  <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-black/5 hover:border-primary/20 transition-all cursor-pointer group">
    <span className="font-bold text-sm">{title}</span>
    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded-md group-hover:bg-primary group-hover:text-white transition-all">
      {category}
    </span>
  </div>
);

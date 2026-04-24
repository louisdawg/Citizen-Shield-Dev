import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Heart, 
  Users, 
  Info, 
  CheckCircle2,
  FileText,
  Lock,
  Smartphone,
  MapPin,
  PhoneCall
} from 'lucide-react';
import { Region } from '../types';
import { carouselVariants } from '../constants';

interface SafetyViewProps {
  activeRegion: Region;
  direction: number;
}

export const SafetyView = ({ activeRegion, direction }: SafetyViewProps) => {
  return (
    <div className="space-y-12">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeRegion.id}
          custom={direction}
          variants={carouselVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="space-y-12"
        >
          <header>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white rounded-full shadow-sm">Safety Protocol</span>
                  <span className="text-on-surface-variant text-xs flex items-center gap-2 uppercase font-bold tracking-widest">
                    <MapPin size={12} />
                    {activeRegion.name} Local Guidelines
                  </span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter text-on-surface leading-none mb-4 uppercase">SAFETY HUB</h1>
                <p className="text-xl text-on-surface-variant max-w-xl">
                  Essential safety protocols, emergency guides, and mutual aid resources for community protection and resilience in {activeRegion.name}.
                </p>
              </div>
            </div>
          </header>

          {/* Local Emergency Info */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <PhoneCall size={24} />
                  <h3 className="font-headline font-black text-xl uppercase tracking-tighter">Emergency Hotline</h3>
                </div>
                <p className="text-4xl font-black font-headline text-primary mb-2">{activeRegion.localInfo.emergencyContact}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest leading-relaxed">
                  Verified regional emergency coordination node. Available 24/7 for critical support.
                </p>
              </div>
            </div>

            <div className="bg-secondary/5 p-8 rounded-3xl border border-secondary/20 md:col-span-2">
              <div className="flex items-center gap-3 mb-6 text-secondary">
                <MapPin size={24} />
                <h3 className="font-headline font-black text-xl uppercase tracking-tighter">Verified Safe Zones in {activeRegion.name}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRegion.localInfo.safeZones.map((zone, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-secondary/10 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-bold text-sm">{zone}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-low p-10 rounded-3xl border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={120} className="text-primary" />
              </div>
              <div className="relative z-10">
                <h3 className="font-headline font-black text-3xl uppercase tracking-tighter text-primary mb-6 flex items-center gap-3">
                  <ShieldCheck size={32} />
                  Core Safety Protocol
                </h3>
                <ul className="space-y-4">
                  <SafetyListItem 
                    title="Check-in with Local Hub" 
                    description="Always notify your local community hub of your status and location."
                  />
                  <SafetyListItem 
                    title="Verified Information" 
                    description="Only share information that has been cross-verified by community nodes."
                  />
                  <SafetyListItem 
                    title="Emergency Supplies" 
                    description="Keep a basic first aid kit, water, and non-perishable food accessible."
                  />
                  <SafetyListItem 
                    title="Cluster Movement" 
                    description="Avoid moving alone; stay within your community clusters for safety."
                  />
                </ul>
              </div>
            </div>

            <div className="bg-surface-container-low p-10 rounded-3xl border border-secondary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Lock size={120} className="text-secondary" />
              </div>
              <div className="relative z-10">
                <h3 className="font-headline font-black text-3xl uppercase tracking-tighter text-secondary mb-6 flex items-center gap-3">
                  <Lock size={32} />
                  Digital Security
                </h3>
                <ul className="space-y-4">
                  <SafetyListItem 
                    title="Secure Communication" 
                    description="Use encrypted messaging apps for all community coordination."
                  />
                  <SafetyListItem 
                    title="Metadata Protection" 
                    description="Remove EXIF data from photos before sharing them on the feed."
                  />
                  <SafetyListItem 
                    title="VPN Usage" 
                    description="Always use a verified VPN when accessing community resources."
                  />
                  <SafetyListItem 
                    title="Device Security" 
                    description="Enable full-disk encryption and strong passcodes on all devices."
                  />
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-high p-12 rounded-3xl border border-black/5">
            <h3 className="font-headline font-black text-3xl uppercase tracking-tighter mb-8 text-center">Available Resources in {activeRegion.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeRegion.localInfo.resources.map((resource, i) => (
                <div key={i} className="bg-background p-6 rounded-2xl border border-black/5 flex items-center gap-4 hover:border-primary/20 transition-all">
                  <div className="p-3 bg-tertiary/10 rounded-xl text-tertiary">
                    <Heart size={20} />
                  </div>
                  <span className="font-bold text-sm">{resource}</span>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const SafetyListItem = ({ title, description }: { title: string, description: string }) => (
  <li className="flex gap-4">
    <div className="flex-shrink-0 mt-1">
      <CheckCircle2 size={18} className="text-primary" />
    </div>
    <div>
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
    </div>
  </li>
);

const GuideCard = ({ title, icon, links }: { title: string, icon: React.ReactNode, links: string[] }) => (
  <div className="bg-background p-8 rounded-2xl border border-black/5 hover:border-primary/20 transition-all">
    <div className="mb-6 flex items-center gap-3">
      {icon}
      <h4 className="font-headline font-black text-xl uppercase tracking-tighter">{title}</h4>
    </div>
    <ul className="space-y-3">
      {links.map((link, i) => (
        <li key={i} className="text-sm text-on-surface-variant hover:text-primary transition-all cursor-pointer flex items-center gap-2">
          <div className="w-1 h-1 bg-on-surface-variant/30 rounded-full" />
          {link}
        </li>
      ))}
    </ul>
  </div>
);

import React from 'react';
import {
  Radio,
  Clock,
  Filter,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { TimelineItem } from '../components/TimelineItem';
import { Post, Region } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { carouselVariants } from '../constants';

interface FeedViewProps {
  posts: Post[];
  regions: Region[];
  activeRegion: Region;
  direction: number;
  loadingPosts: boolean;
  onPostClick: () => void;
  onRegionSelect: (index: number) => void;
  onVote: (postId: string, voteType: 'upvote' | 'downvote') => void;
}

export const FeedView = ({ posts, regions, activeRegion, direction, loadingPosts, onPostClick, onRegionSelect, onVote }: FeedViewProps) => {
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
                  <span className="bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white rounded-full shadow-sm">Real-time Feed</span>
                  <span className="text-on-surface-variant text-xs flex items-center gap-2">
                    <Clock size={12} />
                    Live Updates: {activeRegion.name}
                  </span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter text-on-surface leading-none mb-4 uppercase">
                  {activeRegion.name} FEED
                </h1>
                <p className="text-xl text-on-surface-variant max-w-xl">
                  Verified reports from community hubs across {activeRegion.name}. Stay informed with real-time, citizen-led intelligence.
                </p>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-surface-container-high border border-black/5 rounded-xl font-bold font-headline uppercase tracking-tighter text-sm hover:bg-surface-container-highest transition-all">
                  <Filter size={16} />
                  Filter Reports
                </button>
                <button
                  onClick={onPostClick}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold font-headline uppercase tracking-tighter text-sm hover:scale-105 transition-all shadow-md shadow-primary/20"
                >
                  <Radio size={16} />
                  Submit Report
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
            <section className="col-span-12 lg:col-span-8 relative">
              <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-primary/10" />

              {loadingPosts ? (
                <div className="p-12 text-center">
                  <Loader2 size={32} className="mx-auto animate-spin text-primary/40" />
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <TimelineItem
                    key={post.id}
                    id={post.id}
                    time={post.time}
                    title={post.title}
                    description={post.description}
                    type={post.type}
                    image={post.image}
                    tags={post.tags}
                    upvoteCount={post.upvoteCount}
                    downvoteCount={post.downvoteCount}
                    author={post.author}
                    onVote={onVote}
                  />
                ))
              ) : (
                <div className="p-12 text-center bg-surface-container-low rounded-3xl border border-dashed border-black/10">
                  <Radio size={48} className="mx-auto mb-4 text-on-surface-variant opacity-20" />
                  <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">No recent reports for {activeRegion.name}</p>
                </div>
              )}
            </section>

            <aside className="col-span-12 lg:col-span-4 space-y-6">
              {/* Regional Summary Card */}
              <div className="bg-surface-container-low p-6 rounded-3xl border border-black/5 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <ShieldAlert size={20} />
                  <h3 className="font-headline font-black text-xl uppercase tracking-tighter">Regional Status</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-on-surface-variant">Emergency</span>
                    <span className="font-headline font-black text-on-surface">{activeRegion.localInfo.emergencyContact}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-on-surface-variant">Active Hubs</span>
                    <span className="font-headline font-black text-secondary">{activeRegion.activeHubs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-on-surface-variant">Connectivity</span>
                    <span className="font-headline font-black text-primary">{activeRegion.connectivity}%</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-black/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Safe Zones</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeRegion.localInfo.safeZones.slice(0, 2).map((zone, i) => (
                      <span key={i} className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-md uppercase tracking-tighter">
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-high p-6 rounded-3xl border border-black/5">
                <h3 className="font-headline font-black text-xl uppercase tracking-tighter mb-4">Switch Region</h3>
                <div className="space-y-3">
                  {regions.map((region, index) => (
                    <RegionStatus
                      key={region.id}
                      name={region.name}
                      status={region.intensity}
                      isActive={activeRegion.id === region.id}
                      onClick={() => onRegionSelect(index)}
                      color={
                        region.intensity === 'CRITICAL' ? 'text-primary' :
                        region.intensity === 'HIGH' ? 'text-primary-dim' :
                        region.intensity === 'ALERT' ? 'text-tertiary' : 'text-secondary'
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20">
                <h3 className="font-headline font-black text-xl uppercase tracking-tighter text-primary mb-2">Verification Protocol</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  All reports in this feed are cross-verified by at least two independent community hubs. If you see unverified information, please flag it for review.
                </p>
              </div>
            </aside>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

interface RegionStatusProps {
  name: string;
  status: string;
  color: string;
  isActive?: boolean;
  onClick?: () => void;
}

const RegionStatus: React.FC<RegionStatusProps> = ({ name, status, color, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
      isActive ? 'bg-primary/5 border-primary' : 'bg-background border-black/5 hover:border-primary/20'
    }`}
  >
    <span className={`font-bold text-sm uppercase tracking-tighter ${isActive ? 'text-primary' : ''}`}>{name}</span>
    <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</span>
  </button>
);

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Radio,
  ShieldAlert,
  Verified,
  Map as MapIcon,
  Heart,
  Users,
  ShieldCheck,
  Handshake,
  Info,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { BottomNav } from './components/BottomNav';
import { TimelineItem } from './components/TimelineItem';
import { Chat } from './components/Chat';
import { PostForm } from './components/PostForm';
import { RegionSelector } from './components/RegionSelector';
import { HubView } from './views/HubView';
import { FeedView } from './views/FeedView';
import { SafetyView } from './views/SafetyView';
import { INITIAL_REGIONS, INITIAL_POSTS } from './data';
import { Post, Region, PostType } from './types';
import { carouselVariants } from './constants';
import { fetchRegions, fetchRegionDetail, fetchPosts, createPost, voteOnPost, joinRegion } from './api';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { firebaseUser, signIn } = useAuth();
  const [currentView, setCurrentView] = useState('regions');
  const [activeChatRegion, setActiveChatRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeRegionIndex, setActiveRegionIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [isRegionSelectorOpen, setIsRegionSelectorOpen] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [joining, setJoining] = useState(false);

  const activeRegion = regions[activeRegionIndex];
  const regionPosts = posts.filter(p => p.regionId === activeRegion.slug);

  // Fetch regions from API on mount
  useEffect(() => {
    fetchRegions()
      .then(setRegions)
      .catch(() => { /* fallback to INITIAL_REGIONS already in state */ });
  }, []);

  // Fetch region detail (safe zones, resources) when active region changes
  useEffect(() => {
    if (!activeRegion) return;
    fetchRegionDetail(activeRegion.slug)
      .then((detail) => {
        setRegions(prev => prev.map(r => r.slug === detail.slug ? detail : r));
      })
      .catch(() => { /* keep existing data */ });
  }, [activeRegion?.slug]);

  // Fetch posts when active region changes
  const loadPosts = useCallback((slug: string) => {
    setLoadingPosts(true);
    fetchPosts(slug)
      .then((apiPosts) => {
        setPosts(prev => {
          const otherRegionPosts = prev.filter(p => p.regionId !== slug);
          return [...apiPosts, ...otherRegionPosts];
        });
      })
      .catch(() => { /* fallback to existing posts */ })
      .finally(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    if (!activeRegion) return;
    loadPosts(activeRegion.slug);
  }, [activeRegion?.slug, loadPosts]);

  const handleNewPost = async (newPostData: { title: string; description: string; type: PostType; imageUrl?: string }) => {
    if (!firebaseUser) return;

    try {
      await createPost({
        regionSlug: activeRegion.slug,
        title: newPostData.title,
        description: newPostData.description,
        type: newPostData.type,
        imageUrl: newPostData.imageUrl,
      });
      // Reload posts to get the new one from the DB
      loadPosts(activeRegion.slug);
    } catch (err) {
      console.error('Failed to create post:', err);
      // Optimistic fallback: add to local state
      const fallbackPost: Post = {
        id: Date.now().toString(),
        regionId: activeRegion.slug,
        time: 'Just Now',
        title: newPostData.title,
        description: newPostData.description,
        type: newPostData.type,
        image: newPostData.imageUrl,
        upvoteCount: 0,
        downvoteCount: 0,
      };
      setPosts(prev => [fallbackPost, ...prev]);
    }
  };

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!firebaseUser) {
      signIn();
      return;
    }
    try {
      const result = await voteOnPost(postId, voteType);
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, upvoteCount: result.upvoteCount, downvoteCount: result.downvoteCount }
          : p
      ));
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleJoinRegion = async () => {
    if (!firebaseUser) {
      signIn();
      return;
    }
    setJoining(true);
    try {
      await joinRegion(activeRegion.slug);
    } catch (err) {
      console.error('Join region failed:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleOpenPostForm = () => {
    if (!firebaseUser) {
      signIn();
      return;
    }
    setIsPostFormOpen(true);
  };

  const nextRegion = () => {
    setDirection(1);
    setActiveRegionIndex((prev) => (prev + 1) % regions.length);
  };
  const prevRegion = () => {
    setDirection(-1);
    setActiveRegionIndex((prev) => (prev - 1 + regions.length) % regions.length);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary selection:text-black">
      <TopNav currentView={currentView} onViewChange={setCurrentView} />
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <main className="lg:pl-64 pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto overflow-x-hidden">
        <AnimatePresence>
          {activeChatRegion && (
            <Chat
              region={activeChatRegion}
              onClose={() => setActiveChatRegion(null)}
            />
          )}
          {isPostFormOpen && (
            <PostForm
              regionSlug={activeRegion.slug}
              onClose={() => setIsPostFormOpen(false)}
              onSubmit={handleNewPost}
            />
          )}
          {isRegionSelectorOpen && (
            <RegionSelector
              regions={regions}
              activeRegionId={activeRegion.id}
              onSelect={setActiveRegionIndex}
              onClose={() => setIsRegionSelectorOpen(false)}
            />
          )}
        </AnimatePresence>

        <div className="relative overflow-x-hidden">
          <AnimatePresence mode="wait">
            {currentView === 'regions' ? (
              <motion.div
                key="regions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
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
                  >
                    {/* Hero Section */}
                    <header className="mb-12">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white rounded-full shadow-sm">Community Alert</span>
                            <span className="text-on-surface-variant text-xs">Verified by Local Hub: 12m ago</span>
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            <button onClick={prevRegion} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                              <ChevronLeft size={32} className="text-primary" />
                            </button>
                            <button
                              onClick={() => setIsRegionSelectorOpen(true)}
                              className="text-6xl md:text-8xl font-black font-headline tracking-tighter text-on-surface leading-none uppercase hover:text-primary transition-colors text-left"
                            >
                              {activeRegion.name}
                            </button>
                            <button onClick={nextRegion} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                              <ChevronRight size={32} className="text-primary" />
                            </button>
                          </div>

                          <p className="text-xl text-on-surface-variant max-w-xl">
                            {activeRegion.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleJoinRegion}
                            disabled={joining}
                            className="bg-primary text-white px-6 py-3 rounded-xl font-bold font-headline uppercase tracking-tighter flex items-center gap-2 disabled:opacity-60"
                          >
                            {joining ? <Loader2 size={18} className="animate-spin" /> : <Handshake size={18} />}
                            Offer Support
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentView('safety')}
                            className="bg-surface-container-highest border border-black/5 text-on-surface px-6 py-3 rounded-xl font-bold font-headline uppercase tracking-tighter"
                          >
                            Safety Guide
                          </motion.button>
                        </div>
                      </div>
                    </header>

                    {/* Bento Stats Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
                      <div className="md:col-span-2 bg-surface-container-low p-8 rounded-xl relative overflow-hidden group border border-black/5">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-[0.2em] mb-4">Intensity Level</h3>
                        <div className={`text-4xl font-headline font-black mb-2 ${
                          activeRegion.intensity === 'CRITICAL' ? 'text-primary' :
                          activeRegion.intensity === 'HIGH' ? 'text-primary-dim' :
                          activeRegion.intensity === 'ALERT' ? 'text-tertiary' : 'text-secondary'
                        }`}>
                          {activeRegion.intensity}
                        </div>
                        <p className="text-sm text-on-surface-variant">Real-time mobilization status confirmed by local community nodes.</p>
                      </div>

                      <div className="bg-surface-container-high p-6 rounded-xl border-l-4 border-secondary flex flex-col justify-between border-y border-r border-black/5">
                        <h3 className="text-secondary text-xs font-bold uppercase tracking-widest">Active Hubs</h3>
                        <div className="text-5xl font-headline font-black text-secondary">{activeRegion.activeHubs}</div>
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Verified nodes</p>
                      </div>

                      <div className="bg-surface-container-high p-6 rounded-xl border-l-4 border-primary flex flex-col justify-between border-y border-r border-black/5">
                        <h3 className="text-primary text-xs font-bold uppercase tracking-widest">Connectivity</h3>
                        <div className="text-5xl font-headline font-black text-primary">{activeRegion.connectivity}%</div>
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Signal integrity</p>
                      </div>
                    </section>

                    {/* Local Information Section */}
                    <section className="mb-16">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface-container-low p-6 rounded-2xl border border-black/5">
                          <div className="flex items-center gap-3 mb-4 text-primary">
                            <ShieldAlert size={20} />
                            <h4 className="font-headline font-black uppercase tracking-tighter">Emergency Contact</h4>
                          </div>
                          <p className="text-2xl font-black font-headline text-on-surface">{activeRegion.localInfo.emergencyContact}</p>
                          <p className="text-xs text-on-surface-variant mt-2 uppercase font-bold tracking-widest">Verified Regional Hotline</p>
                        </div>

                        <div className="bg-surface-container-low p-6 rounded-2xl border border-black/5">
                          <div className="flex items-center gap-3 mb-4 text-secondary">
                            <MapIcon size={20} />
                            <h4 className="font-headline font-black uppercase tracking-tighter">Verified Safe Zones</h4>
                          </div>
                          <ul className="space-y-2">
                            {activeRegion.localInfo.safeZones.map((zone, i) => (
                              <li key={i} className="text-sm font-bold flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                {zone}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-surface-container-low p-6 rounded-2xl border border-black/5">
                          <div className="flex items-center gap-3 mb-4 text-tertiary">
                            <Heart size={20} />
                            <h4 className="font-headline font-black uppercase tracking-tighter">Available Resources</h4>
                          </div>
                          <ul className="space-y-2">
                            {activeRegion.localInfo.resources.map((resource, i) => (
                              <li key={i} className="text-sm font-bold flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                                {resource}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </section>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-12 gap-8">
                      {/* Timeline Section */}
                      <section className="col-span-12 lg:col-span-8 relative">
                        <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-primary/10" />

                        {loadingPosts ? (
                          <div className="p-12 text-center">
                            <Loader2 size={32} className="mx-auto animate-spin text-primary/40" />
                          </div>
                        ) : regionPosts.length > 0 ? (
                          regionPosts.map(post => (
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
                              onVote={handleVote}
                            />
                          ))
                        ) : (
                          <div className="p-12 text-center bg-surface-container-low rounded-3xl border border-dashed border-black/10">
                            <Radio size={48} className="mx-auto mb-4 text-on-surface-variant opacity-20" />
                            <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">No recent reports for this region</p>
                          </div>
                        )}
                      </section>

                      {/* Sidebar Section */}
                      <aside className="col-span-12 lg:col-span-4 space-y-6">
                        {/* Map Card */}
                        <div className="bg-surface-container-high rounded-xl overflow-hidden border border-black/5">
                          <div className="p-4 border-b border-black/5 flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Community Safety Map</span>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            </div>
                          </div>
                          <div className="aspect-square bg-surface-container-highest flex items-center justify-center relative">
                            <img
                              className="w-full h-full object-cover opacity-50 grayscale"
                              src={activeRegion.mapImage}
                              alt={`${activeRegion.name} Map`}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-white/80 text-primary px-4 py-2 rounded-xl backdrop-blur-md border border-primary/20 font-bold uppercase text-xs shadow-sm">
                                Updating Safety Nodes...
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Reporting Tools */}
                        <div className="bg-surface-container p-6 rounded-xl space-y-4 border border-black/5">
                          <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Community Tools</h5>
                          <ActionButton
                            label="Join Regional Chat"
                            icon={<MessageSquare size={18} />}
                            color="text-primary"
                            onClick={() => setActiveChatRegion(activeRegion.id)}
                          />
                          <ActionButton label="Request Emergency Aid" icon={<Heart size={18} />} color="text-secondary" />
                          <ActionButton
                            label="Share Safety Update"
                            icon={<Radio size={18} />}
                            color="text-tertiary"
                            onClick={handleOpenPostForm}
                          />
                          <ActionButton label="Volunteer for Local Hub" icon={<Users size={18} />} color="text-primary" />
                        </div>

                        {/* Safety Protocol */}
                        <div className="p-6 rounded-xl bg-surface-container-low border border-primary/20">
                          <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="text-primary" size={20} />
                            <h5 className="font-bold text-primary uppercase tracking-tighter">Safety Protocol: Level 1</h5>
                          </div>
                          <ul className="text-xs text-on-surface-variant space-y-2 list-disc pl-4">
                            <li>Check in with your local community hub daily</li>
                            <li>Share verified information only to prevent panic</li>
                            <li>Keep emergency supplies accessible</li>
                          </ul>
                        </div>
                      </aside>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
          ) : currentView === 'hub' ? (
            <motion.div
              key="hub"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <HubView regions={regions} />
            </motion.div>
          ) : currentView === 'security' ? (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FeedView
                posts={regionPosts}
                regions={regions}
                activeRegion={activeRegion}
                direction={direction}
                loadingPosts={loadingPosts}
                onPostClick={handleOpenPostForm}
                onRegionSelect={setActiveRegionIndex}
                onVote={handleVote}
              />
            </motion.div>
          ) : currentView === 'safety' ? (
            <motion.div
              key="safety"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SafetyView
                activeRegion={activeRegion}
                direction={direction}
              />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-[60vh] text-center px-4"
            >
              <div className="p-12 bg-surface-container-low rounded-3xl border border-black/5 relative overflow-hidden">
                <div className="relative z-20">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Info size={80} className="text-primary/40 mx-auto mb-8" />
                  </motion.div>

                  <h2 className="text-4xl font-headline font-black mb-4 uppercase tracking-tighter text-primary">
                    {currentView.toUpperCase()} HUB COMING SOON
                  </h2>
                  <div className="w-24 h-1 bg-primary/10 mx-auto mb-6 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-full h-full bg-primary/40"
                    />
                  </div>
                  <p className="text-on-surface-variant max-w-md mx-auto font-body text-sm leading-relaxed">
                    Our community volunteers are currently organizing the {currentView} resources.
                    We are working to ensure all information is verified and safe for public use.
                    Check back soon for updates.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentView('regions')}
                    className="mt-10 px-10 py-4 bg-primary text-white font-black rounded-xl uppercase tracking-tighter transition-all"
                  >
                    Return to Safety Hub
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>

      <footer className="w-full py-12 px-8 bg-background border-t border-surface-container-high flex flex-col md:flex-row justify-between items-center gap-6 mt-20">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="font-headline font-bold text-primary text-2xl uppercase tracking-tighter flex items-center gap-2">
            <ShieldCheck size={24} />
            CITIZEN SHIELD
          </div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-gray-600 uppercase">&copy; 2024 CITIZEN SHIELD. COMMUNITY POWERED.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <FooterLink label="Community Guidelines" />
          <FooterLink label="Mutual Aid" />
          <FooterLink label="Emergency Contact" />
          <FooterLink label="Privacy Policy" />
        </div>
      </footer>

      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

const ActionButton = ({ label, icon, color, onClick }: { label: string, icon: React.ReactNode, iconColor?: string, color?: string, onClick?: () => void }) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container-highest rounded-lg transition-all group"
  >
    <span className="font-bold text-sm">{label}</span>
    <div className={`${color} transition-transform`}>{icon}</div>
  </motion.button>
);

const FooterLink = ({ label }: { label: string }) => (
  <a href="#" className="text-xs font-light tracking-wide text-gray-600 hover:text-primary transition-all">
    {label}
  </a>
);

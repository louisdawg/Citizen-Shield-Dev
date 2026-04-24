import React, { useState, useRef, useEffect } from 'react';
import { Shield, Bell, ShieldCheck, LogIn, LogOut, User as UserIcon, Verified } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const TopNav = ({ currentView, onViewChange }: TopNavProps) => {
  const { firebaseUser, dbUser, loading, signIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl flex justify-between items-center px-6 py-4 border-b border-black/5">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => onViewChange('hub')}
      >
        <div className="relative">
          <ShieldCheck size={28} className="text-primary group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-2xl font-black tracking-tighter text-on-surface uppercase font-headline">CITIZEN SHIELD</div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <NavLink label="Hub" active={currentView === 'hub'} onClick={() => onViewChange('hub')} />
        <NavLink label="Regions" active={currentView === 'regions'} onClick={() => onViewChange('regions')} />
        <NavLink label="Community" active={currentView === 'community'} onClick={() => onViewChange('community')} />
        <NavLink label="Security" active={currentView === 'security'} onClick={() => onViewChange('security')} />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center bg-surface-container px-3 py-1.5 rounded-xl">
          <Shield size={14} className="text-on-surface-variant mr-2" />
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Community Shield</span>
        </div>

        {loading ? (
          <div className="w-8 h-8 rounded-full bg-surface-container-highest animate-pulse" />
        ) : firebaseUser ? (
          <>
            <button className="p-2 text-on-surface hover:text-primary transition-colors">
              <Bell size={20} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest border-2 border-transparent hover:border-primary/30 transition-all"
              >
                {firebaseUser.photoURL ? (
                  <img
                    className="w-full h-full object-cover"
                    src={firebaseUser.photoURL}
                    alt={firebaseUser.displayName ?? 'User'}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <UserIcon size={16} />
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden z-50">
                  <div className="p-4 border-b border-black/5 bg-surface-container-low">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0">
                        {firebaseUser.photoURL ? (
                          <img
                            className="w-full h-full object-cover"
                            src={firebaseUser.photoURL}
                            alt={firebaseUser.displayName ?? 'User'}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                            <UserIcon size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm truncate">{firebaseUser.displayName}</p>
                          {dbUser?.isVerified && <Verified size={14} className="text-secondary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-on-surface-variant truncate">{firebaseUser.email}</p>
                      </div>
                    </div>
                  </div>

                  {dbUser && (
                    <div className="p-3 border-b border-black/5 grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-surface-container-low rounded-lg">
                        <p className="text-lg font-black font-headline">{dbUser.stats.totalPosts}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Posts</p>
                      </div>
                      <div className="text-center p-2 bg-surface-container-low rounded-lg">
                        <p className="text-lg font-black font-headline">{dbUser.stats.totalUpvotesReceived}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Upvotes</p>
                      </div>
                    </div>
                  )}

                  <div className="p-2">
                    <button
                      onClick={() => { signOut(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-error hover:bg-error/5 rounded-xl transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={signIn}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-tighter hover:scale-105 transition-transform"
          >
            <LogIn size={16} />
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ label, active = false, onClick }: { label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`font-headline font-bold tracking-tight transition-all cursor-pointer relative py-1 ${
      active ? 'text-primary' : 'text-gray-500 hover:text-gray-200'
    }`}
  >
    {label}
    {active && (
      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
    )}
  </button>
);

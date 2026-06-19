import React, { useState } from 'react';
import { BookOpen, BarChart2, Settings, Flame, Zap, LogOut } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { getLevel } from '../utils/scoring';

export default function Header() {
  const { screen, xp, streak, goTo } = useAppStore();
  const { user, profile, isPremium, signOut } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const levelInfo = getLevel(xp);

  return (
    <header className="sticky top-0 z-50 w-full animate-fade-in" style={{ background: 'rgba(15,14,26,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => goTo('home')}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg animate-pulse" style={{ background: 'linear-gradient(135deg,#6C63FF,#a78bfa)' }}>
            📝
          </div>
          <span className="hidden sm:block font-extrabold text-sm tracking-tight gradient-text">Ejain</span>
        </button>

        {/* XP bar */}
        <div className="flex-1 max-w-[140px] xs:max-w-[160px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] xs:text-xs font-semibold" style={{ color: '#a89dff' }}>
              <Zap size={10} className="inline mr-0.5" />Lv.{levelInfo.level} {levelInfo.label}
            </span>
            <span className="text-[10px] xs:text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{xp} XP</span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>

        {/* Stats & Nav Section */}
        <div className="flex items-center gap-2 xs:gap-3 shrink-0">
          <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#ff9f43' }}>
            <Flame size={16} className="text-orange-400" />
            <span>{streak}</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavBtn icon={<BookOpen size={17} />} active={screen === 'home' || screen === 'set-detail' || screen === 'exercise' || screen === 'results'} onClick={() => goTo('home')} title="Beranda" />
            <NavBtn icon={<BarChart2 size={17} />} active={screen === 'progress'} onClick={() => goTo('progress')} title="Progress" />
            <NavBtn icon={<Settings size={17} />} active={screen === 'settings'} onClick={() => goTo('settings')} title="Pengaturan" />
          </nav>

          {/* User Auth Section */}
          <div className="relative flex items-center">
            {user && user !== 'guest' ? (
              /* Signed In User Menu */
              <div className="relative flex items-center">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center focus:outline-none select-none relative p-0.5 rounded-full hover:bg-neutral-800/20 active:scale-95 transition-all border border-neutral-800"
                >
                  <img
                    src={user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  {isPremium && (
                    <span className="absolute -top-1 -right-1 text-xs select-none">👑</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-40" />
                    <div 
                      className="glass-card absolute right-0 mt-2 top-full w-48 p-3 z-50 flex flex-col space-y-2 text-left animate-slide-up"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                    >
                      <div className="px-1 py-0.5">
                        <p className="text-xs font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>
                          {profile?.display_name || user.user_metadata?.full_name || user.email || 'Pengguna'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isPremium ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'bg-neutral-850 text-neutral-400 border border-neutral-800'}`}>
                            {isPremium ? 'Premium ✓' : 'Gratis'}
                          </span>
                        </div>
                      </div>

                      <div className="h-[1px] bg-neutral-800 my-1" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 active:scale-[0.98] transition-all flex items-center gap-1.5"
                      >
                        <LogOut size={12} />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Guest User Login Button */
              <button
                onClick={signOut}
                className="px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all border text-purple-300 hover:text-white"
                style={{ borderColor: 'var(--border)', background: 'rgba(108,99,255,0.05)' }}
              >
                Masuk
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavBtn({ icon, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
      style={{
        background: active ? 'var(--brand-dim)' : 'transparent',
        color: active ? 'var(--brand)' : 'var(--text-muted)',
        border: active ? '1px solid rgba(108,99,255,0.35)' : '1px solid transparent',
      }}
    >
      {icon}
    </button>
  );
}

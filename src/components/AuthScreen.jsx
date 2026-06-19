import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Sparkles, Shield, AlertCircle } from 'lucide-react';

export default function AuthScreen() {
  const { signInWithGoogle, setGuestMode, loading } = useAuthStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity" />

      <div className="glass-card w-full max-w-md p-8 relative z-10 text-center space-y-8 animate-slide-up">
        {/* App Logo & Header */}
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-purple-500/20" 
            style={{ background: 'linear-gradient(135deg,#6C63FF,#a78bfa)' }}>
            📝
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
              Ejain
            </h1>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Kuasai kaidah ejaan bahasa Indonesia
            </p>
          </div>
        </div>

        {/* Informative Grid */}
        <div className="grid grid-cols-1 gap-3 text-left bg-neutral-900/30 p-4 rounded-2xl border border-neutral-800/40">
          <div className="flex gap-3 items-start">
            <div className="p-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 mt-0.5">
              <Sparkles size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Target Skor PBM & PPU 700+</h4>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Latihan intensif EYD V yang dirancang khusus untuk mendongkrak skor Anda.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
              <Shield size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Simpan Progress Belajar</h4>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Buka akses latihan di berbagai perangkat tanpa kehilangan data.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <div className="flex items-center justify-center gap-2 py-1">
            <div className="h-[1px] flex-1" style={{ background: 'var(--border)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>atau</span>
            <div className="h-[1px] flex-1" style={{ background: 'var(--border)' }} />
          </div>

          <button
            onClick={setGuestMode}
            disabled={loading}
            className="btn-ghost w-full py-3.5 text-sm transition-transform active:scale-[0.98]"
          >
            Lanjut tanpa akun (Guest)
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Dengan melanjutkan, Anda dapat mempelajari Level Pemula (Beginner) dan set preview secara gratis.
        </p>
      </div>
    </div>
  );
}

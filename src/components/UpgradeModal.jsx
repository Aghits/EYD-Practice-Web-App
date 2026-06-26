import React from 'react';
import { X, Check, ArrowRight, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function UpgradeModal({ isOpen, onClose }) {
  const { user, signInWithGoogle } = useAuthStore();

  if (!isOpen) return null;

  const isGuest = !user || user === 'guest';
  const userEmail = !isGuest && user?.email ? user.email : '';
  const discordUrl = 'https://discord.com/invite/hD3FpTMJUf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity" 
      />

      {/* Scrollable Content Wrapper */}
      <div className="absolute inset-0 overflow-y-auto flex justify-center items-start p-4">
        {/* Modal Container */}
        <div className="my-auto glass-card w-full max-w-md p-6 relative z-10 animate-slide-up flex flex-col space-y-6"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-800/20 active:scale-95 transition-all text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center space-y-1">
            <span className="text-3xl">👑</span>
            <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Upgrade ke Premium
            </h2>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              Rp 15.000 / bulan
            </div>
          </div>

          {/* Benefits List */}
          <div className="space-y-2.5 bg-neutral-900/30 p-4 rounded-2xl border border-neutral-800/40">
            <div className="flex items-start gap-2.5 text-sm">
              <div className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Check size={14} />
              </div>
              <span style={{ color: 'var(--text-primary)' }}>Semua set tingkat Menengah & Mahir</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <div className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Check size={14} />
              </div>
              <span style={{ color: 'var(--text-primary)' }}>100+ soal latihan intensif skor 700+ PBM & PPU</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <div className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Check size={14} />
              </div>
              <span style={{ color: 'var(--text-primary)' }}>Pembaruan set soal baru secara rutin</span>
            </div>
          </div>

          {/* Conditional Payment/Login Content */}
          {isGuest ? (
            /* Guest Screen: Must Sign In */
            <div className="text-center space-y-4 py-2">
              <p className="text-sm font-semibold text-amber-400">
                Silakan masuk terlebih dahulu untuk berlangganan Premium dan menyimpan progress latihan Anda.
              </p>
              <button
                onClick={() => {
                  onClose();
                  signInWithGoogle();
                }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                <span>Masuk sekarang</span>
              </button>
            </div>
          ) : (
            /* Premium Purchase Options */
            <div className="space-y-5">
              {/* Discord Information Card */}
              <div className="flex flex-col items-center justify-center p-6 border border-neutral-800 bg-neutral-950/40 text-center rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
                <span className="text-3xl mb-3 animate-bounce">💬</span>
                <h3 className="text-sm font-bold text-white mb-1">Aktivasi Manual via Discord</h3>
                <p className="text-xs text-neutral-400 max-w-[280px] leading-relaxed">
                  Untuk saat ini, pembayaran and aktivasi akun premium dilayani secara manual melalui server Discord resmi kami.
                </p>
              </div>


              {/* Discord Contact Action */}
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full flex items-center justify-center gap-2 text-white font-bold transition-all active:scale-[0.98]"
                style={{ 
                  background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)', 
                  boxShadow: '0 4px 20px rgba(88,101,242,0.3)',
                  borderColor: '#5865F2'
                }}
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                </svg>
                <span>Hubungi via Discord</span>
              </a>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="btn-ghost w-full py-2.5 text-xs text-center border-neutral-800 hover:border-neutral-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

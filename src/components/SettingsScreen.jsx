import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SettingsScreen() {
  const { settings, updateSettings, resetProgress } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-extrabold gradient-text">Pengaturan</h1>

      {/* Show hints toggle */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div>
          <h2 className="font-bold">Tampilkan Petunjuk</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Izinkan petunjuk jumlah kesalahan saat mengerjakan soal.
          </p>
        </div>
        <button
          onClick={() => updateSettings({ showHints: !settings.showHints })}
          className="relative w-12 h-6 rounded-full transition-all duration-300"
          style={{ background: settings.showHints ? 'var(--brand)' : 'rgba(255,255,255,0.12)' }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
            style={{ left: settings.showHints ? '26px' : '2px' }}
          />
        </button>
      </div>

      {/* About */}
      <div className="glass-card p-5 space-y-2">
        <h2 className="font-bold">Tentang Aplikasi</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <strong className="text-white">EYD V Interactive Grammar Trainer</strong> — Aplikasi latihan tata bahasa Indonesia
          berbasis kaidah Ejaan Yang Disempurnakan (EYD) edisi kelima (EYD V).
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Versi 1.0.0</p>
      </div>

      {/* Reset progress */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: '#f87171' }} />
          <h2 className="font-bold" style={{ color: '#f87171' }}>Reset Progress</h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Menghapus semua data XP, streak, dan riwayat latihan. Tindakan ini tidak dapat dibatalkan.
        </p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}
          >
            <Trash2 size={15} /> Hapus Semua Progress
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { resetProgress(); setConfirmReset(false); }}
              className="flex-1 font-bold py-2 rounded-xl text-sm"
              style={{ background: '#f87171', color: 'white' }}
            >
              Ya, Hapus Sekarang
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="flex-1 btn-ghost text-sm py-2"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

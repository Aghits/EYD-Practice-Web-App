import { create } from 'zustand';
import { updateStreak, isErrorResolved } from '../utils/scoring';
import { tokenizeText, enrichErrors } from '../utils/tokenizer';
import setsData from '../data/sets.json';

const STORAGE_KEY = 'eyd_progress_v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.settings) {
      if (!parsed.settings.geminiApiKey || 
          parsed.settings.geminiApiKey.trim() === '' || 
          parsed.settings.geminiApiKey === 'AIzaSyCsrN-2a8IA_5mjlE9bcJIBOAtgxp3Q6kE' ||
          parsed.settings.geminiApiKey === 'AIzaSyCJFfkja0n5QNcuIw3mPQIUSRmM6irziXE') {
        parsed.settings.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      }
      if (parsed.settings.difficulty === 'beginner') {
        parsed.settings.difficulty = 'random';
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    const { xp, level, streak, lastDate, history, categoryStats, settings, setProgress } = state;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ xp, level, streak, lastDate, history, categoryStats, settings, setProgress })
    );
  } catch {}
}

const DEFAULT_STATE = {
  // Navigation
  screen: 'home', // 'home' | 'set-detail' | 'exercise' | 'results' | 'progress' | 'settings'

  // Current exercise session
  currentExercise: null,
  selectedTokenIds: new Set(),
  submitted: false,
  result: null, // { tp, fp, missed, accuracy, xp, perfect }

  // Set progress tracking
  setProgress: {}, // { [setId]: { completedExercises: [], scores: {}, stars: 0, lastPlayed } }
  currentSetId: null,

  // Gamification
  xp: 0,
  level: 1,
  streak: 0,
  lastDate: null,

  // History
  history: [], // [{ exerciseId, accuracy, xp, date, categories }]

  // Per-category stats  { [category]: { correct, total } }
  categoryStats: {},

  // Settings
  settings: {
    difficulty: 'random',
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    showHints: true,
  },
  activeCategory: null,
};

export const useAppStore = create((set, get) => ({
  ...DEFAULT_STATE,
  ...(loadState() || {}),
  // Restore sets (JSON serializes Set as {})
  selectedTokenIds: new Set(),
  submitted: false,
  result: null,
  currentExercise: null,
  screen: 'home',
  activeCategory: null,
  activePunctuation: null,
  modifiedTokens: {},

  // ── Navigation ───────────────────────────────────────────────────────────
  goTo: (screen) => set((state) => ({
    screen,
    currentSetId: screen === 'home' ? null : state.currentSetId
  })),

  goToSet: (setId) => set({ screen: 'set-detail', currentSetId: setId }),

  // ── Exercise lifecycle ───────────────────────────────────────────────────
  startExercise: (exercise, category = null) =>
    set({
      currentExercise: exercise,
      selectedTokenIds: new Set(),
      submitted: false,
      result: null,
      screen: 'exercise',
      activeCategory: category,
      activePunctuation: null,
      modifiedTokens: {},
    }),

  setActivePunctuation: (punc) => set({ activePunctuation: punc }),

  applyPunctuation: (tokenId, punc) => {
    if (get().submitted) return;
    const { modifiedTokens, selectedTokenIds } = get();
    const nextTokens = { ...modifiedTokens, [tokenId]: punc };
    const nextSelected = new Set(selectedTokenIds);
    nextSelected.add(tokenId); // Automatically select when modifying
    set({ modifiedTokens: nextTokens, selectedTokenIds: nextSelected, activePunctuation: null });
  },

  toggleToken: (tokenId) => {
    if (get().submitted) return;
    const { selectedTokenIds, modifiedTokens, activePunctuation } = get();
    
    // If we have an active punctuation, apply it instead of just toggling
    if (activePunctuation) {
      get().applyPunctuation(tokenId, activePunctuation);
      return;
    }

    const next = new Set(selectedTokenIds);
    const nextModified = { ...modifiedTokens };
    
    if (next.has(tokenId)) {
      next.delete(tokenId);
      delete nextModified[tokenId]; // Remove modification if deselected
    } else {
      next.add(tokenId);
    }
    set({ selectedTokenIds: next, modifiedTokens: nextModified });
  },

  submitAnswer: (result) => {
    const state = get();
    if (state.submitted) return;

    // Update streak
    const { streak, lastDate: newLastDate } = updateStreak(
      state.lastDate,
      state.streak
    );

    // Update XP
    const newXp = state.xp + result.xp;

    // Level (simple: every 200 xp)
    const newLevel = Math.floor(newXp / 200) + 1;

    // History
    const entry = {
      exerciseId: state.currentExercise?.baseId || state.currentExercise?.id,
      accuracy: result.accuracy,
      xp: result.xp,
      date: new Date().toISOString(),
      categories: state.currentExercise?.categories ?? [],
      difficulty: state.currentExercise?.difficulty ?? 'beginner',
    };
    const history = [entry, ...state.history].slice(0, 100);

    // Category stats
    const categoryStats = { ...state.categoryStats };
    const tokens = tokenizeText(state.currentExercise?.text ?? '');
    const enrichedErrors = enrichErrors(tokens, state.currentExercise?.errors ?? [], state.currentExercise?.text ?? '');

    enrichedErrors.forEach((err) => {
      const cat = err.category;
      if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 };
      categoryStats[cat].total += 1;
      
      const wasFound = isErrorResolved(err, state.selectedTokenIds, state.modifiedTokens, tokens);
      if (wasFound) {
        categoryStats[cat].correct += 1;
      }
    });

    // Update Set Progress if currently in a set
    let nextSetProgress = state.setProgress;
    if (state.currentSetId && state.currentExercise) {
      const setId = state.currentSetId;
      const exerciseId = state.currentExercise.baseId || state.currentExercise.id;
      
      const setProgress = { ...state.setProgress };
      if (!setProgress[setId]) {
        setProgress[setId] = {
          completedExercises: [],
          scores: {},
          stars: 0,
          lastPlayed: null
        };
      }
      const currentProgress = { ...setProgress[setId] };
      const completedExercises = [...currentProgress.completedExercises];
      if (!completedExercises.includes(exerciseId)) {
        completedExercises.push(exerciseId);
      }
      const scores = { ...currentProgress.scores, [exerciseId]: result.accuracy };
      
      const targetSet = setsData.find(s => s.id === setId);
      const totalExercises = targetSet ? targetSet.exerciseIds.length : 5;
      
      let stars = currentProgress.stars || 0;
      if (completedExercises.length === totalExercises) {
        const avgAccuracy = Object.values(scores).reduce((sum, val) => sum + val, 0) / totalExercises;
        if (avgAccuracy >= 90) stars = 3;
        else if (avgAccuracy >= 70) stars = 2;
        else stars = 1;
      }
      
      setProgress[setId] = {
        completedExercises,
        scores,
        stars,
        lastPlayed: new Date().toISOString()
      };
      nextSetProgress = setProgress;
    }

    const next = {
      submitted: true,
      result,
      xp: newXp,
      level: newLevel,
      streak,
      lastDate: newLastDate,
      history,
      categoryStats,
      setProgress: nextSetProgress,
      screen: 'results',
    };
    set(next);
    saveState({ ...state, ...next });
  },

  resetExercise: () =>
    set({
      currentExercise: null,
      selectedTokenIds: new Set(),
      submitted: false,
      result: null,
      screen: get().currentSetId ? 'set-detail' : 'home',
    }),

  // ── Settings ──────────────────────────────────────────────────────────────
  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    saveState({ ...get(), settings });
  },

  // ── Reset progress ────────────────────────────────────────────────────────
  resetProgress: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ ...DEFAULT_STATE, selectedTokenIds: new Set() });
  },
}));

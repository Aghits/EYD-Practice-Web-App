import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Trophy, Flame, RotateCw, Home, Timer, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import kataBakuData from '../data/kataBaku.json';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getMemorizeTime(correctCount) {
  const reduction = Math.floor(correctCount / 5) * 0.15;
  return Math.max(1.2, 3 - reduction);
}

export default function KataBakuGame() {
  const { goTo } = useAppStore();

  // Game states: 'start' | 'memorize' | 'recall' | 'feedback' | 'gameover'
  const [gameState, setGameState] = useState('start');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [round, setRound] = useState(null);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [feedbackType, setFeedbackType] = useState(null); // 'correct' | 'wrong' | 'timeout'
  const [wrongAnswers, setWrongAnswers] = useState([]); // Array of { wrong, correct }
  const [scorePop, setScorePop] = useState(null); // Value for score pop text (+10, etc.)

  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('eyd_kata_baku_highscore') || '0');
  });

  const [usedIndices, setUsedIndices] = useState(new Set());

  // 100ms Countdown Timer Logic
  useEffect(() => {
    if (gameState === 'memorize') {
      const duration = getMemorizeTime(correctCount);
      setTimeLeft(duration);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 0.1);
          if (next <= 0) {
            clearInterval(timer);
            setGameState('recall');
          }
          return next;
        });
      }, 100);

      return () => clearInterval(timer);
    }

    if (gameState === 'recall') {
      setTimeLeft(5.0);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 0.1);
          if (next <= 0) {
            clearInterval(timer);
            handleTimeout();
          }
          return next;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [gameState, correctCount]);

  // Feedback Auto-next Timing
  useEffect(() => {
    if (gameState === 'feedback') {
      const timeout = setTimeout(() => {
        if (lives > 0) {
          startNextRound();
        } else {
          setGameState('gameover');
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('eyd_kata_baku_highscore', score.toString());
          }
        }
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [gameState, lives, score, highScore]);

  // Score pop text auto-clear
  useEffect(() => {
    if (scorePop) {
      const timer = setTimeout(() => {
        setScorePop(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [scorePop]);

  const startNextRound = () => {
    let availableIndices = kataBakuData
      .map((_, i) => i)
      .filter(i => !usedIndices.has(i));

    if (availableIndices.length === 0) {
      availableIndices = kataBakuData.map((_, i) => i);
      setUsedIndices(new Set());
    }

    const mainIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const entry = kataBakuData[mainIndex];

    setUsedIndices((prev) => {
      const next = new Set(prev);
      next.add(mainIndex);
      return next;
    });

    const tidakBakuOptions = [...entry.tidakBaku];
    while (tidakBakuOptions.length < 2) {
      const otherIndex = Math.floor(Math.random() * kataBakuData.length);
      if (otherIndex !== mainIndex) {
        const randomTidakBaku = kataBakuData[otherIndex].tidakBaku[
          Math.floor(Math.random() * kataBakuData[otherIndex].tidakBaku.length)
        ];
        if (!tidakBakuOptions.includes(randomTidakBaku) && randomTidakBaku !== entry.baku) {
          tidakBakuOptions.push(randomTidakBaku);
        }
      }
    }

    const allWords = [entry.baku, tidakBakuOptions[0], tidakBakuOptions[1]];
    const memorizeOrder = shuffle([...allWords]);
    let recallOrder = shuffle([...allWords]);
    let attempts = 0;
    while (JSON.stringify(memorizeOrder) === JSON.stringify(recallOrder) && attempts < 10) {
      recallOrder = shuffle([...allWords]);
      attempts++;
    }

    setRound({
      bakuWord: entry.baku,
      memorizeWords: memorizeOrder,
      recallWords: recallOrder,
      mainIndex,
    });

    setClickedIndex(null);
    setFeedbackType(null);
    setGameState('memorize');
  };

  const handleStartGame = () => {
    setLives(3);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongAnswers([]);
    setUsedIndices(new Set());
    startNextRound();
  };

  const handleAnswerSelect = (word, idx) => {
    if (gameState !== 'recall') return;
    setClickedIndex(idx);

    const isCorrect = word === round.bakuWord;
    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      setCorrectCount((c) => c + 1);

      const bonus = Math.min(20, streak * 2);
      const points = 10 + bonus;
      setScore((s) => s + points);
      setScorePop(`+${points}`);
      setFeedbackType('correct');
    } else {
      setStreak(0);
      setWrongCount((w) => w + 1);
      setLives((l) => l - 1);
      setFeedbackType('wrong');

      setWrongAnswers((prev) => {
        const exists = prev.some(
          (item) => item.wrong === word && item.correct === round.bakuWord
        );
        if (!exists) {
          return [...prev, { wrong: word, correct: round.bakuWord }];
        }
        return prev;
      });
    }

    setGameState('feedback');
  };

  const handleTimeout = () => {
    setStreak(0);
    setWrongCount((w) => w + 1);
    setLives((l) => l - 1);
    setFeedbackType('timeout');

    setWrongAnswers((prev) => {
      const firstWrong = round.memorizeWords.find((w) => w !== round.bakuWord);
      const exists = prev.some(
        (item) => item.wrong === firstWrong && item.correct === round.bakuWord
      );
      if (!exists && firstWrong) {
        return [...prev, { wrong: firstWrong, correct: round.bakuWord }];
      }
      return prev;
    });

    setGameState('feedback');
  };

  // UI calculations
  const memorizeLimit = round ? getMemorizeTime(correctCount) : 3;
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      (timeLeft / (gameState === 'memorize' ? memorizeLimit : 5.0)) * 100
    )
  );

  const headerPanel = (
    <div className="flex items-center justify-between border-b border-white/5 pb-3">
      {/* Lives */}
      <div className="flex gap-1">
        {[1, 2, 3].map((h) => {
          const isAlive = h <= lives;
          const isJustLost =
            (feedbackType === 'wrong' || feedbackType === 'timeout') &&
            h === lives + 1;

          return (
            <Heart
              key={h}
              size={18}
              fill={isAlive || isJustLost ? 'var(--danger)' : 'none'}
              className={`${
                isJustLost ? 'animate-shake-heart opacity-50' : ''
              } transition-all duration-300`}
              style={{
                color: isAlive || isJustLost ? 'var(--danger)' : 'var(--text-muted)',
              }}
            />
          );
        })}
      </div>

      {/* Score */}
      <div className="relative flex items-center justify-center font-bold text-sm">
        <span>Skor: <span className="text-white text-base font-extrabold">{score}</span></span>
        {scorePop && (
          <span className="absolute text-sm font-extrabold text-[#00d9a0] animate-score-pop -mt-8">
            {scorePop}
          </span>
        )}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1 font-bold text-sm" style={{ color: '#ff9f43' }}>
        <Flame size={16} />
        <span>{streak}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6 text-center h-full flex flex-col justify-center">
      {/* Start State */}
      {gameState === 'start' && (
        <div className="glass-card p-6 space-y-6 animate-fade-in my-auto">
          <div className="text-5xl animate-bounce">🎮</div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold gradient-text">
              Kata Baku Challenge
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Hafal 3 kata dengan cepat, lalu pilih kata yang baku dari ingatanmu!
            </p>
          </div>

          <div
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl mx-auto max-w-[200px]"
            style={{ background: 'rgba(255,209,102,0.05)', border: '1px solid rgba(255,209,102,0.15)' }}
          >
            <Trophy size={18} style={{ color: 'var(--warning)' }} />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>
                Rekor Tertinggi
              </div>
              <div className="text-base font-extrabold text-white">
                {highScore}
              </div>
            </div>
          </div>

          <button onClick={handleStartGame} className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2">
            Mulai Main <ArrowRight size={16} />
          </button>

          <button
            onClick={() => goTo('home')}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1 hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            <Home size={14} /> Kembali ke Beranda
          </button>
        </div>
      )}

      {/* Memorize State */}
      {gameState === 'memorize' && round && (
        <div className="glass-card p-5 space-y-6 animate-fade-in my-auto">
          {headerPanel}

          <div className="space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 animate-pulse flex items-center justify-center gap-1.5">
              <span>📝 Hafal!</span>
            </div>

            <div className="space-y-2.5 py-4 bg-white/5 rounded-2xl border border-white/5">
              {round.memorizeWords.map((word, idx) => (
                <div
                  key={idx}
                  className="text-lg font-bold text-white tracking-wide animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>

          {/* Timer bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              <span>Waktu menghafal...</span>
              <span className="text-amber-400 font-bold">{timeLeft.toFixed(1)}s</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  transition: 'width 100ms linear',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recall & Feedback States */}
      {(gameState === 'recall' || gameState === 'feedback') && round && (
        <div className="glass-card p-5 space-y-6 animate-fade-in my-auto">
          {headerPanel}

          <div className="space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center justify-center gap-1.5">
              <span>Mana yang BAKU?</span>
            </div>

            <div className="space-y-3">
              {round.recallWords.map((word, idx) => {
                const isSelected = clickedIndex === idx;
                const isCorrect = word === round.bakuWord;
                const isIncorrectSelection = isSelected && !isCorrect;

                let cardClass =
                  'w-full glass-card p-4 text-center text-sm font-semibold transition-all duration-200 select-none';
                let style = {};

                if (gameState === 'recall') {
                  cardClass += ' hover:border-purple-500/30 active:scale-[0.98] cursor-pointer';
                } else if (gameState === 'feedback') {
                  if (isCorrect) {
                    cardClass += ' border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold';
                  } else if (isIncorrectSelection) {
                    cardClass +=
                      ' border-red-500 bg-red-500/10 text-red-400 font-bold animate-shake-error';
                  } else {
                    cardClass += ' opacity-40 scale-[0.97] pointer-events-none';
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => handleAnswerSelect(word, idx)}
                    className={cardClass}
                    style={style}
                  >
                    {word}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timer bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              <span>Pilih kata baku!</span>
              <span className={`font-bold ${feedbackType === 'timeout' ? 'text-red-400' : 'text-[var(--brand)]'}`}>
                {feedbackType === 'timeout' ? 'Timeout!' : `${timeLeft.toFixed(1)}s`}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  feedbackType === 'timeout' || feedbackType === 'wrong'
                    ? 'bg-red-500'
                    : feedbackType === 'correct'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-[var(--brand)]'
                }`}
                style={{
                  width: `${progressPercent}%`,
                  transition: gameState === 'recall' ? 'width 100ms linear' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Game Over State */}
      {gameState === 'gameover' && (
        <div className="glass-card p-6 space-y-6 animate-slide-up my-auto max-h-[85vh] overflow-y-auto">
          <div className="text-5xl animate-bounce">💀</div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-red-400">Game Over!</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Kamu kehabisan nyawa.</p>
          </div>

          {score >= highScore && score > 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl py-3 px-4 animate-pop">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">🏆 Rekor Baru!</div>
              <div className="text-3xl font-extrabold text-white mt-1">{score}</div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-2xl py-3 px-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Skor Akhir</div>
              <div className="text-3xl font-extrabold text-white mt-1">{score}</div>
            </div>
          )}

          {/* Stats breakdown */}
          <div className="grid grid-cols-3 gap-2 py-1 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="bg-white/5 rounded-xl p-2.5">
              <div className="text-[#00d9a0] font-bold text-lg">{correctCount}</div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Benar</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5">
              <div className="text-red-400 font-bold text-lg">{wrongCount}</div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Salah</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5">
              <div className="text-amber-400 font-bold text-lg">{bestStreak}</div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Streak</div>
            </div>
          </div>

          {/* Incorrect answers tracker */}
          {wrongAnswers.length > 0 && (
            <div
              className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-left space-y-2 animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>Kata yang sering salah:</span>
              </h4>
              <ul className="text-xs space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {wrongAnswers.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-white/80 font-medium">
                    <span className="text-red-400 line-through">{item.wrong}</span>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span className="text-emerald-400 font-bold">{item.correct}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={handleStartGame}
              className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              <RotateCw size={16} /> Main Lagi
            </button>
            <button
              onClick={() => goTo('home')}
              className="btn-ghost flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Home size={16} /> Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main Menu Screen matching Reference Screenshot 6
 */

import React from 'react';
import { Difficulty, GameMode } from '../types/game';
import { HelpCircle, Bot, Users, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sounds } from '../audio/sound';

interface MainMenuProps {
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onStartGame: (mode: GameMode) => void;
  onOpenTutorial: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  difficulty,
  onSelectDifficulty,
  onStartGame,
  onOpenTutorial,
  isMuted,
  onToggleMute,
}) => {
  const handleDifficultyChange = (d: Difficulty) => {
    sounds.playClick();
    onSelectDifficulty(d);
  };

  const handleInstagramClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    sounds.playClick();

    // On Android, attempt to open the user profile directly in the Instagram app
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = 'instagram://user?username=shiivmanii';
        document.body.appendChild(iframe);
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      } catch {
        // Fallback proceeds with standard https link
      }
    }
  };

  const difficultyLevels: Difficulty[] = ['easy', 'medium', 'hard'];
  const currentDiffIndex = difficultyLevels.indexOf(difficulty);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between px-4 pb-4 overflow-hidden select-none bg-[#245727]">
      {/* Soccer field subtle background pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="soccer-pattern" width="90" height="90" patternUnits="userSpaceOnUse">
            <circle cx="45" cy="45" r="28" fill="none" stroke="#FFFFFF" strokeWidth="3" />
            <polygon points="45,30 57,39 52,53 38,53 33,39" fill="#FFFFFF" />
            <circle cx="10" cy="10" r="8" fill="#FFFFFF" opacity="0.3" />
            <circle cx="80" cy="80" r="10" fill="#FFFFFF" opacity="0.3" />
            <polygon points="85,15 88,22 95,22 90,26 92,33 85,29 78,33 80,26 75,22 82,22" fill="#FFFFFF" opacity="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#soccer-pattern)" />
        </svg>
      </div>

      {/* Top Navigation Bar */}
      <header
        style={{ paddingTop: 'var(--menu-top-offset)' }}
        className="relative z-30 w-full max-w-sm flex items-center justify-between"
      >
        {/* Sound Toggle Button */}
        <button
          onClick={onToggleMute}
          className="w-11 h-11 bg-white hover:bg-neutral-100 active:scale-95 transition-all rounded-full shadow-md flex items-center justify-center text-[#5D6D7E] cursor-pointer"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label="Toggle Sound"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-neutral-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-[#2E7D32]" />
          )}
        </button>

        {/* Title & Developer Credit */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-black text-white tracking-wider drop-shadow-md leading-tight">
            SOCCER POOL
          </h1>
          <span className="text-xs font-semibold text-[#FFF9E6]/90 tracking-widest drop-shadow-xs -mt-0.5">
            by shiivmanii
          </span>
        </div>

        {/* Instagram Profile Button */}
        <a
          href="https://instagram.com/shiivmanii/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleInstagramClick}
          className="w-11 h-11 bg-white hover:bg-neutral-100 active:scale-95 transition-all rounded-full shadow-md flex items-center justify-center cursor-pointer group"
          title="Visit my Instagram profile"
          aria-label="Visit my Instagram profile"
        >
          <svg
            className="w-6 h-6 transition-transform group-hover:scale-105"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="ig-gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFDC80" />
                <stop offset="25%" stopColor="#FCAF45" />
                <stop offset="50%" stopColor="#F77737" />
                <stop offset="75%" stopColor="#FD1D1D" />
                <stop offset="100%" stopColor="#C13584" />
              </linearGradient>
            </defs>
            <rect
              x="2.5"
              y="2.5"
              width="19"
              height="19"
              rx="5.5"
              stroke="url(#ig-gradient)"
              strokeWidth="2.2"
            />
            <circle
              cx="12"
              cy="12"
              r="4.2"
              stroke="url(#ig-gradient)"
              strokeWidth="2.2"
            />
            <circle
              cx="17.4"
              cy="6.6"
              r="1.2"
              fill="url(#ig-gradient)"
            />
          </svg>
        </a>
      </header>

      {/* Center Section: Avatar & Main Control Card */}
      <div className="relative z-20 w-full max-w-sm flex flex-col items-center my-auto pt-6">
        {/* Floating Help Button (Purple '?') matching screenshot */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenTutorial();
          }}
          className="absolute right-4 top-4 w-12 h-12 bg-[#8E44AD] hover:bg-[#7D3C98] active:scale-95 text-white rounded-2xl shadow-lg border-b-4 border-[#6C3483] flex items-center justify-center font-black text-2xl z-30 cursor-pointer"
          title="How to play tutorial"
          aria-label="Tutorial"
        >
          <HelpCircle className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* Playful Orange Character Avatar Disc sitting on card */}
        <div className="relative -mb-10 z-20">
          <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-xl flex items-center justify-center">
            {/* Outer black ring */}
            <div className="w-full h-full rounded-full bg-[#1E1E1E] flex items-center justify-center p-1">
              {/* Orange face */}
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#FFA726] to-[#FB8C00] relative flex items-center justify-center overflow-hidden">
                {/* Eyes */}
                <div className="flex gap-3 items-center mb-1">
                  <div className="w-4 h-5 bg-[#1E1E1E] rounded-full relative flex items-start justify-end p-0.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <div className="w-4 h-5 bg-[#1E1E1E] rounded-full relative flex items-start justify-end p-0.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
                {/* Tiny smirk */}
                <div className="absolute bottom-4 w-2.5 h-1 bg-[#1E1E1E] rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Cream Card */}
        <div className="w-full bg-[#FFF5E5] rounded-3xl p-6 pt-14 shadow-2xl border-4 border-white flex flex-col items-center space-y-6">
          {/* Difficulty Label in Large Bold Orange */}
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-[#F39C12] tracking-wider uppercase drop-shadow-xs">
              {difficulty}
            </span>
          </div>

          {/* 3-Position Slider Pill Track (matching screenshot) */}
          <div className="w-full max-w-[240px] h-14 bg-white rounded-full p-1.5 shadow-inner border border-neutral-200 flex items-center justify-between relative">
            {/* Active sliding background highlight */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-full bg-[#F39C12] transition-all duration-300 shadow-md"
              style={{
                left: `${currentDiffIndex * 33.33}%`,
                width: '33.33%',
              }}
            />

            {/* Slider knob */}
            <div
              className="absolute top-1.5 bottom-1.5 w-11 h-11 bg-[#D68910] rounded-full shadow-lg border-2 border-white transition-all duration-300 pointer-events-none flex items-center justify-center"
              style={{
                left: `calc(${currentDiffIndex * 33.33}% + (33.33% - 44px) / 2)`,
              }}
            >
              <div className="w-4 h-4 bg-white/70 rounded-full" />
            </div>

            {/* 3 Clickable Segments */}
            {difficultyLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleDifficultyChange(lvl)}
                className="flex-1 h-full z-10 text-[11px] font-black uppercase text-center transition-colors cursor-pointer flex items-center justify-center"
                aria-label={`Select ${lvl} difficulty`}
              >
                <span className={difficulty === lvl ? 'text-white drop-shadow-xs font-black' : 'text-neutral-400 font-bold'}>
                  {lvl[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Large PLAY VS. BOT Button (Orange) */}
          <button
            onClick={() => {
              sounds.playClick();
              onStartGame('bot');
            }}
            className="w-full py-3.5 px-6 bg-[#F39C12] hover:bg-[#E67E22] active:scale-98 transition-all text-white rounded-2xl shadow-xl border-b-4 border-[#D68910] flex items-center justify-center gap-4 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-extrabold uppercase tracking-widest text-white/90">
                PLAY VS.
              </span>
              <span className="text-3xl font-black tracking-wider leading-none text-white">
                BOT
              </span>
            </div>
          </button>
        </div>

        {/* Large PLAY VS. FRIEND Button (Purple) - outside card as in screenshot */}
        <button
          onClick={() => {
            sounds.playClick();
            onStartGame('friend');
          }}
          className="w-full mt-4 py-3.5 px-6 bg-[#8E44AD] hover:bg-[#7D3C98] active:scale-98 transition-all text-white rounded-2xl shadow-2xl border-b-4 border-[#6C3483] flex items-center justify-center gap-4 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-white/90">
              PLAY VS.
            </span>
            <span className="text-3xl font-black tracking-wider leading-none text-white">
              FRIEND
            </span>
          </div>
        </button>
      </div>

      {/* Footer hint */}
      <footer className="relative z-20 text-white/70 text-xs font-bold tracking-wide pb-1 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        Flick pieces to shoot & score • First to 3 wins!
      </footer>
    </div>
  );
};

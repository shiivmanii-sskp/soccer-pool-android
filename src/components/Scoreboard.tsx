/**
 * Scoreboard and Turn HUD matching reference screenshots
 */

import React, { useState, useEffect } from 'react';
import { MatchScores, Difficulty, GameMode, Team } from '../types/game';
import { ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../audio/sound';

interface ScoreboardProps {
  scores: MatchScores;
  gameMode: GameMode;
  difficulty: Difficulty;
  currentTurn: Team;
  isBotThinking: boolean;
  onBackClick: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  scores,
  gameMode,
  difficulty,
  currentTurn,
  isBotThinking,
  onBackClick,
  isMuted,
  onToggleMute,
}) => {
  const isBot = gameMode === 'bot';
  const [showTurnReminder, setShowTurnReminder] = useState<boolean>(false);

  // Automatically hide the turn reminder after exactly 0.5 seconds (500ms)
  useEffect(() => {
    if (!isBotThinking && (currentTurn === 'red' || (!isBot && currentTurn === 'blue'))) {
      setShowTurnReminder(true);
      const timer = setTimeout(() => {
        setShowTurnReminder(false);
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowTurnReminder(false);
    }
  }, [currentTurn, isBotThinking, isBot]);

  return (
    <>
      {/* Top Header Bar - positioned with comfortable clearance below Android status bar */}
      <header
        style={{ top: 'var(--top-bar-offset)' }}
        className="absolute left-0 right-0 z-30 px-3 flex items-center justify-between pointer-events-none"
      >
        {/* Back Button (Round white button from screenshots) */}
        <button
          onClick={onBackClick}
          className="pointer-events-auto w-11 h-11 bg-white hover:bg-neutral-100 active:scale-95 transition-transform rounded-full shadow-md flex items-center justify-center text-[#E74C3C] cursor-pointer"
          title="Quit match"
          aria-label="Back to menu"
        >
          <ChevronLeft className="w-7 h-7 stroke-[3] -ml-0.5 text-[#5D6D7E]" />
        </button>

        {/* Center Scoreboard Badge */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="bg-[#41394B] text-white px-5 py-1.5 rounded-2xl shadow-lg border border-black/10 flex flex-col items-center min-w-[170px]">
            {/* Difficulty or Mode Tag */}
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F1C40F] -mt-0.5 mb-0.5">
              {isBot ? difficulty : 'FRIEND'}
            </span>

            {/* Score Grid: YOU vs BOT */}
            <div className="flex items-center justify-between w-full gap-4 text-center">
              {/* Red / You Team */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-[11px] font-bold text-[#E57373] tracking-wide uppercase">
                  {isBot ? 'YOU' : 'RED'}
                </span>
                <span className="text-2xl font-black leading-none text-[#FF6B6B]">
                  {scores.red}
                </span>
              </div>

              {/* VS Divider */}
              <div className="text-sm font-black text-white/90 px-0.5">
                VS
              </div>

              {/* Blue / Bot Team */}
              <div className="flex flex-col items-center flex-1">
                <span className="text-[11px] font-bold text-[#4DD0E1] tracking-wide uppercase">
                  {isBot ? 'BOT' : 'BLUE'}
                </span>
                <span className="text-2xl font-black leading-none text-[#26C6DA]">
                  {scores.blue}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sound Toggle Button */}
        <button
          onClick={onToggleMute}
          className="pointer-events-auto w-10 h-10 bg-white/90 hover:bg-white active:scale-95 transition-transform rounded-full shadow-md flex items-center justify-center text-[#5D6D7E] cursor-pointer"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label="Toggle Sound"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-neutral-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-[#2E7D32]" />
          )}
        </button>
      </header>

      {/* Bot Thinking Banner (Screenshots 1, 3, 5: Dark rounded pill at top of pitch) */}
      {isBotThinking && (
        <div
          style={{ top: 'var(--bot-thinking-top)' }}
          className="absolute left-1/2 -translate-x-1/2 z-25 pointer-events-none transition-all duration-300 animate-pulse"
        >
          <div className="bg-[#34495E]/85 backdrop-blur-xs text-white px-8 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-white/20">
            <span className="text-xl font-extrabold tracking-wide drop-shadow-sm">
              Bot thinking
            </span>
            <span className="flex gap-1 items-center mt-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
            </span>
          </div>
        </div>
      )}

      {/* "Your turn" Arched Dome at Bottom (Screenshot 2) */}
      {!isBotThinking && currentTurn === 'red' && showTurnReminder && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none transition-transform duration-300">
          <div className="w-[280px] h-[100px] bg-[#E78F68] rounded-t-full border-4 border-white shadow-2xl flex items-start justify-center pt-3.5">
            <span className="text-3xl font-extrabold text-white tracking-wider drop-shadow-md">
              Your turn
            </span>
          </div>
        </div>
      )}

      {/* Pass & Play Friend Mode Turn Banner for Blue */}
      {!isBot && !isBotThinking && currentTurn === 'blue' && showTurnReminder && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none transition-transform duration-300">
          <div className="w-[280px] h-[100px] bg-[#00BCD4] rounded-t-full border-4 border-white shadow-2xl flex items-start justify-center pt-3.5">
            <span className="text-3xl font-extrabold text-white tracking-wider drop-shadow-md">
              Blue's turn
            </span>
          </div>
        </div>
      )}
    </>
  );
};

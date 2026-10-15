/**
 * Game Over Screen Component
 */

import React, { useEffect } from 'react';
import { MatchScores, GameMode, Team } from '../types/game';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { sounds } from '../audio/sound';

interface GameOverModalProps {
  scores: MatchScores;
  gameMode: GameMode;
  winner: Team;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  scores,
  gameMode,
  winner,
  onPlayAgain,
  onMainMenu,
}) => {
  const isBot = gameMode === 'bot';
  const isHumanWinner = isBot ? winner === 'red' : true;

  useEffect(() => {
    if (isHumanWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FF5722', '#4CAF50', '#00BCD4'],
        });
      } catch {
        // Ignore
      }
    }
  }, [isHumanWinner]);

  let headline = '';
  if (isBot) {
    headline = winner === 'red' ? 'YOU WIN!' : 'YOU LOSE!';
  } else {
    headline = winner === 'red' ? 'RED TEAM WINS!' : 'BLUE TEAM WINS!';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-sm bg-[#FFF5E5] rounded-3xl p-6 shadow-2xl border-4 border-white flex flex-col items-center text-center space-y-6">
        {/* Trophy / Result Icon */}
        <div className="relative">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 border-white ${
              winner === 'red' ? 'bg-[#FF5252]' : 'bg-[#00BCD4]'
            }`}
          >
            <Trophy className="w-14 h-14 text-yellow-300 drop-shadow" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h2
            className={`text-4xl font-black tracking-wide drop-shadow-sm ${
              winner === 'red' ? 'text-[#E74C3C]' : 'text-[#00BCD4]'
            }`}
          >
            {headline}
          </h2>
          <p className="text-sm font-bold text-[#7F8C8D]">First to 3 goals</p>
        </div>

        {/* Score Board Display */}
        <div className="w-full bg-white rounded-2xl p-4 shadow-inner border border-neutral-200 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-xs font-black text-[#E74C3C] uppercase">
              {isBot ? 'YOU' : 'RED'}
            </span>
            <span className="text-4xl font-black text-[#E74C3C]">{scores.red}</span>
          </div>

          <div className="text-2xl font-black text-[#BDC3C7]">-</div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-black text-[#00BCD4] uppercase">
              {isBot ? 'BOT' : 'BLUE'}
            </span>
            <span className="text-4xl font-black text-[#00BCD4]">{scores.blue}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-2">
          {/* PLAY AGAIN */}
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full py-4 px-6 bg-[#F39C12] hover:bg-[#E67E22] active:scale-95 transition-all text-white font-black text-2xl rounded-2xl shadow-xl border-b-4 border-[#D68910] flex items-center justify-center gap-3 cursor-pointer"
          >
            <RotateCcw className="w-6 h-6 stroke-[3]" />
            PLAY AGAIN
          </button>

          {/* MAIN MENU */}
          <button
            onClick={() => {
              sounds.playClick();
              onMainMenu();
            }}
            className="w-full py-3.5 px-6 bg-[#8E44AD] hover:bg-[#7D3C98] active:scale-95 transition-all text-white font-black text-xl rounded-2xl shadow-lg border-b-4 border-[#6C3483] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Home className="w-5 h-5 stroke-[2.5]" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};

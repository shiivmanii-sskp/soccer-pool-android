/**
 * Goal Celebration Splash Banner
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Team } from '../types/game';

interface GoalSplashProps {
  scoringTeam: Team | null;
}

export const GoalSplash: React.FC<GoalSplashProps> = ({ scoringTeam }) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: scoringTeam === 'red' ? 0.3 : 0.7 },
        colors: scoringTeam === 'red' ? ['#FF5252', '#FFD54F', '#FFFFFF'] : ['#00BCD4', '#80DEEA', '#FFFFFF'],
      });
    } catch {
      // Ignore
    }
  }, [scoringTeam]);

  if (!scoringTeam) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none select-none">
      <div className="animate-in zoom-in-50 bounce duration-300 flex flex-col items-center">
        {/* Glowing Goal Text */}
        <div
          className={`px-8 py-3 rounded-3xl shadow-2xl border-4 border-white text-5xl md:text-6xl font-black tracking-widest text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] ${
            scoringTeam === 'red'
              ? 'bg-gradient-to-r from-[#FF5252] to-[#FF7043]'
              : 'bg-gradient-to-r from-[#00BCD4] to-[#26C6DA]'
          }`}
        >
          ⚽ GOAL!
        </div>
        <div className="mt-2 bg-black/60 backdrop-blur-xs text-white px-4 py-1 rounded-full text-sm font-black tracking-wider uppercase">
          {scoringTeam === 'red' ? 'RED SCORED!' : 'BLUE SCORED!'}
        </div>
      </div>
    </div>
  );
};

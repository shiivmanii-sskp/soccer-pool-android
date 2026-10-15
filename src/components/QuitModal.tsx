/**
 * Quit Confirmation Dialog matching Screenshot 6
 */

import React from 'react';
import { sounds } from '../audio/sound';

interface QuitModalProps {
  isOpen: boolean;
  onConfirmQuit: () => void;
  onCancelQuit: () => void;
}

export const QuitModal: React.FC<QuitModalProps> = ({
  isOpen,
  onConfirmQuit,
  onCancelQuit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm flex flex-col items-center text-center p-6 space-y-6">
        {/* Large Bold Yellow Title */}
        <h2 className="text-4xl md:text-5xl font-black text-[#F39C12] tracking-wide drop-shadow-md">
          Are you sure?
        </h2>

        {/* Explanatory Text */}
        <p className="text-xl md:text-2xl font-bold text-white leading-snug px-2 drop-shadow-sm">
          If you quit this game now, then next time you play you will start a new game.
        </p>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-center gap-4 w-full pt-4">
          {/* NO Button (Coral Red) */}
          <button
            onClick={() => {
              sounds.playClick();
              onCancelQuit();
            }}
            className="flex-1 py-4 px-6 bg-[#E76F51] hover:bg-[#D35400] active:scale-95 transition-all text-white font-black text-2xl rounded-2xl shadow-lg border-b-4 border-[#C0392B] cursor-pointer"
          >
            NO
          </button>

          {/* YES Button (Purple) */}
          <button
            onClick={() => {
              sounds.playClick();
              onConfirmQuit();
            }}
            className="flex-1 py-4 px-6 bg-[#9B59B6] hover:bg-[#8E44AD] active:scale-95 transition-all text-white font-black text-2xl rounded-2xl shadow-lg border-b-4 border-[#6C3483] cursor-pointer"
          >
            YES
          </button>
        </div>
      </div>
    </div>
  );
};

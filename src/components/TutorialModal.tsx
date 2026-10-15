/**
 * 6-Page Interactive Tutorial Modal matching Screenshots 9 to 15
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { sounds } from '../audio/sound';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const pages = [
    {
      title: 'PAGE 1',
      text: 'Each player controls 5 pieces on the field',
      bg: 'bg-[#F48FB1]',
      content: (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Mini Field */}
          <div className="w-[180px] h-[260px] bg-[#4CAF50] rounded-xl border-2 border-white relative overflow-hidden flex flex-col justify-between p-2 shadow-inner">
            {/* Top Goal */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#00BCD4] rounded-b border border-white" />
            {/* Blue pieces */}
            <div className="pt-5 flex flex-col items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-full bg-[#00BCD4] flex items-center justify-center text-[8px] text-white">★</div>
              </div>
              <div className="flex gap-8">
                <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5">
                  <div className="w-full h-full rounded-full bg-[#00BCD4] flex items-center justify-center text-[8px] text-white">★</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5">
                  <div className="w-full h-full rounded-full bg-[#00BCD4] flex items-center justify-center text-[8px] text-white">★</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5">
                  <div className="w-full h-full rounded-full bg-[#00BCD4] flex items-center justify-center text-[8px] text-white">★</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5">
                  <div className="w-full h-full rounded-full bg-[#00BCD4] flex items-center justify-center text-[8px] text-white">★</div>
                </div>
              </div>
            </div>

            {/* Half line & ball */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/70" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-white/70 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-white border border-black shadow" />
            </div>

            {/* Red pieces with orange highlight figures */}
            <div className="pb-5 flex flex-col items-center gap-2 relative">
              <div className="flex gap-4 relative">
                <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5 ring-2 ring-yellow-400">
                  <div className="w-full h-full rounded-full bg-[#FF5252] flex items-center justify-center text-[8px] text-white">★</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5 ring-2 ring-yellow-400">
                  <div className="w-full h-full rounded-full bg-[#FF5252] flex items-center justify-center text-[8px] text-white">★</div>
                </div>
              </div>
              <div className="flex gap-8 relative">
                <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5 ring-2 ring-yellow-400">
                  <div className="w-full h-full rounded-full bg-[#FF5252] flex items-center justify-center text-[8px] text-white">★</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5 ring-2 ring-yellow-400">
                  <div className="w-full h-full rounded-full bg-[#FF5252] flex items-center justify-center text-[8px] text-white">★</div>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center p-0.5 ring-2 ring-yellow-400">
                <div className="w-full h-full rounded-full bg-[#FF5252] flex items-center justify-center text-[8px] text-white">★</div>
              </div>
            </div>

            {/* Bottom Goal */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#FF5252] rounded-t border border-white" />
          </div>
        </div>
      ),
    },
    {
      title: 'PAGE 2',
      text: 'To play, drag your finger to aim, adjust the strength, and set the direction of your shot',
      bg: 'bg-[#5DADE2]',
      content: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-[180px] h-[260px] bg-[#4CAF50] rounded-xl border-2 border-white relative overflow-hidden flex flex-col justify-center items-center shadow-inner">
            {/* Piece being dragged */}
            <div className="relative flex flex-col items-center">
              {/* Aiming arrow upwards */}
              <div className="w-1 h-20 bg-gradient-to-t from-red-500 to-transparent border-dashed border-l-2 border-red-500 mb-2 animate-pulse" />
              {/* Piece */}
              <div className="w-8 h-8 rounded-full bg-[#1E1E1E] flex items-center justify-center p-1 shadow-lg ring-4 ring-red-400/50">
                <div className="w-full h-full rounded-full bg-[#FF5252] flex items-center justify-center text-xs text-white">★</div>
              </div>
              {/* Slingshot pull indicator */}
              <div className="w-1 h-10 bg-white/70 mt-1" />
              {/* Finger icon */}
              <div className="text-2xl mt-1 animate-bounce">👆</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'PAGE 3',
      text: 'Players alternate turns with each kick',
      bg: 'bg-[#5DADE2]',
      content: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-[180px] h-[260px] bg-[#4CAF50] rounded-xl border-2 border-white relative overflow-hidden flex flex-col justify-around items-center p-4 shadow-inner">
            <div className="px-3 py-1 bg-[#00BCD4] text-white text-xs font-black rounded-full shadow">
              BLUE TURN
            </div>
            <div className="text-2xl animate-spin">⇅</div>
            <div className="px-3 py-1 bg-[#FF5252] text-white text-xs font-black rounded-full shadow">
              RED TURN
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'PAGE 4',
      text: "Score by moving the ball into the opponent's goal",
      bg: 'bg-[#F48FB1]',
      content: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-[180px] h-[260px] bg-[#4CAF50] rounded-xl border-2 border-white relative overflow-hidden flex flex-col justify-start items-center p-2 shadow-inner">
            {/* Top Goal with ball entering */}
            <div className="w-20 h-8 bg-[#00BCD4] rounded-b border-2 border-white flex items-center justify-center relative shadow-md">
              <div className="w-4 h-4 rounded-full bg-white border border-black animate-ping" />
            </div>
            <div className="mt-6 text-yellow-300 text-lg font-black tracking-widest drop-shadow animate-bounce">
              GOAL! ⚽
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'PAGE 5',
      text: 'After each goal, the ball returns to the center for a new kickoff',
      bg: 'bg-[#F48FB1]',
      content: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-[180px] h-[260px] bg-[#4CAF50] rounded-xl border-2 border-white relative overflow-hidden flex flex-col justify-center items-center shadow-inner">
            <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-white border-2 border-black animate-pulse shadow-md" />
            </div>
            <span className="text-[11px] font-black text-white mt-2 bg-black/30 px-2 py-0.5 rounded-full">
              KICKOFF
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'PAGE 6',
      text: 'The first player to score 3 goals wins the game',
      bg: 'bg-[#F48FB1]',
      content: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-[180px] h-[260px] bg-[#34495E] rounded-xl border-2 border-white relative overflow-hidden flex flex-col justify-center items-center p-3 text-center shadow-inner">
            <div className="text-4xl mb-2 animate-bounce">🏆</div>
            <div className="text-yellow-400 text-2xl font-black">FIRST TO 3</div>
            <div className="text-white text-xs font-bold mt-2">VICTORY!</div>
          </div>
        </div>
      ),
    },
  ];

  const page = pages[currentPage];

  const handlePrev = () => {
    if (currentPage > 0) {
      sounds.playClick();
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      sounds.playClick();
      setCurrentPage((p) => p + 1);
    }
  };

  const handleOk = () => {
    sounds.playClick();
    if (currentPage < pages.length - 1) {
      setCurrentPage((p) => p + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FFF6E9] rounded-3xl p-5 shadow-2xl border-4 border-white flex flex-col items-center text-center">
        {/* Modal Header */}
        <h2 className="text-2xl md:text-3xl font-black text-[#42394F] tracking-wide mb-3">
          HOW TO PLAY
        </h2>

        {/* Illustrated Board Panel */}
        <div className={`w-full h-64 rounded-2xl ${page.bg} p-2 flex items-center justify-center shadow-md relative overflow-hidden border-2 border-white/50`}>
          {page.content}
        </div>

        {/* Explanatory Text */}
        <p className="min-h-[58px] text-base md:text-lg font-extrabold text-[#42394F] leading-tight px-2 my-4 flex items-center justify-center">
          {page.text}
        </p>

        {/* 6 Circular Page Dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                sounds.playClick();
                setCurrentPage(idx);
              }}
              className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                idx === currentPage
                  ? 'bg-[#E67E22] scale-110'
                  : 'bg-[#F5CBA7] hover:bg-[#EDBB99]'
              }`}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation Buttons Row */}
        <div className="flex items-center justify-between w-full gap-3">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-b-4 transition-all ${
              currentPage === 0
                ? 'bg-neutral-300 text-neutral-400 border-neutral-400 cursor-not-allowed opacity-50'
                : 'bg-[#7D3C98] hover:bg-[#6C3483] active:scale-95 text-white border-[#512E5F] cursor-pointer'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-8 h-8 stroke-[3]" />
          </button>

          {/* OK Button */}
          <button
            onClick={handleOk}
            className="flex-1 h-14 bg-[#8E44AD] hover:bg-[#7D3C98] active:scale-95 transition-all text-white font-black text-2xl rounded-2xl shadow-md border-b-4 border-[#6C3483] cursor-pointer flex items-center justify-center"
          >
            {currentPage === pages.length - 1 ? 'LET\'S PLAY' : 'OK'}
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentPage === pages.length - 1}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-b-4 transition-all ${
              currentPage === pages.length - 1
                ? 'bg-neutral-300 text-neutral-400 border-neutral-400 cursor-not-allowed opacity-50'
                : 'bg-[#7D3C98] hover:bg-[#6C3483] active:scale-95 text-white border-[#512E5F] cursor-pointer'
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-8 h-8 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};

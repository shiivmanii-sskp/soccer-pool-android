/**
 * Soccer Pool - Main Application Controller
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, Difficulty, Team, GameStatePhase, MatchScores, ShotAim } from './types/game';
import { PhysicsEngine } from './physics/engine';
import { BotAI } from './ai/bot';
import { sounds } from './audio/sound';
import { PitchCanvas } from './components/PitchCanvas';
import { Scoreboard } from './components/Scoreboard';
import { MainMenu } from './components/MainMenu';
import { TutorialModal } from './components/TutorialModal';
import { QuitModal } from './components/QuitModal';
import { GameOverModal } from './components/GameOverModal';
import { GoalSplash } from './components/GoalSplash';

export default function App() {
  // Navigation & Settings State
  const [phase, setPhase] = useState<GameStatePhase>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('bot');
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      const saved = localStorage.getItem('soccer_pool_diff') as Difficulty;
      if (saved === 'easy' || saved === 'medium' || saved === 'hard') return saved;
    } catch {
      // Ignore
    }
    return 'medium';
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);

  // Gameplay Match State
  const [scores, setScores] = useState<MatchScores>({ red: 0, blue: 0 });
  const [currentTurn, setCurrentTurn] = useState<Team>('red');
  const [scoringTeam, setScoringTeam] = useState<Team | null>(null);
  const [winner, setWinner] = useState<Team | null>(null);

  // Physics engine instance (stable across renders)
  const engineRef = useRef<PhysicsEngine>(new PhysicsEngine());
  const [engineVersion, setEngineVersion] = useState<number>(0);

  // Bot Thinking Timer
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Force re-render of canvas components when needed
  const refreshEngine = () => setEngineVersion((v) => v + 1);

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Select difficulty
  const handleSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    try {
      localStorage.setItem('soccer_pool_diff', d);
    } catch {
      // Ignore
    }
  };

  // Start new match
  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setScores({ red: 0, blue: 0 });
    setCurrentTurn('red');
    setScoringTeam(null);
    setWinner(null);
    engineRef.current.resetFormation();
    refreshEngine();
    sounds.playWhistle();
    setPhase('ready');
  };

  // Reset match completely
  const handleResetMatch = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setScores({ red: 0, blue: 0 });
    setCurrentTurn('red');
    setScoringTeam(null);
    setWinner(null);
    engineRef.current.resetFormation();
    refreshEngine();
    sounds.playWhistle();
    setPhase('ready');
  };

  // Exit match to main menu
  const handleExitToMenu = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setShowQuitModal(false);
    setPhase('menu');
  };

  // Execute bot turn
  const triggerBotTurn = useCallback(() => {
    setPhase('bot_thinking');

    // Thinking delay of 1.1s so player sees "Bot thinking..."
    botTimerRef.current = setTimeout(() => {
      const decision = BotAI.calculateShot(engineRef.current.bodies, difficulty);
      if (decision) {
        engineRef.current.startTurn();
        engineRef.current.applyImpulse(decision.pieceId, decision.impulseX, decision.impulseY);
        setPhase('simulating');
      } else {
        // Fallback: pass turn if no move found
        setCurrentTurn('red');
        setPhase('ready');
      }
    }, 1100);
  }, [difficulty]);

  // Handle shot release from user
  const handleShotCompleted = (aim: ShotAim) => {
    if (phase !== 'ready' && phase !== 'aiming') return;

    // Impulse scaling: max ~52 units
    const maxImpulse = 52;
    const impulseMag = aim.power * maxImpulse;
    const impulseX = Math.cos(aim.angle) * impulseMag;
    const impulseY = Math.sin(aim.angle) * impulseMag;

    engineRef.current.startTurn();
    engineRef.current.applyImpulse(aim.pieceId, impulseX, impulseY);
    setPhase('simulating');
  };

  // Main simulation ticker when in 'simulating' or 'goal_celebration' phase
  useEffect(() => {
    if (phase !== 'simulating' && phase !== 'goal_celebration') return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(2.0, (time - lastTime) / 16.666);
      lastTime = time;

      const result = engineRef.current.update(dt);

      if (result.goalScoredBy && phase === 'simulating') {
        // Goal scored!
        const scorer = result.goalScoredBy;
        setScoringTeam(scorer);
        sounds.playGoal();
        setPhase('goal_celebration');

        setScores((prev) => {
          const newScores = {
            ...prev,
            [scorer]: prev[scorer] + 1,
          };

          // Check for victory (First to 3 goals)
          if (newScores[scorer] >= 3) {
            setTimeout(() => {
              setWinner(scorer);
              setPhase('game_over');
            }, 1800);
          } else {
            // Kickoff reset
            setTimeout(() => {
              setScoringTeam(null);
              engineRef.current.resetFormation();
              refreshEngine();
              sounds.playWhistle();

              // Conceding team gets kickoff
              const nextTurn = scorer === 'red' ? 'blue' : 'red';
              setCurrentTurn(nextTurn);

              if (nextTurn === 'blue' && gameMode === 'bot') {
                triggerBotTurn();
              } else {
                setPhase('ready');
              }
            }, 1900);
          }

          return newScores;
        });
      }

      if (phase === 'simulating' && result.isSettled) {
        // Turn ended without a goal
        const nextTurn = currentTurn === 'red' ? 'blue' : 'red';
        setCurrentTurn(nextTurn);

        if (nextTurn === 'blue' && gameMode === 'bot') {
          triggerBotTurn();
        } else {
          setPhase('ready');
        }
        return; // Stop simulating
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [phase, currentTurn, gameMode, triggerBotTurn]);

  // Cleanup bot timer on unmount
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, []);

  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-[#E78F68] touch-none select-none">
      {/* 1. Main Menu View */}
      {phase === 'menu' && (
        <MainMenu
          difficulty={difficulty}
          onSelectDifficulty={handleSelectDifficulty}
          onStartGame={handleStartGame}
          onOpenTutorial={() => setShowTutorial(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. Active Gameplay View */}
      {phase !== 'menu' && (
        <div className="relative w-full h-full max-w-md mx-auto flex flex-col items-center justify-between overflow-hidden">
          {/* Top Scoreboard HUD */}
          <Scoreboard
            scores={scores}
            gameMode={gameMode}
            difficulty={difficulty}
            currentTurn={currentTurn}
            isBotThinking={phase === 'bot_thinking'}
            onBackClick={() => setShowQuitModal(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />

          {/* Goal Splash Animation Banner */}
          {scoringTeam && <GoalSplash scoringTeam={scoringTeam} />}

          {/* Pitch Canvas Rendering Area */}
          <div
            style={{ paddingTop: 'var(--pitch-pt)' }}
            className="w-full flex-1 min-h-0 flex items-center justify-center pb-3"
          >
            <PitchCanvas
              key={engineVersion}
              engine={engineRef.current}
              currentTurn={currentTurn}
              phase={phase}
              isBotThinking={phase === 'bot_thinking'}
              onShotCompleted={handleShotCompleted}
            />
          </div>

          {/* Game Over Modal */}
          {phase === 'game_over' && winner && (
            <GameOverModal
              scores={scores}
              gameMode={gameMode}
              winner={winner}
              onPlayAgain={handleResetMatch}
              onMainMenu={handleExitToMenu}
            />
          )}

          {/* Quit Confirmation Modal */}
          <QuitModal
            isOpen={showQuitModal}
            onConfirmQuit={handleExitToMenu}
            onCancelQuit={() => setShowQuitModal(false)}
          />
        </div>
      )}

      {/* 3. Global Tutorial Modal (Accessible from menu) */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </main>
  );
}

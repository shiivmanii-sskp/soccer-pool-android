/**
 * Soccer Pool - Game & Physics Types
 */

export type Team = 'red' | 'blue'; // Red = bottom (You / P1), Blue = top (Bot / P2)
export type GameMode = 'bot' | 'friend';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameStatePhase =
  | 'menu'
  | 'ready'
  | 'aiming'
  | 'simulating'
  | 'bot_thinking'
  | 'goal_celebration'
  | 'game_over';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PhysicsBody {
  id: string;
  type: 'player' | 'ball';
  team?: Team;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  friction: number;
  restitution: number;
  isGoalKeeper?: boolean;
}

export interface ShotAim {
  pieceId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  power: number; // 0 to 1
  angle: number; // radians
  dragDistance: number;
}

export interface MatchScores {
  red: number;
  blue: number;
}

export interface PitchDimensions {
  width: number;
  height: number;
  goalWidth: number;
  goalDepth: number;
  borderPadding: number;
  centerCircleRadius: number;
  penaltyBoxWidth: number;
  penaltyBoxHeight: number;
}

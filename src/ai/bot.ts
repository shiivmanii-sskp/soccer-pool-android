/**
 * Bot AI for Soccer Pool
 * Supports Easy, Medium, and Hard difficulty levels.
 */

import { PhysicsBody, Difficulty } from '../types/game';
import { FIELD_BOUNDS, PITCH_CONFIG } from '../physics/engine';

export interface BotShotDecision {
  pieceId: string;
  impulseX: number;
  impulseY: number;
  power: number;
  aimAngle: number; // in radians
}

export class BotAI {
  public static calculateShot(
    bodies: PhysicsBody[],
    difficulty: Difficulty
  ): BotShotDecision | null {
    const ball = bodies.find((b) => b.type === 'ball');
    const bluePieces = bodies.filter((b) => b.team === 'blue');

    if (!ball || bluePieces.length === 0) return null;

    // Target goal center (Bottom goal at y = 700, x = 225)
    const opponentGoalCenter = {
      x: PITCH_CONFIG.width / 2,
      y: FIELD_BOUNDS.bottom,
    };

    if (difficulty === 'easy') {
      return this.calculateEasyShot(bluePieces, ball);
    } else if (difficulty === 'medium') {
      return this.calculateMediumShot(bluePieces, ball, opponentGoalCenter, bodies);
    } else {
      return this.calculateHardShot(bluePieces, ball, opponentGoalCenter, bodies);
    }
  }

  private static calculateEasyShot(
    bluePieces: PhysicsBody[],
    ball: PhysicsBody
  ): BotShotDecision {
    // Pick random non-goalkeeper piece, or closest piece
    const outfieldPieces = bluePieces.filter((p) => !p.isGoalKeeper);
    const candidates = outfieldPieces.length > 0 ? outfieldPieces : bluePieces;
    const piece = candidates[Math.floor(Math.random() * candidates.length)];

    // Aim from piece to ball
    let angle = Math.atan2(ball.y - piece.y, ball.x - piece.x);

    // Add significant error (+/- 25 to 35 degrees)
    const error = (Math.random() - 0.5) * (Math.PI / 3);
    angle += error;

    const power = 0.4 + Math.random() * 0.4; // 0.4 to 0.8
    const maxImpulse = 42;
    const impulseMag = power * maxImpulse;

    return {
      pieceId: piece.id,
      impulseX: Math.cos(angle) * impulseMag,
      impulseY: Math.sin(angle) * impulseMag,
      power,
      aimAngle: angle,
    };
  }

  private static calculateMediumShot(
    bluePieces: PhysicsBody[],
    ball: PhysicsBody,
    goal: { x: number; y: number },
    allBodies: PhysicsBody[]
  ): BotShotDecision {
    // Evaluate outfield pieces
    const eligiblePieces = bluePieces.filter((p) => {
      // Don't use GK unless ball is very close to blue goal
      if (p.isGoalKeeper && ball.y > 180) return false;
      return true;
    });

    let bestPiece = eligiblePieces[0] || bluePieces[0];
    let bestScore = -Infinity;
    let bestAngle = 0;
    let bestPower = 0.7;

    for (const piece of eligiblePieces) {
      // Desired direction for ball: from ball to opponent goal
      const ballToGoalAngle = Math.atan2(goal.y - ball.y, goal.x - ball.x);

      // Ideal spot to hit the ball: behind the ball opposite to goal
      const idealImpactX = ball.x - Math.cos(ballToGoalAngle) * (ball.radius + piece.radius);
      const idealImpactY = ball.y - Math.sin(ballToGoalAngle) * (ball.radius + piece.radius);

      // Angle from piece to ideal impact point
      const pieceToBallAngle = Math.atan2(idealImpactY - piece.y, idealImpactX - piece.x);

      // Distance from piece to ball
      const dist = Math.hypot(ball.x - piece.x, ball.y - piece.y);

      // Check alignment: piece should ideally be behind ball relative to opponent goal
      const isBehindBall = piece.y < ball.y;
      let score = isBehindBall ? 200 - dist * 0.5 : 50 - dist * 0.5;

      // Check if path to ball has obstacles
      if (this.isPathBlocked(piece, ball, allBodies)) {
        score -= 80;
      }

      if (score > bestScore) {
        bestScore = score;
        bestPiece = piece;
        bestAngle = pieceToBallAngle;
        bestPower = Math.min(0.9, Math.max(0.5, dist / 280));
      }
    }

    // Moderate aiming noise (+/- 6 to 10 degrees)
    const noise = (Math.random() - 0.5) * (Math.PI / 15);
    bestAngle += noise;

    const impulseMag = bestPower * 48;

    return {
      pieceId: bestPiece.id,
      impulseX: Math.cos(bestAngle) * impulseMag,
      impulseY: Math.sin(bestAngle) * impulseMag,
      power: bestPower,
      aimAngle: bestAngle,
    };
  }

  private static calculateHardShot(
    bluePieces: PhysicsBody[],
    ball: PhysicsBody,
    goal: { x: number; y: number },
    allBodies: PhysicsBody[]
  ): BotShotDecision {
    // Hard AI tests multiple target spots on the opponent goal (left corner, center, right corner)
    const goalTargets = [
      { x: FIELD_BOUNDS.goalLeft + 20, y: FIELD_BOUNDS.bottom + 10 },
      { x: PITCH_CONFIG.width / 2, y: FIELD_BOUNDS.bottom + 10 },
      { x: FIELD_BOUNDS.goalRight - 20, y: FIELD_BOUNDS.bottom + 10 },
    ];

    let bestDecision: BotShotDecision | null = null;
    let highestScore = -Infinity;

    for (const piece of bluePieces) {
      // If piece is GK and ball is on opponent's half, leave GK in position unless direct clear
      if (piece.isGoalKeeper && ball.y > 320) continue;

      for (const target of goalTargets) {
        // Desired trajectory for the ball to enter target
        const ballToTargetAngle = Math.atan2(target.y - ball.y, target.x - ball.x);

        // Required collision point on the ball surface
        const contactX = ball.x - Math.cos(ballToTargetAngle) * (ball.radius + piece.radius);
        const contactY = ball.y - Math.sin(ballToTargetAngle) * (ball.radius + piece.radius);

        // Required aim angle for piece
        const aimAngle = Math.atan2(contactY - piece.y, contactX - piece.x);
        const distToBall = Math.hypot(contactX - piece.x, contactY - piece.y);

        // Heuristic evaluation
        let score = 0;

        // Is piece behind the ball (higher up the field towards blue side)?
        if (piece.y < ball.y) {
          score += 300;
        } else {
          score -= 100; // Need to hit from behind or bank
        }

        // Proximity bonus
        score += Math.max(0, 300 - distToBall);

        // Directness of collision angle
        const angleDiff = Math.abs(aimAngle - ballToTargetAngle);
        score += Math.cos(angleDiff) * 150;

        // Check if path from piece to contact point is blocked
        const blocked = this.isPathBlocked(piece, { x: contactX, y: contactY, radius: ball.radius } as PhysicsBody, allBodies);
        if (blocked) {
          score -= 250;
        }

        // Distance from ball to opponent goal
        const ballToGoalDist = Math.hypot(target.x - ball.x, target.y - ball.y);
        if (ballToGoalDist < 250) {
          score += 200; // Scoring opportunity!
        }

        // Danger check: Don't shoot into own goal!
        if (Math.sin(aimAngle) < -0.5 && ball.y < 220) {
          score -= 500;
        }

        if (score > highestScore) {
          highestScore = score;
          const power = Math.min(1.0, Math.max(0.65, (distToBall + ballToGoalDist) / 450));
          const subtleNoise = (Math.random() - 0.5) * (Math.PI / 60); // Tiny realistic error

          bestDecision = {
            pieceId: piece.id,
            impulseX: Math.cos(aimAngle + subtleNoise) * power * 54,
            impulseY: Math.sin(aimAngle + subtleNoise) * power * 54,
            power,
            aimAngle: aimAngle + subtleNoise,
          };
        }
      }
    }

    if (!bestDecision) {
      // Fallback to medium logic
      return this.calculateMediumShot(bluePieces, ball, goal, allBodies);
    }

    return bestDecision;
  }

  private static isPathBlocked(
    from: PhysicsBody,
    to: { x: number; y: number; radius: number },
    allBodies: PhysicsBody[]
  ): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return false;

    const nx = dx / dist;
    const ny = dy / dist;

    for (const body of allBodies) {
      if (body.id === from.id || body.type === 'ball') continue;

      // Project body onto line segment from -> to
      const bx = body.x - from.x;
      const by = body.y - from.y;
      const proj = bx * nx + by * ny;

      if (proj > from.radius && proj < dist - to.radius) {
        // Perpendicular distance
        const perpDist = Math.abs(bx * -ny + by * nx);
        if (perpDist < from.radius + body.radius) {
          return true; // Blocked!
        }
      }
    }

    return false;
  }
}

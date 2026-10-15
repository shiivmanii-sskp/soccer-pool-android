/**
 * 2D Physics Engine for Soccer Pool
 * Handles circle-circle collision, wall bounces, goal posts, restitution, and goal detection.
 */

import { PhysicsBody, PitchDimensions, Team } from '../types/game';
import { sounds } from '../audio/sound';

export const PITCH_CONFIG: PitchDimensions = {
  width: 450,
  height: 750,
  goalWidth: 140,
  goalDepth: 40,
  borderPadding: 24,
  centerCircleRadius: 46,
  penaltyBoxWidth: 210,
  penaltyBoxHeight: 76,
};

export const FIELD_BOUNDS = {
  left: PITCH_CONFIG.borderPadding,
  right: PITCH_CONFIG.width - PITCH_CONFIG.borderPadding,
  top: 50,
  bottom: 700,
  goalLeft: (PITCH_CONFIG.width - PITCH_CONFIG.goalWidth) / 2, // 155
  goalRight: (PITCH_CONFIG.width + PITCH_CONFIG.goalWidth) / 2, // 295
  topNetY: 50 - PITCH_CONFIG.goalDepth + 5, // 15
  bottomNetY: 700 + PITCH_CONFIG.goalDepth - 5, // 735
};

export function createInitialBodies(): PhysicsBody[] {
  const bodies: PhysicsBody[] = [];

  // Football
  bodies.push({
    id: 'ball',
    type: 'ball',
    x: PITCH_CONFIG.width / 2,
    y: (FIELD_BOUNDS.top + FIELD_BOUNDS.bottom) / 2, // 375
    vx: 0,
    vy: 0,
    radius: 11,
    mass: 1.0,
    friction: 0.987,
    restitution: 0.85,
  });

  // Blue Team (Top / Bot / P2) - 5 pieces
  const blueFormation = [
    { x: 225, y: 80, isGoalKeeper: true },     // GK
    { x: 125, y: 145, isGoalKeeper: false },   // Left wing
    { x: 325, y: 145, isGoalKeeper: false },   // Right wing
    { x: 185, y: 205, isGoalKeeper: false },   // Mid/Att 1
    { x: 265, y: 205, isGoalKeeper: false },   // Mid/Att 2
  ];

  blueFormation.forEach((pos, idx) => {
    bodies.push({
      id: `blue_${idx}`,
      type: 'player',
      team: 'blue',
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 19,
      mass: 3.5,
      friction: 0.983,
      restitution: 0.82,
      isGoalKeeper: pos.isGoalKeeper,
    });
  });

  // Red Team (Bottom / You / P1) - 5 pieces
  const redFormation = [
    { x: 225, y: 670, isGoalKeeper: true },    // GK
    { x: 125, y: 605, isGoalKeeper: false },   // Left wing
    { x: 325, y: 605, isGoalKeeper: false },   // Right wing
    { x: 185, y: 545, isGoalKeeper: false },   // Mid/Att 1
    { x: 265, y: 545, isGoalKeeper: false },   // Mid/Att 2
  ];

  redFormation.forEach((pos, idx) => {
    bodies.push({
      id: `red_${idx}`,
      type: 'player',
      team: 'red',
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      radius: 19,
      mass: 3.5,
      friction: 0.983,
      restitution: 0.82,
      isGoalKeeper: pos.isGoalKeeper,
    });
  });

  return bodies;
}

export interface SimulationResult {
  goalScoredBy: Team | null;
  isSettled: boolean;
}

export class PhysicsEngine {
  public bodies: PhysicsBody[];
  private goalDetected: Team | null = null;
  private goalReported: boolean = false;
  private settledFrames = 0;
  private simulationStartTime = 0;

  constructor(bodies?: PhysicsBody[]) {
    this.bodies = bodies ? JSON.parse(JSON.stringify(bodies)) : createInitialBodies();
  }

  public resetFormation() {
    this.bodies = createInitialBodies();
    this.goalDetected = null;
    this.goalReported = false;
    this.settledFrames = 0;
  }

  public startTurn() {
    this.goalDetected = null;
    this.goalReported = false;
    this.settledFrames = 0;
    this.simulationStartTime = Date.now();
  }

  public applyImpulse(bodyId: string, impulseX: number, impulseY: number) {
    const body = this.bodies.find(b => b.id === bodyId);
    if (!body) return;

    // Apply impulse: delta_v = impulse / mass
    body.vx += impulseX / body.mass;
    body.vy += impulseY / body.mass;

    sounds.playKick(Math.min(1, Math.hypot(impulseX, impulseY) / 60));
  }

  public update(dt: number = 1): SimulationResult {
    const { left, right, top, bottom, goalLeft, goalRight, topNetY, bottomNetY } = FIELD_BOUNDS;

    // 1. Position update and friction
    for (const body of this.bodies) {
      body.x += body.vx * dt;
      body.y += body.vy * dt;

      // Apply linear friction
      body.vx *= Math.pow(body.friction, dt);
      body.vy *= Math.pow(body.friction, dt);

      // Clamp very small speeds to zero
      const speedSq = body.vx * body.vx + body.vy * body.vy;
      if (speedSq < 0.003) {
        body.vx = 0;
        body.vy = 0;
      }
    }

    // 2. Wall Collisions & Goal Boundaries
    for (const body of this.bodies) {
      const isBall = body.type === 'ball';
      const r = body.radius;

      // Left Wall
      if (body.x - r < left) {
        body.x = left + r;
        body.vx = -body.vx * body.restitution;
        sounds.playWallBounce(Math.abs(body.vx) / 10);
      }
      // Right Wall
      if (body.x + r > right) {
        body.x = right - r;
        body.vx = -body.vx * body.restitution;
        sounds.playWallBounce(Math.abs(body.vx) / 10);
      }

      // Top Boundary & Top Goal (Blue Goal, attacked by Red)
      const inTopGoalMouthX = body.x > goalLeft && body.x < goalRight;

      if (isBall && inTopGoalMouthX) {
        // Ball passing through or inside the open goal mouth
        if (body.y <= top) {
          // Ball center crossed the goal line into top net!
          if (!this.goalDetected && body.vy <= 0) {
            this.goalDetected = 'red'; // Red scored into Blue's goal!
          }

          // Gentle cloth netting air resistance / damping
          body.vx *= Math.pow(0.85, dt);
          body.vy *= Math.pow(0.85, dt);

          // Top Net Sides
          if (body.x - r < goalLeft) {
            body.x = goalLeft + r;
            body.vx = -body.vx * 0.15;
          } else if (body.x + r > goalRight) {
            body.x = goalRight - r;
            body.vx = -body.vx * 0.15;
          }

          // Back of Top Net (y = topNetY)
          if (body.y - r < topNetY) {
            body.y = topNetY + r;
            body.vy = Math.abs(body.vy) * 0.05; // Soft cushion, no reflection back to pitch
            body.vx *= 0.3;
          }
        }
      } else {
        // Player pieces or ball outside goal mouth bounce off top field edge
        if (body.y - r < top) {
          body.y = top + r;
          body.vy = -body.vy * body.restitution;
          sounds.playWallBounce(Math.abs(body.vy) / 10);
        }
      }

      // Bottom Boundary & Bottom Goal (Red Goal, attacked by Blue)
      const inBottomGoalMouthX = body.x > goalLeft && body.x < goalRight;

      if (isBall && inBottomGoalMouthX) {
        // Ball passing through or inside the open goal mouth
        if (body.y >= bottom) {
          // Ball center crossed the goal line into bottom net!
          if (!this.goalDetected && body.vy >= 0) {
            this.goalDetected = 'blue'; // Blue scored into Red's goal!
          }

          // Gentle cloth netting air resistance / damping
          body.vx *= Math.pow(0.85, dt);
          body.vy *= Math.pow(0.85, dt);

          // Bottom Net Sides
          if (body.x - r < goalLeft) {
            body.x = goalLeft + r;
            body.vx = -body.vx * 0.15;
          } else if (body.x + r > goalRight) {
            body.x = goalRight - r;
            body.vx = -body.vx * 0.15;
          }

          // Back of Bottom Net (y = bottomNetY)
          if (body.y + r > bottomNetY) {
            body.y = bottomNetY - r;
            body.vy = -Math.abs(body.vy) * 0.05; // Soft cushion, no reflection back to pitch
            body.vx *= 0.3;
          }
        }
      } else {
        // Player pieces or ball outside goal mouth bounce off bottom field edge
        if (body.y + r > bottom) {
          body.y = bottom - r;
          body.vy = -body.vy * body.restitution;
          sounds.playWallBounce(Math.abs(body.vy) / 10);
        }
      }

      // Goal post corner collisions for realistic ricochets
      const posts = [
        { x: goalLeft, y: top },
        { x: goalRight, y: top },
        { x: goalLeft, y: bottom },
        { x: goalRight, y: bottom },
      ];
      for (const post of posts) {
        // Skip front post collision if ball is already inside the net
        if (isBall) {
          if (post.y === top && body.y < top - 2) continue;
          if (post.y === bottom && body.y > bottom + 2) continue;
        }

        const dx = body.x - post.x;
        const dy = body.y - post.y;
        const dist = Math.hypot(dx, dy);
        const postRadius = 6;
        if (dist < r + postRadius && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = r + postRadius - dist;
          body.x += nx * overlap;
          body.y += ny * overlap;

          const dot = body.vx * nx + body.vy * ny;
          if (dot < 0) {
            body.vx -= (1 + body.restitution) * dot * nx;
            body.vy -= (1 + body.restitution) * dot * ny;
            sounds.playWallBounce(0.6);
          }
        }
      }
    }

    // 3. Circle-Circle Body Collisions
    const len = this.bodies.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const b1 = this.bodies[i];
        const b2 = this.bodies[j];

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0.0001) {
          const nx = dx / dist;
          const ny = dy / dist;

          // Position separation (prevent sinking/overlap)
          const overlap = minDist - dist;
          const totalMass = b1.mass + b2.mass;
          const m1Ratio = b2.mass / totalMass;
          const m2Ratio = b1.mass / totalMass;

          b1.x -= nx * overlap * m1Ratio;
          b1.y -= ny * overlap * m1Ratio;
          b2.x += nx * overlap * m2Ratio;
          b2.y += ny * overlap * m2Ratio;

          // Relative velocity along collision normal
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const velAlongNormal = kx * nx + ky * ny;

          // Only resolve if bodies are moving toward each other
          if (velAlongNormal > 0) {
            const e = Math.min(b1.restitution, b2.restitution);
            const impulseMagnitude = ((1 + e) * velAlongNormal) / (1 / b1.mass + 1 / b2.mass);

            const ix = impulseMagnitude * nx;
            const iy = impulseMagnitude * ny;

            b1.vx -= ix / b1.mass;
            b1.vy -= iy / b1.mass;
            b2.vx += ix / b2.mass;
            b2.vy += iy / b2.mass;

            // Audio cues
            const impactSpeed = velAlongNormal;
            if (b1.type === 'ball' || b2.type === 'ball') {
              sounds.playBallHit(Math.min(1, impactSpeed / 12));
            } else {
              sounds.playBallHit(Math.min(0.6, impactSpeed / 16));
            }
          }
        }
      }
    }

    // 4. Settled State Detection
    let allStill = true;
    for (const b of this.bodies) {
      if (Math.hypot(b.vx, b.vy) > 0.05) {
        allStill = false;
        break;
      }
    }

    if (allStill) {
      this.settledFrames++;
    } else {
      this.settledFrames = 0;
    }

    // Failsafe timeout after 5.5s
    const timedOut = Date.now() - this.simulationStartTime > 5500;
    if (timedOut) {
      for (const b of this.bodies) {
        b.vx = 0;
        b.vy = 0;
      }
    }

    let newlyScored: Team | null = null;
    if (this.goalDetected && !this.goalReported) {
      newlyScored = this.goalDetected;
      this.goalReported = true;
    }

    const isSettled = this.settledFrames >= 10 || timedOut;

    return {
      goalScoredBy: newlyScored,
      isSettled,
    };
  }
}

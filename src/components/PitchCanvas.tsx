/**
 * High-DPI Soccer Pitch Canvas with Physics Simulation, Slingshot Controls, and Visual Polish
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PhysicsBody, ShotAim, Team, GameStatePhase } from '../types/game';
import { PhysicsEngine, PITCH_CONFIG, FIELD_BOUNDS } from '../physics/engine';
import { sounds } from '../audio/sound';

interface PitchCanvasProps {
  engine: PhysicsEngine;
  currentTurn: Team;
  phase: GameStatePhase;
  isBotThinking: boolean;
  onShotCompleted: (aim: ShotAim) => void;
  onGoalCelebrated?: () => void;
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({
  engine,
  currentTurn,
  phase,
  isBotThinking,
  onShotCompleted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active aiming state
  const [aim, setAim] = useState<ShotAim | null>(null);
  const aimRef = useRef<ShotAim | null>(null);
  aimRef.current = aim;

  // Selected piece ID
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  // Orbit rotation animation for active piece selection rings
  const ringAngleRef = useRef<number>(0);

  // High-DPI Canvas scaling
  const scaleRef = useRef<{ scale: number; offsetX: number; offsetY: number }>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  // Calculate pointer coordinates in pitch virtual coordinate space (450 x 750)
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;

    const { scale, offsetX, offsetY } = scaleRef.current;
    return {
      x: (cssX - offsetX) / scale,
      y: (cssY - offsetY) / scale,
    };
  }, []);

  // Pointer interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'ready' && phase !== 'aiming') return;
    if (isBotThinking) return;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // Find if user tapped one of their own pieces
    const eligiblePieces = engine.bodies.filter(
      (b) => b.type === 'player' && b.team === currentTurn
    );

    let clickedPiece: PhysicsBody | null = null;
    let minD = Infinity;

    for (const piece of eligiblePieces) {
      const d = Math.hypot(piece.x - x, piece.y - y);
      // Give a generous touch hit radius for mobile fingers (radius + 18)
      if (d <= piece.radius + 18 && d < minD) {
        minD = d;
        clickedPiece = piece;
      }
    }

    if (clickedPiece) {
      // Capture pointer
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setSelectedPieceId(clickedPiece.id);
      const newAim: ShotAim = {
        pieceId: clickedPiece.id,
        startX: clickedPiece.x,
        startY: clickedPiece.y,
        currentX: x,
        currentY: y,
        power: 0,
        angle: 0,
        dragDistance: 0,
      };
      setAim(newAim);
      sounds.playClick();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!aimRef.current) return;

    const currentAim = aimRef.current;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // Slingshot logic: drag vector is from piece to touch pointer
    const dx = x - currentAim.startX;
    const dy = y - currentAim.startY;
    const dist = Math.hypot(dx, dy);

    // Max drag clamp
    const maxDrag = 110;
    const clampedDist = Math.min(dist, maxDrag);
    const power = clampedDist / maxDrag;

    // Shot angle is opposite to drag vector (slingshot flick!)
    const shotAngle = Math.atan2(-dy, -dx);

    setAim({
      ...currentAim,
      currentX: x,
      currentY: y,
      power,
      angle: shotAngle,
      dragDistance: clampedDist,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!aimRef.current) return;
    const currentAim = aimRef.current;

    // Release pointer capture
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    // Minimum drag threshold to prevent accidental taps
    if (currentAim.dragDistance > 14 && currentAim.power > 0.08) {
      onShotCompleted(currentAim);
    }

    setAim(null);
    setSelectedPieceId(null);
  };

  const handlePointerCancel = () => {
    setAim(null);
    setSelectedPieceId(null);
  };

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ringAngleRef.current += 0.02;

      // Handle canvas resize & high-DPI
      const container = containerRef.current;
      if (container) {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        if (
          canvas.width !== Math.floor(displayWidth * dpr) ||
          canvas.height !== Math.floor(displayHeight * dpr)
        ) {
          canvas.width = Math.floor(displayWidth * dpr);
          canvas.height = Math.floor(displayHeight * dpr);
        }

        // Fit pitch (450 x 750) into display maintaining aspect ratio
        const pitchAspect = PITCH_CONFIG.width / PITCH_CONFIG.height;
        const screenAspect = displayWidth / displayHeight;

        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;

        if (screenAspect > pitchAspect) {
          // Limited by height
          scale = displayHeight / PITCH_CONFIG.height;
          offsetX = (displayWidth - PITCH_CONFIG.width * scale) / 2;
        } else {
          // Limited by width
          scale = displayWidth / PITCH_CONFIG.width;
          offsetY = (displayHeight - PITCH_CONFIG.height * scale) / 2;
        }

        scaleRef.current = { scale, offsetX, offsetY };

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // Translate to pitch center
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
      }

      // 1. Draw Football Pitch
      drawPitch(ctx);

      // 2. Draw Aiming Indicator (if aiming)
      const currentAim = aimRef.current;
      if (currentAim && currentAim.dragDistance > 10) {
        drawAimGuide(ctx, currentAim, currentTurn);
      }

      // 3. Draw Player Pieces & Football
      drawBodies(ctx, engine.bodies, currentTurn, selectedPieceId, ringAngleRef.current, phase);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, currentTurn, selectedPieceId, phase]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="w-full h-full cursor-pointer block touch-none"
      />
    </div>
  );
};

/**
 * Draw the authentic soccer pitch matching the reference screenshots
 */
function drawPitch(ctx: CanvasRenderingContext2D) {
  const { width } = PITCH_CONFIG;
  const { left, right, top, bottom, goalLeft, goalRight, topNetY, bottomNetY } = FIELD_BOUNDS;
  const fieldW = right - left;
  const fieldH = bottom - top;

  // 1. TOP GOAL (Vibrant Blue/Cyan Net matching Blue Team)
  ctx.save();
  // Net base fill: bright cyan matching the blue team player pieces
  ctx.fillStyle = '#00BCD4';
  ctx.beginPath();
  ctx.roundRect(goalLeft, topNetY, goalRight - goalLeft, top - topNetY, [8, 8, 0, 0]);
  ctx.fill();

  // Distinct white rectangular frame
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Crisp White Net Mesh Grid Pattern
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  const netStep = 11;
  // Vertical net mesh lines
  for (let x = goalLeft + netStep; x < goalRight; x += netStep) {
    ctx.beginPath();
    ctx.moveTo(x, topNetY);
    ctx.lineTo(x, top);
    ctx.stroke();
  }
  // Horizontal net mesh lines
  for (let y = topNetY + netStep; y < top; y += netStep) {
    ctx.beginPath();
    ctx.moveTo(goalLeft, y);
    ctx.lineTo(goalRight, y);
    ctx.stroke();
  }
  ctx.restore();

  // 2. BOTTOM GOAL (Vibrant Coral Red Net matching Red Team)
  ctx.save();
  // Net base fill: bright coral red matching the red team player pieces
  ctx.fillStyle = '#FF5252';
  ctx.beginPath();
  ctx.roundRect(goalLeft, bottom, goalRight - goalLeft, bottomNetY - bottom, [0, 0, 8, 8]);
  ctx.fill();

  // Distinct white rectangular frame
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Crisp White Net Mesh Grid Pattern
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  // Vertical net mesh lines
  for (let x = goalLeft + netStep; x < goalRight; x += netStep) {
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, bottomNetY);
    ctx.stroke();
  }
  // Horizontal net mesh lines
  for (let y = bottom + netStep; y < bottomNetY; y += netStep) {
    ctx.beginPath();
    ctx.moveTo(goalLeft, y);
    ctx.lineTo(goalRight, y);
    ctx.stroke();
  }
  ctx.restore();

  // 3. MAIN PITCH GRASS WITH HORIZONTAL STRIPES
  ctx.save();
  // Clip to field bounds
  ctx.beginPath();
  ctx.rect(left, top, fieldW, fieldH);
  ctx.clip();

  const stripeCount = 10;
  const stripeHeight = fieldH / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#4CAF50' : '#43A047';
    ctx.fillRect(left, top + i * stripeHeight, fieldW, stripeHeight);
  }
  ctx.restore();

  // 4. WHITE PITCH MARKINGS
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Thick white outer border
  ctx.beginPath();
  ctx.rect(left, top, fieldW, fieldH);
  ctx.stroke();

  // Halfway line
  const midY = (top + bottom) / 2;
  ctx.beginPath();
  ctx.moveTo(left, midY);
  ctx.lineTo(right, midY);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(width / 2, midY, PITCH_CONFIG.centerCircleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(width / 2, midY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Top Penalty Box
  const pBoxW = PITCH_CONFIG.penaltyBoxWidth;
  const pBoxH = PITCH_CONFIG.penaltyBoxHeight;
  const pBoxLeft = (width - pBoxW) / 2;
  ctx.beginPath();
  ctx.rect(pBoxLeft, top, pBoxW, pBoxH);
  ctx.stroke();

  // Top Penalty Arc (D-arc)
  ctx.beginPath();
  ctx.arc(width / 2, top + pBoxH - 10, 32, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // Bottom Penalty Box
  ctx.beginPath();
  ctx.rect(pBoxLeft, bottom - pBoxH, pBoxW, pBoxH);
  ctx.stroke();

  // Bottom Penalty Arc (D-arc)
  ctx.beginPath();
  ctx.arc(width / 2, bottom - pBoxH + 10, 32, 1.2 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();

  // Clean white goal lines between the goal posts
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(goalLeft, top);
  ctx.lineTo(goalRight, top);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(goalLeft, bottom);
  ctx.lineTo(goalRight, bottom);
  ctx.stroke();

  // Goal Posts (white circular posts at the edges)
  const posts = [
    { x: goalLeft, y: top },
    { x: goalRight, y: top },
    { x: goalLeft, y: bottom },
    { x: goalRight, y: bottom },
  ];
  ctx.fillStyle = '#FFFFFF';
  for (const post of posts) {
    ctx.beginPath();
    ctx.arc(post.x, post.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E1E1E';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw Aiming Guide Cone and Trajectory Line (Screenshot 3)
 */
function drawAimGuide(ctx: CanvasRenderingContext2D, aim: ShotAim, team: Team) {
  ctx.save();

  const aimColor = team === 'red' ? 'rgba(231, 76, 60, 0.35)' : 'rgba(0, 180, 216, 0.35)';
  const solidColor = team === 'red' ? '#E74C3C' : '#00B4D8';

  // 1. Slingshot Pull Circle around the piece
  const dragDist = aim.dragDistance;
  ctx.fillStyle = aimColor;
  ctx.beginPath();
  ctx.arc(aim.startX, aim.startY, 20 + dragDist * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Trajectory Direction Cone (shooting forward!)
  const coneLength = 50 + aim.power * 150;
  const spreadAngle = 0.22 - aim.power * 0.08; // Narrower with higher power

  const p1Angle = aim.angle - spreadAngle;
  const p2Angle = aim.angle + spreadAngle;

  const x1 = aim.startX + Math.cos(p1Angle) * coneLength;
  const y1 = aim.startY + Math.sin(p1Angle) * coneLength;
  const x2 = aim.startX + Math.cos(p2Angle) * coneLength;
  const y2 = aim.startY + Math.sin(p2Angle) * coneLength;

  const gradient = ctx.createRadialGradient(
    aim.startX,
    aim.startY,
    15,
    aim.startX,
    aim.startY,
    coneLength
  );
  gradient.addColorStop(0, team === 'red' ? 'rgba(255, 87, 87, 0.55)' : 'rgba(3, 169, 244, 0.55)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(aim.startX, aim.startY);
  ctx.lineTo(x1, y1);
  ctx.arc(aim.startX, aim.startY, coneLength, p1Angle, p2Angle);
  ctx.closePath();
  ctx.fill();

  // 3. Central Trajectory Arrow Line
  ctx.strokeStyle = solidColor;
  ctx.lineWidth = 3.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(aim.startX, aim.startY);
  ctx.lineTo(aim.startX + Math.cos(aim.angle) * coneLength, aim.startY + Math.sin(aim.angle) * coneLength);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Slingshot Elastic Pull Line to Touch Point
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(aim.startX, aim.startY);
  ctx.lineTo(aim.currentX, aim.currentY);
  ctx.stroke();

  // Handle knob at touch point
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(aim.currentX, aim.currentY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1E1E1E';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw all player pieces and football with stars, dashed selection rings, and shadows
 */
function drawBodies(
  ctx: CanvasRenderingContext2D,
  bodies: PhysicsBody[],
  currentTurn: Team,
  selectedPieceId: string | null,
  ringAngle: number,
  phase: GameStatePhase
) {
  // Sort to render shadows first, then pieces, then football on top
  for (const body of bodies) {
    // 1. Subtle drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.arc(body.x + 2, body.y + 3, body.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (body.type === 'ball') {
      drawFootball(ctx, body);
    } else {
      drawPlayerPiece(
        ctx,
        body,
        currentTurn,
        selectedPieceId === body.id,
        ringAngle,
        phase
      );
    }
  }
}

/**
 * Draw classic soccer ball
 */
function drawFootball(ctx: CanvasRenderingContext2D, body: PhysicsBody) {
  ctx.save();
  const { x, y, radius } = body;

  // White base
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Black outer edge
  ctx.strokeStyle = '#1E1E1E';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Center black pentagon
  const pR = radius * 0.42;
  ctx.fillStyle = '#1E1E1E';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * pR;
    const py = y + Math.sin(a) * pR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Spokes from pentagon to edges
  ctx.strokeStyle = '#1E1E1E';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * pR;
    const py = y + Math.sin(a) * pR;
    const ex = x + Math.cos(a) * radius;
    const ey = y + Math.sin(a) * radius;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Subtle highlight gloss
  const gloss = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 1, x, y, radius);
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  gloss.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw Player Piece with Star and Animated Dashed Arc Selection Rings
 */
function drawPlayerPiece(
  ctx: CanvasRenderingContext2D,
  piece: PhysicsBody,
  currentTurn: Team,
  isSelected: boolean,
  ringAngle: number,
  phase: GameStatePhase
) {
  ctx.save();
  const { x, y, radius, team } = piece;

  const isCurrentTeam = team === currentTurn;
  const isPlayable = isCurrentTeam && (phase === 'ready' || phase === 'aiming');

  // 1. Dashed Selection Rings (from screenshots 1, 2, 4, 5, 8!)
  // In the reference screenshots, active pieces have 4 curved black dashed arcs orbiting them
  if (isPlayable) {
    ctx.save();
    const ringRadius = radius + 6;
    ctx.strokeStyle = '#1E1E1E';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    const segmentCount = 4;
    const arcLength = 0.8; // radians per dash
    for (let i = 0; i < segmentCount; i++) {
      const startAngle = ringAngle + (i * Math.PI * 2) / segmentCount;
      const endAngle = startAngle + arcLength;

      ctx.beginPath();
      ctx.arc(x, y, ringRadius, startAngle, endAngle);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Thick Black Outer Border (screenshot: solid circular black rim)
  ctx.fillStyle = '#1E1E1E';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // 3. Inner Colored Circle
  const innerRadius = radius - 3.2;
  const teamColor = team === 'blue' ? '#00BCD4' : '#FF5252';
  const teamColorDark = team === 'blue' ? '#0097A7' : '#D32F2F';

  // Subtle bevel gradient
  const grad = ctx.createLinearGradient(x - innerRadius, y - innerRadius, x + innerRadius, y + innerRadius);
  grad.addColorStop(0, teamColor);
  grad.addColorStop(1, teamColorDark);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  // 4. White Star in the Center (Screenshot: 5-pointed crisp white star)
  ctx.fillStyle = '#FFFFFF';
  drawStar(ctx, x, y, 5, 7.8, 3.8);

  // 5. Selected Highlight Ring
  if (isSelected) {
    ctx.strokeStyle = '#FFEB3B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw 5-pointed star helper
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerRadius;
    let y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

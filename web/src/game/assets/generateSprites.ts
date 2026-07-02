import Phaser from 'phaser';

import { STRATEGY_COLORS } from '../../simulation/strategies';
import type { AgentSnapshot, StrategyKey } from '../../simulation/types';

const FRAME = 16;
const COLS = 4;
const ROWS = 4;

const SKIN = '#f8d5b6';
const OUTLINE = '#1e1e1e';
const SHOE = '#2d3748';

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function drawCharacterFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  shirt: string,
  frame: number,
  direction: 'down' | 'left' | 'right' | 'up',
) {
  const legOffset = frame % 2 === 0 ? 0 : 1;
  const bob = frame % 2 === 0 ? 0 : -1;

  for (let y = 0; y < FRAME; y += 1) {
    for (let x = 0; x < FRAME; x += 1) {
      const px = ox + x;
      const py = oy + y + bob;
      const cx = x - 7;
      const cy = y - 8;

      if (direction === 'down') {
        if (cy >= -5 && cy <= -2 && Math.abs(cx) <= 3) drawPixel(ctx, px, py, SKIN);
        if (cy === -6 && Math.abs(cx) === 2) drawPixel(ctx, px, py, OUTLINE);
        if (cy >= -1 && cy <= 4 && Math.abs(cx) <= 3) drawPixel(ctx, px, py, shirt);
        if (cy === 5 && Math.abs(cx) <= 2) drawPixel(ctx, px, py, shirt);
        if (cy >= 6 && cy <= 8) {
          if (cx === -2 - legOffset || cx === 2 + legOffset) drawPixel(ctx, px, py, SHOE);
        }
        if (Math.abs(cx) === 4 && cy >= 0 && cy <= 3) drawPixel(ctx, px, py, OUTLINE);
      }

      if (direction === 'up') {
        if (cy >= -5 && cy <= -1 && Math.abs(cx) <= 3) drawPixel(ctx, px, py, shirt);
        if (cy === -6 && Math.abs(cx) <= 2) drawPixel(ctx, px, py, shirt);
        if (cy >= 6 && cy <= 8) {
          if (cx === -2 + legOffset || cx === 2 - legOffset) drawPixel(ctx, px, py, SHOE);
        }
      }

      if (direction === 'left') {
        if (cy >= -5 && cy <= -2 && cx >= -2 && cx <= 3) drawPixel(ctx, px, py, SKIN);
        if (cy >= -1 && cy <= 4 && cx >= -3 && cx <= 2) drawPixel(ctx, px, py, shirt);
        if (cy >= 6 && cy <= 8 && (cx === -3 - legOffset || cx === 0)) drawPixel(ctx, px, py, SHOE);
        if (cx === 3 && cy >= -1 && cy <= 2) drawPixel(ctx, px, py, SKIN);
      }

      if (direction === 'right') {
        if (cy >= -5 && cy <= -2 && cx >= -3 && cx <= 2) drawPixel(ctx, px, py, SKIN);
        if (cy >= -1 && cy <= 4 && cx >= -2 && cx <= 3) drawPixel(ctx, px, py, shirt);
        if (cy >= 6 && cy <= 8 && (cx === 0 || cx === 3 + legOffset)) drawPixel(ctx, px, py, SHOE);
        if (cx === -3 && cy >= -1 && cy <= 2) drawPixel(ctx, px, py, SKIN);
      }
    }
  }
}

export function spriteKeyForStrategy(name: StrategyKey): string {
  return `agent-${name}`;
}

export function registerAgentSpriteSheets(scene: Phaser.Scene) {
  const directions: Array<'down' | 'left' | 'right' | 'up'> = ['down', 'left', 'right', 'up'];

  for (const [name, color] of Object.entries(STRATEGY_COLORS) as Array<[StrategyKey, string]>) {
    const key = spriteKeyForStrategy(name);
    if (scene.textures.exists(key)) continue;

    const canvas = document.createElement('canvas');
    canvas.width = FRAME * COLS;
    canvas.height = FRAME * ROWS;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = false;

    directions.forEach((direction, row) => {
      for (let col = 0; col < COLS; col += 1) {
        drawCharacterFrame(ctx, col * FRAME, row * FRAME, color, col, direction);
      }
    });

    scene.textures.addCanvas(key, canvas);

    directions.forEach((direction) => {
      const animKey = `${key}-walk-${direction}`;
      if (scene.anims.exists(animKey)) return;
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(key, {
          start: direction === 'down' ? 0 : direction === 'left' ? 4 : direction === 'right' ? 8 : 12,
          end: direction === 'down' ? 3 : direction === 'left' ? 7 : direction === 'right' ? 11 : 15,
        }),
        frameRate: 7,
        repeat: -1,
      });
    });

    const idleKey = `${key}-idle-${directions[0]}`;
    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: [{ key, frame: 0 }],
        frameRate: 1,
      });
    }
  }
}

export function registerPropSprites(scene: Phaser.Scene) {
  const props: Array<{ key: string; draw: (ctx: CanvasRenderingContext2D) => void; w: number; h: number }> = [
    {
      key: 'prop-tree',
      w: 32,
      h: 40,
      draw: (ctx) => {
        for (let y = 0; y < 40; y += 1) {
          for (let x = 0; x < 32; x += 1) {
            const dx = x - 16;
            const dy = y - 14;
            if (y >= 24 && y <= 38 && Math.abs(x - 16) <= 2) drawPixel(ctx, x, y, '#775536');
            if (dx * dx + (dy + 4) * (dy + 4) < 100) drawPixel(ctx, x, y, '#80b36a');
            if ((dx + 8) ** 2 + (dy - 2) ** 2 < 36) drawPixel(ctx, x, y, '#8dc57a');
          }
        }
      },
    },
    {
      key: 'prop-desk',
      w: 48,
      h: 32,
      draw: (ctx) => {
        ctx.fillStyle = '#5b6b7c';
        ctx.fillRect(4, 8, 40, 16);
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(8, 24, 6, 8);
        ctx.fillRect(34, 24, 6, 8);
      },
    },
    {
      key: 'prop-monitor',
      w: 32,
      h: 28,
      draw: (ctx) => {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(12, 20, 8, 6);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(4, 4, 24, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(7, 7, 18, 10);
      },
    },
    {
      key: 'prop-couch',
      w: 56,
      h: 28,
      draw: (ctx) => {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(4, 12, 48, 12);
        ctx.fillStyle = '#3d4a5c';
        ctx.fillRect(4, 4, 48, 10);
        ctx.fillStyle = '#5a6b7d';
        ctx.fillRect(8, 14, 14, 8);
        ctx.fillRect(34, 14, 14, 8);
      },
    },
    {
      key: 'prop-arcade',
      w: 32,
      h: 48,
      draw: (ctx) => {
        ctx.fillStyle = '#2d1b69';
        ctx.fillRect(6, 8, 20, 36);
        ctx.fillStyle = '#ff6bcb';
        ctx.fillRect(8, 10, 16, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(9, 16, 14, 12);
      },
    },
  ];

  for (const prop of props) {
    if (scene.textures.exists(prop.key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = prop.w;
    canvas.height = prop.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;
    prop.draw(ctx);
    scene.textures.addCanvas(prop.key, canvas);
  }
}

export function facingToDirection(facing: AgentSnapshot['facing']): 'down' | 'left' | 'right' | 'up' {
  return facing;
}

export function tintFromColor(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return Phaser.Display.Color.GetColor(r, g, b);
}

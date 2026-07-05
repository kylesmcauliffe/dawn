import Phaser from 'phaser';

import type { TileKind } from './worldMap';

const TILE = 32;

function fillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawGrass(ctx: CanvasRenderingContext2D, base: string, accent: string, speck: string) {
  fillRect(ctx, 0, 0, TILE, TILE, base);
  fillRect(ctx, 0, 0, TILE, 2, accent);
  fillRect(ctx, 0, TILE - 2, TILE, 2, accent);
  for (let i = 0; i < 8; i += 1) {
    const x = (i * 7 + 3) % 28;
    const y = (i * 5 + 11) % 28;
    fillRect(ctx, x, y, 2, 2, speck);
  }
}

function drawTile(ctx: CanvasRenderingContext2D, kind: TileKind) {
  switch (kind) {
    case 'grass':
      drawGrass(ctx, '#68ab3c', '#5a9434', '#7ec850');
      break;
    case 'grass2':
      drawGrass(ctx, '#72b842', '#63a439', '#8ed058');
      break;
    case 'grass3':
      drawGrass(ctx, '#5f9c36', '#528c30', '#6eb44a');
      break;
    case 'flower':
      drawGrass(ctx, '#68ab3c', '#5a9434', '#7ec850');
      fillRect(ctx, 14, 12, 4, 4, '#ffd86b');
      fillRect(ctx, 13, 13, 2, 2, '#ff6b8a');
      fillRect(ctx, 17, 13, 2, 2, '#ff6b8a');
      fillRect(ctx, 15, 11, 2, 2, '#ff6b8a');
      fillRect(ctx, 15, 15, 2, 2, '#ff6b8a');
      break;
    case 'path':
      fillRect(ctx, 0, 0, TILE, TILE, '#d8c8a0');
      fillRect(ctx, 0, 0, TILE, 2, '#c8b890');
      fillRect(ctx, 0, TILE - 2, TILE, 2, '#b8a880');
      for (let x = 4; x < TILE; x += 8) fillRect(ctx, x, 10, 2, 2, '#c8b890');
      break;
    case 'water':
      fillRect(ctx, 0, 0, TILE, TILE, '#3c84c6');
      fillRect(ctx, 4, 6, 8, 2, '#5aa0de');
      fillRect(ctx, 16, 18, 10, 2, '#5aa0de');
      fillRect(ctx, 8, 22, 6, 2, '#2d6ea8');
      break;
    default:
      drawGrass(ctx, '#68ab3c', '#5a9434', '#7ec850');
  }
}

export function registerTileTextures(scene: Phaser.Scene) {
  const kinds: TileKind[] = ['grass', 'grass2', 'grass3', 'path', 'water', 'flower'];
  for (const kind of kinds) {
    const key = `tile-${kind}`;
    if (scene.textures.exists(key)) continue;
    const canvas = scene.textures.createCanvas(key, TILE, TILE);
    if (!canvas) continue;
    drawTile(canvas.getContext(), kind);
    canvas.refresh();
  }

  if (!scene.textures.exists('tile-tree')) {
    const canvas = scene.textures.createCanvas('tile-tree', 32, 48);
    if (canvas) {
      const ctx = canvas.getContext();
      fillRect(ctx, 13, 24, 6, 16, '#6b4226');
      fillRect(ctx, 4, 6, 24, 20, '#3d8b37');
      fillRect(ctx, 8, 2, 16, 10, '#4da044');
      fillRect(ctx, 2, 12, 8, 10, '#358030');
      fillRect(ctx, 22, 12, 8, 10, '#358030');
      canvas.refresh();
    }
  }

  if (!scene.textures.exists('tile-sign')) {
    const canvas = scene.textures.createCanvas('tile-sign', 32, 32);
    if (canvas) {
      const ctx = canvas.getContext();
      fillRect(ctx, 14, 16, 4, 14, '#6b4226');
      fillRect(ctx, 6, 6, 20, 12, '#f8f0d8');
      fillRect(ctx, 6, 6, 20, 2, '#306850');
      fillRect(ctx, 6, 16, 20, 2, '#306850');
      fillRect(ctx, 6, 6, 2, 12, '#306850');
      fillRect(ctx, 24, 6, 2, 12, '#306850');
      canvas.refresh();
    }
  }
}

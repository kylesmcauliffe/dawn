import Phaser from 'phaser';

const FRAME_W = 16;
const FRAME_H = 24;
const FRAMES = 4;
const DIRECTIONS = ['down', 'left', 'right', 'up'] as const;

export type CharacterDirection = (typeof DIRECTIONS)[number];

function drawPixelCharacter(
  ctx: CanvasRenderingContext2D,
  frame: number,
  direction: CharacterDirection,
  bodyColor: string,
  accentColor: string,
) {
  const legOffset = frame % 2 === 0 ? 0 : 1;
  const skin = '#f8d8a8';
  const outline = '#1a1c2c';
  const hair = accentColor;
  const shirt = bodyColor;
  const pants = '#3a4466';
  const shoe = '#2d1b00';
  const headY = direction === 'up' ? 5 : 4;

  const px = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };

  ctx.clearRect(0, 0, FRAME_W, FRAME_H);

  for (let x = 4; x < 12; x += 1) px(x, 23, outline);

  const leftLeg = 6 - legOffset;
  const rightLeg = 9 + legOffset;
  for (let y = 16; y <= 21; y += 1) {
    px(leftLeg, y, pants);
    px(rightLeg, y, pants);
    px(leftLeg, 22, shoe);
    px(rightLeg, 22, shoe);
  }

  for (let y = 10; y <= 15; y += 1) {
    for (let x = 5; x <= 10; x += 1) px(x, y, shirt);
  }

  if (direction === 'left') {
    for (let y = 11; y <= 14; y += 1) px(4, y, skin);
  } else if (direction === 'right') {
    for (let y = 11; y <= 14; y += 1) px(11, y, skin);
  } else {
    px(4, 12, skin);
    px(11, 12, skin);
  }

  for (let y = headY; y <= headY + 5; y += 1) {
    for (let x = 5; x <= 10; x += 1) px(x, y, skin);
  }

  if (direction !== 'up') {
    for (let x = 4; x <= 11; x += 1) px(x, headY - 1, hair);
    px(4, headY, hair);
    px(11, headY, hair);
  } else {
    for (let y = headY; y <= headY + 6; y += 1) {
      for (let x = 4; x <= 11; x += 1) px(x, y, hair);
    }
  }

  if (direction === 'down') {
    px(6, headY + 2, outline);
    px(9, headY + 2, outline);
    px(7, headY + 4, outline);
    px(8, headY + 4, outline);
  } else if (direction === 'left') {
    px(5, headY + 2, outline);
  } else if (direction === 'right') {
    px(10, headY + 2, outline);
  }
}

export function registerCharacterTextures(scene: Phaser.Scene, strategyKey: string, bodyColor: string, accentColor: string) {
  const textureKey = `char-${strategyKey}`;
  if (scene.textures.exists(textureKey)) return textureKey;

  const sheetWidth = FRAME_W * FRAMES;
  const sheetHeight = FRAME_H * DIRECTIONS.length;
  const canvas = scene.textures.createCanvas(textureKey, sheetWidth, sheetHeight);
  if (!canvas) return textureKey;

  const ctx = canvas.getContext();
  DIRECTIONS.forEach((direction, row) => {
    for (let frame = 0; frame < FRAMES; frame += 1) {
      ctx.save();
      ctx.translate(frame * FRAME_W, row * FRAME_H);
      drawPixelCharacter(ctx, frame, direction, bodyColor, accentColor);
      ctx.restore();
    }
  });

  canvas.refresh();

  const texture = scene.textures.get(textureKey);
  for (let row = 0; row < DIRECTIONS.length; row += 1) {
    for (let col = 0; col < FRAMES; col += 1) {
      texture.add(row * FRAMES + col, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
    }
  }

  return textureKey;
}

export function characterFrameBase(direction: CharacterDirection) {
  return DIRECTIONS.indexOf(direction) * FRAMES;
}

export function directionFromFacing(facing: 'up' | 'down' | 'left' | 'right'): CharacterDirection {
  return facing;
}

export { FRAME_H, FRAME_W, FRAMES };

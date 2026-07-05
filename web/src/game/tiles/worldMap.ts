export const TILE_SIZE = 32;

export type TileKind = 'grass' | 'grass2' | 'grass3' | 'path' | 'pathEdge' | 'water' | 'flower';

export type WorldMapData = {
  width: number;
  height: number;
  tiles: TileKind[][];
  trees: Array<{ x: number; y: number; variant: number }>;
  signs: Array<{ x: number; y: number; text: string }>;
};

function idx(x: number, y: number, width: number) {
  return y * width + x;
}

function isPathZone(x: number, y: number, width: number, height: number) {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const onHorizontal = y >= centerY - 2 && y <= centerY + 2;
  const onVertical = x >= centerX - 2 && x <= centerX + 2;
  const onRing =
    Math.abs(x - centerX) <= 14 &&
    Math.abs(y - centerY) <= 10 &&
    (Math.abs(Math.abs(x - centerX) - 12) <= 1 || Math.abs(Math.abs(y - centerY) - 8) <= 1);
  const plaza =
    Math.abs(x - centerX) <= 5 && Math.abs(y - centerY) <= 4;
  return onHorizontal || onVertical || onRing || plaza;
}

function isWater(x: number, y: number, width: number, height: number) {
  const ponds = [
    { cx: 10, cy: 9, r: 3 },
    { cx: width - 11, cy: height - 10, r: 3 },
    { cx: width - 14, cy: 11, r: 2 },
  ];
  return ponds.some((pond) => Math.hypot(x - pond.cx, y - pond.cy) <= pond.r);
}

export function buildWorldMap(width: number, height: number): WorldMapData {
  const tiles: TileKind[][] = [];
  const trees: WorldMapData['trees'] = [];
  const signs: WorldMapData['signs'] = [
    { x: Math.floor(width / 2), y: Math.floor(height / 2) - 6, text: 'Strategy Meadow' },
  ];

  for (let y = 0; y < height; y += 1) {
    const row: TileKind[] = [];
    for (let x = 0; x < width; x += 1) {
      if (isWater(x, y, width, height)) {
        row.push('water');
        continue;
      }
      if (isPathZone(x, y, width, height)) {
        row.push('path');
        continue;
      }
      const hash = (idx(x, y, width) * 9301 + 49297) % 233280;
      if (hash % 17 === 0) {
        row.push('flower');
      } else if (hash % 5 === 0) {
        row.push('grass2');
      } else if (hash % 7 === 0) {
        row.push('grass3');
      } else {
        row.push('grass');
      }
    }
    tiles.push(row);
  }

  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const tile = tiles[y][x];
      if (tile === 'water' || tile === 'path' || tile === 'flower') continue;
      const hash = (idx(x, y, width) * 1103515245 + 12345) % 2147483647;
      if (hash % 29 !== 0) continue;
      const blocked = trees.some((tree) => Math.abs(tree.x - x) <= 1 && Math.abs(tree.y - y) <= 1);
      if (blocked) continue;
      trees.push({ x, y, variant: hash % 3 });
    }
  }

  return { width, height, tiles, trees, signs };
}

export function worldPixelSize(map: WorldMapData) {
  return {
    width: map.width * TILE_SIZE,
    height: map.height * TILE_SIZE,
  };
}

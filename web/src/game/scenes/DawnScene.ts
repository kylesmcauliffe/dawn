import Phaser from 'phaser';

import {
  characterFrameBase,
  directionFromFacing,
  FRAMES,
  registerCharacterTextures,
} from '../sprites/characterTextures';
import { registerTileTextures } from '../tiles/tileTextures';
import { buildWorldMap, TILE_SIZE, worldPixelSize } from '../tiles/worldMap';
import type { Action, AgentSnapshot } from '../../simulation/types';
import { STRATEGY_COLORS, STRATEGY_ORDER } from '../../simulation/strategies';
import { useSimulationStore } from '../../state/useSimulationStore';

export const VIEW_WIDTH = 480;
export const VIEW_HEIGHT = 320;
const POSITION_LERP = 0.24;
const CAMERA_LERP = 0.09;

type RenderState = {
  x: number;
  y: number;
};

const ACCENT_COLORS: Record<string, string> = {
  TitForTat: '#4a7fd4',
  Grudger: '#8b4fd4',
  Pavlov: '#c88a2c',
  AlwaysDefect: '#c84a42',
  AlwaysCooperate: '#4a9c58',
  GenerousTitForTat: '#4a9c98',
  Random: '#888888',
};

export class DawnScene extends Phaser.Scene {
  private readonly agentSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly agentLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly encounterBubbles = new Map<string, Phaser.GameObjects.Container>();
  private readonly renderStates = new Map<string, RenderState>();
  private readonly encounterLines = new Map<string, Phaser.GameObjects.Graphics>();
  private cameraX = VIEW_WIDTH / 2;
  private cameraY = VIEW_HEIGHT / 2;

  constructor() {
    super('dawn');
  }

  preload() {
    registerTileTextures(this);
    for (const strategy of STRATEGY_ORDER) {
      registerCharacterTextures(this, strategy, STRATEGY_COLORS[strategy], ACCENT_COLORS[strategy] ?? '#555555');
    }
  }

  create() {
    const { width, height } = useSimulationStore.getState().engine.getWorldSize();
    const mapWidth = Math.ceil(width / TILE_SIZE);
    const mapHeight = Math.ceil(height / TILE_SIZE);
    const map = buildWorldMap(mapWidth, mapHeight);
    const pixelSize = worldPixelSize(map);

    this.cameras.main.setBounds(0, 0, pixelSize.width, pixelSize.height);
    this.cameras.main.setViewport(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    this.cameras.main.setRoundPixels(true);

    this.drawTileMap(map);
    this.cameraX = pixelSize.width / 2;
    this.cameraY = pixelSize.height / 2;
  }

  private walkPhase = 0;

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.walkPhase += dt;
    useSimulationStore.getState().step(dt);
    const snapshot = useSimulationStore.getState().engine.snapshot();
    this.syncAgents(snapshot.agents);
    this.syncBubbles(snapshot.agents);
    this.syncEncounterLines(snapshot.agents);
    this.updateCamera(snapshot.agents);
  }

  private drawTileMap(map: ReturnType<typeof buildWorldMap>) {
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        const kind = map.tiles[y][x];
        this.add
          .image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, `tile-${kind}`)
          .setDepth(0);
      }
    }

    for (const tree of map.trees) {
      this.add
        .image(tree.x * TILE_SIZE + TILE_SIZE / 2, tree.y * TILE_SIZE + TILE_SIZE / 2 + 8, 'tile-tree')
        .setDepth(2);
    }

    for (const sign of map.signs) {
      const signSprite = this.add
        .image(sign.x * TILE_SIZE + TILE_SIZE / 2, sign.y * TILE_SIZE + TILE_SIZE / 2, 'tile-sign')
        .setDepth(2);
      this.add
        .text(signSprite.x, signSprite.y - 28, sign.text, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#f8f0d8',
          backgroundColor: '#306850',
          padding: { x: 4, y: 3 },
        })
        .setOrigin(0.5, 1)
        .setDepth(3);
    }
  }

  private syncAgents(agents: AgentSnapshot[]) {
    const seen = new Set<string>();
    for (const agent of agents) {
      seen.add(agent.id);
      const sprite = this.ensureAgent(agent);
      const render = this.ensureRenderState(agent);
      render.x += (agent.x - render.x) * POSITION_LERP;
      render.y += (agent.y - render.y) * POSITION_LERP;

      sprite.setPosition(render.x, render.y + 8);
      sprite.setAlpha(agent.mode === 'cooldown' ? 0.65 : 1);
      sprite.setDepth(4 + render.y);

      const direction = directionFromFacing(agent.facing);
      const frameBase = characterFrameBase(direction);
      if (agent.mode === 'roaming' && Math.hypot(agent.vx, agent.vy) > 8) {
        const walkFrame = Math.floor(this.walkPhase * 8) % FRAMES;
        sprite.setFrame(frameBase + walkFrame);
      } else {
        sprite.setFrame(frameBase);
      }

      if (agent.mode === 'interacting') {
        sprite.setScale(1.15);
      } else {
        sprite.setScale(1);
      }

      const label = this.agentLabels.get(agent.id);
      label?.setPosition(render.x, render.y + 20);
      label?.setDepth(5 + render.y);
    }

    for (const id of [...this.agentSprites.keys()]) {
      if (seen.has(id)) continue;
      this.agentSprites.get(id)?.destroy();
      this.agentSprites.delete(id);
      this.agentLabels.get(id)?.destroy();
      this.agentLabels.delete(id);
      this.renderStates.delete(id);
    }
  }

  private ensureRenderState(agent: AgentSnapshot): RenderState {
    const existing = this.renderStates.get(agent.id);
    if (existing) return existing;
    const created = { x: agent.x, y: agent.y };
    this.renderStates.set(agent.id, created);
    return created;
  }

  private ensureAgent(agent: AgentSnapshot) {
    const existing = this.agentSprites.get(agent.id);
    if (existing) return existing;

    const textureKey = `char-${agent.name}`;
    const sprite = this.add.sprite(agent.x, agent.y, textureKey, 0);
    sprite.setOrigin(0.5, 0.85);

    const label = this.add
      .text(agent.x, agent.y + 20, agent.name.replace(/([A-Z])/g, ' $1').trim(), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#f8f0d8',
        backgroundColor: '#306850cc',
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5, 0);

    this.agentSprites.set(agent.id, sprite);
    this.agentLabels.set(agent.id, label);
    return sprite;
  }

  private syncBubbles(agents: AgentSnapshot[]) {
    const active = new Set<string>();
    for (const agent of agents) {
      if (!agent.lastAction || agent.bubbleTimer <= 0) continue;
      active.add(agent.id);
      const render = this.renderStates.get(agent.id);
      const bubble = this.ensureBubble(agent.id, agent.lastAction, agent.lastPoints);
      bubble.setPosition(render?.x ?? agent.x, (render?.y ?? agent.y) - 28);
      bubble.setAlpha(Math.min(1, agent.bubbleTimer * 2));
      bubble.setDepth(20);
      const [, actionText, pointsText] = bubble.list as [
        Phaser.GameObjects.Rectangle,
        Phaser.GameObjects.Text,
        Phaser.GameObjects.Text,
      ];
      actionText.setText(agent.lastAction === 'C' ? 'COOP' : 'DEF');
      actionText.setColor(agent.lastAction === 'C' ? '#4a9c58' : '#c84a42');
      pointsText.setText(`+${agent.lastPoints}`);
    }

    for (const [id, bubble] of this.encounterBubbles.entries()) {
      if (active.has(id)) continue;
      bubble.destroy();
      this.encounterBubbles.delete(id);
    }
  }

  private syncEncounterLines(agents: AgentSnapshot[]) {
    const activePairs = new Set<string>();

    for (const agent of agents) {
      if (agent.mode !== 'interacting') continue;
      const partner = agents.find(
        (other) =>
          other.id !== agent.id && other.mode === 'interacting' && Math.hypot(other.x - agent.x, other.y - agent.y) < 120,
      );
      if (!partner) continue;
      const pairKey = [agent.id, partner.id].sort().join(':');
      if (activePairs.has(pairKey)) continue;
      activePairs.add(pairKey);

      const renderA = this.renderStates.get(agent.id);
      const renderB = this.renderStates.get(partner.id);
      const ax = renderA?.x ?? agent.x;
      const ay = renderA?.y ?? agent.y;
      const bx = renderB?.x ?? partner.x;
      const by = renderB?.y ?? partner.y;

      let line = this.encounterLines.get(pairKey);
      if (!line) {
        line = this.add.graphics();
        this.encounterLines.set(pairKey, line);
      }
      line.clear();
      line.lineStyle(2, 0xf8f0d8, 0.7);
      line.beginPath();
      line.moveTo(ax, ay);
      line.lineTo(bx, by);
      line.strokePath();
      line.fillStyle(agent.lastAction === 'C' && partner.lastAction === 'C' ? 0x8ed058 : 0xffd86b, 0.5);
      line.fillCircle((ax + bx) / 2, (ay + by) / 2 - 6, 6);
      line.setDepth(3);
    }

    for (const [pairKey, line] of this.encounterLines.entries()) {
      if (activePairs.has(pairKey)) continue;
      line.destroy();
      this.encounterLines.delete(pairKey);
    }
  }

  private ensureBubble(id: string, action: Action, points: number) {
    const existing = this.encounterBubbles.get(id);
    if (existing) return existing;
    const box = this.add.rectangle(0, 0, 52, 36, 0xf8f0d8, 1).setStrokeStyle(2, 0x306850, 1);
    const actionText = this.add
      .text(0, -4, action === 'C' ? 'COOP' : 'DEF', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#4a9c58',
      })
      .setOrigin(0.5);
    const pointsText = this.add
      .text(0, 8, `+${points}`, {
        fontFamily: '"VT323", monospace',
        fontSize: '14px',
        color: '#306850',
      })
      .setOrigin(0.5);
    const bubble = this.add.container(0, 0, [box, actionText, pointsText]);
    this.encounterBubbles.set(id, bubble);
    return bubble;
  }

  private updateCamera(agents: AgentSnapshot[]) {
    if (agents.length === 0) return;
    const interacting = agents.filter((agent) => agent.mode === 'interacting');
    const focus = interacting.length > 0 ? interacting : agents;
    const targetX = focus.reduce((sum, agent) => sum + agent.x, 0) / focus.length;
    const targetY = focus.reduce((sum, agent) => sum + agent.y, 0) / focus.length;

    const lerp = interacting.length > 0 ? CAMERA_LERP * 1.8 : CAMERA_LERP;
    this.cameraX += (targetX - this.cameraX) * lerp;
    this.cameraY += (targetY - this.cameraY) * lerp;
    this.cameras.main.centerOn(this.cameraX, this.cameraY);
  }
}

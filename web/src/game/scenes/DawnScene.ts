import Phaser from 'phaser';

import {
  facingToDirection,
  registerAgentSpriteSheets,
  registerPropSprites,
  spriteKeyForStrategy,
} from '../assets/generateSprites';
import { expSmoothing, lerpAgentSnapshots } from '../motion';
import { getActiveReplayFrame, useSimulationStore } from '../../state/useSimulationStore';
import type { Action, AgentSnapshot, AssetThemeId } from '../../simulation/types';

const VIEW_WIDTH = 980;
const VIEW_HEIGHT = 720;

type AgentVisual = {
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  displayX: number;
  displayY: number;
  lastDirection: AgentSnapshot['facing'];
};

export class DawnScene extends Phaser.Scene {
  private readonly agentVisuals = new Map<string, AgentVisual>();
  private readonly encounterBubbles = new Map<string, Phaser.GameObjects.Container>();
  private worldLayer: Phaser.GameObjects.Container | null = null;
  private currentTheme: AssetThemeId | null = null;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private cameraStart = { x: 0, y: 0 };
  private cameraX = VIEW_WIDTH / 2;
  private cameraY = VIEW_HEIGHT / 2;
  private uiSyncTimer = 0;

  constructor() {
    super('dawn');
  }

  preload() {
    registerAgentSpriteSheets(this);
    registerPropSprites(this);
  }

  create() {
    this.setupInput();
    this.refreshWorld();
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    const store = useSimulationStore.getState();
    const theme = store.config.assetTheme;
    if (theme !== this.currentTheme) {
      this.clearAgents();
      this.refreshWorld();
    }

    let agents = store.snapshot.agents;
    const replayFrame = getActiveReplayFrame(store);

    if (replayFrame) {
      store.stepReplay(dt);
      const nextStore = useSimulationStore.getState();
      const current = getActiveReplayFrame(nextStore) ?? replayFrame;
      const nextIndex = Math.min(nextStore.replayIndex + 1, nextStore.replayFrames.length - 1);
      const nextFrame = nextStore.replayFrames[nextIndex];
      if (nextFrame && nextIndex !== nextStore.replayIndex) {
        const alpha = nextStore.replayPlaying ? Math.min(1, dt * 8) : 1;
        agents = current.agents.map((agent, index) => {
          const peer = nextFrame.agents[index];
          return peer ? lerpAgentSnapshots(agent, peer, alpha) : agent;
        });
      } else {
        agents = current.agents;
      }
    } else if (store.phase === 'running' && store.viewMode === 'live') {
      store.step(dt);
      agents = useSimulationStore.getState().snapshot.agents;
      this.uiSyncTimer += dt;
      if (this.uiSyncTimer >= 0.12) {
        this.uiSyncTimer = 0;
        useSimulationStore.getState().syncUiFromEngine();
      }
    }

    this.renderAgents(agents, dt);
    this.applyCamera(agents, dt);
    this.cameras.main.setZoom(store.zoom);
  }

  private clearAgents() {
    for (const visual of this.agentVisuals.values()) {
      visual.sprite.destroy();
      visual.label.destroy();
    }
    this.agentVisuals.clear();
    for (const bubble of this.encounterBubbles.values()) {
      bubble.destroy();
    }
    this.encounterBubbles.clear();
  }

  private setupInput() {
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const s = useSimulationStore.getState();
      if (deltaY > 0) s.zoomOut();
      else s.zoomIn();
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (useSimulationStore.getState().cameraMode !== 'free') return;
      this.isDragging = true;
      this.dragStart = { x: pointer.x, y: pointer.y };
      this.cameraStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY };
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const zoom = this.cameras.main.zoom;
      const dx = (pointer.x - this.dragStart.x) / zoom;
      const dy = (pointer.y - this.dragStart.y) / zoom;
      this.cameras.main.setScroll(this.cameraStart.x - dx, this.cameraStart.y - dy);
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  private refreshWorld() {
    const { width, height } = useSimulationStore.getState().engine.getWorldSize();
    const theme = useSimulationStore.getState().config.assetTheme;
    this.worldLayer?.destroy(true);
    this.worldLayer = this.add.container(0, 0);
    this.currentTheme = theme;

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setViewport(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    this.cameraX = width / 2;
    this.cameraY = height / 2;

    if (theme === 'outdoor_meadow') {
      this.drawOutdoorMeadow(width, height);
    } else if (theme === 'pixel_arcade') {
      this.drawPixelArcade(width, height);
    } else {
      this.drawResearchLab(width, height);
    }
  }

  private drawOutdoorMeadow(width: number, height: number) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xb8d88a, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.fillStyle(0xcfe7a5, 0.75);
    for (let index = 0; index < 90; index += 1) {
      const x = 40 + ((index * 187) % (width - 80));
      const y = 40 + ((index * 131) % (height - 80));
      graphics.fillCircle(x, y, 2 + (index % 3));
    }

    graphics.fillStyle(0x9c7a49, 1);
    graphics.fillRoundedRect(240, 230, width - 480, 64, 18);
    graphics.fillRoundedRect(1060, 100, 80, height - 200, 18);
    graphics.fillRoundedRect(570, 500, 760, 64, 18);

    graphics.fillStyle(0xc7e49f, 1);
    graphics.fillRoundedRect(252, 242, width - 504, 40, 12);
    graphics.fillRoundedRect(1072, 112, 56, height - 224, 12);
    graphics.fillRoundedRect(582, 512, 736, 40, 12);

    for (let index = 0; index < 26; index += 1) {
      const trunkX = 120 + ((index * 211) % 420);
      const trunkY = 140 + ((index * 157) % (height - 240));
      this.worldLayer?.add(this.add.sprite(trunkX, trunkY, 'prop-tree').setOrigin(0.5, 0.85).setScale(2));
      this.worldLayer?.add(
        this.add.sprite(width - trunkX, Math.max(100, trunkY - 40), 'prop-tree').setOrigin(0.5, 0.85).setScale(2),
      );
    }

    this.worldLayer?.add(graphics);
  }

  private drawResearchLab(width: number, height: number) {
    const floor = this.add.graphics();
    floor.fillStyle(0x2a3444, 1);
    floor.fillRect(0, 0, width, height);

    for (let row = 0; row < 14; row += 1) {
      for (let col = 0; col < 22; col += 1) {
        const shade = (row + col) % 2 === 0 ? 0x3a4a5e : 0x344052;
        floor.fillStyle(shade, 1);
        floor.fillRect(60 + col * 68, 60 + row * 68, 68, 68);
      }
    }

    const walls = this.add.graphics();
    walls.fillStyle(0x1a2332, 1);
    walls.fillRect(40, 40, width - 80, 24);
    walls.fillRect(40, height - 64, width - 80, 24);
    walls.fillRect(40, 40, 24, height - 80);
    walls.fillRect(width - 64, 40, 24, height - 80);
    walls.fillStyle(0x4fd1c5, 0.35);
    walls.fillRect(80, 52, width - 160, 6);

    this.add.sprite(180, 210, 'prop-desk').setOrigin(0.5, 0.75).setScale(2);
    this.add.sprite(width - 280, 210, 'prop-desk').setOrigin(0.5, 0.75).setScale(2);
    this.add.sprite(180, height - 210, 'prop-desk').setOrigin(0.5, 0.75).setScale(2);
    this.add.sprite(width - 280, height - 210, 'prop-desk').setOrigin(0.5, 0.75).setScale(2);
    this.add.sprite(width / 2 - 120, 150, 'prop-monitor').setOrigin(0.5, 0.85).setScale(2);
    this.add.sprite(width / 2 + 40, 150, 'prop-monitor').setOrigin(0.5, 0.85).setScale(2);
    this.add.sprite(width / 2, height / 2 + 60, 'prop-couch').setOrigin(0.5, 0.75).setScale(2);

    const label = this.add
      .text(width / 2, 78, 'OBSERVATION ROOM — RESEARCH SANDBOX', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9ae6d8',
      })
      .setOrigin(0.5);

    this.worldLayer?.add([floor, walls, label]);
  }

  private drawPixelArcade(width: number, height: number) {
    const floor = this.add.graphics();
    floor.fillStyle(0x1a1033, 1);
    floor.fillRect(0, 0, width, height);

    for (let row = 0; row < 12; row += 1) {
      for (let col = 0; col < 18; col += 1) {
        const colors = [0x2d1b69, 0x3b2067, 0x241454];
        floor.fillStyle(colors[(row + col) % colors.length], 1);
        floor.fillRect(80 + col * 80, 80 + row * 72, 80, 72);
      }
    }

    const neon = this.add.graphics();
    neon.lineStyle(4, 0xff4fd8, 0.9);
    neon.strokeRect(64, 64, width - 128, height - 128);
    neon.lineStyle(2, 0x4fd1ff, 0.7);
    neon.strokeRect(72, 72, width - 144, height - 144);

    this.worldLayer?.add(this.add.sprite(200, 250, 'prop-arcade').setOrigin(0.5, 0.85).setScale(2));
    this.worldLayer?.add(this.add.sprite(width - 260, 250, 'prop-arcade').setOrigin(0.5, 0.85).setScale(2));
    this.worldLayer?.add(this.add.sprite(200, height - 230, 'prop-arcade').setOrigin(0.5, 0.85).setScale(2));
    this.worldLayer?.add(this.add.sprite(width - 260, height - 230, 'prop-arcade').setOrigin(0.5, 0.85).setScale(2));
    this.worldLayer?.add(this.add.sprite(width / 2, height / 2, 'prop-couch').setOrigin(0.5, 0.75).setScale(2));

    const sign = this.add
      .text(width / 2, 96, 'PIXEL LOUNGE', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ff9de2',
      })
      .setOrigin(0.5);

    this.worldLayer?.add([floor, neon, sign]);
  }

  private renderAgents(agents: AgentSnapshot[], dt: number) {
    const seen = new Set<string>();
    const pixel = useSimulationStore.getState().config.assetTheme === 'pixel_arcade';

    for (const agent of agents) {
      seen.add(agent.id);
      const visual = this.ensureAgent(agent, pixel);
      visual.displayX = expSmoothing(visual.displayX, agent.x, dt, 14);
      visual.displayY = expSmoothing(visual.displayY, agent.y, dt, 14);
      visual.sprite.setPosition(visual.displayX, visual.displayY);
      visual.label.setPosition(visual.displayX, visual.displayY + 28);

      const direction = facingToDirection(agent.facing);
      const speed = Math.hypot(agent.vx, agent.vy);
      const sheetKey = spriteKeyForStrategy(agent.name);
      const walkKey = `${sheetKey}-walk-${direction}`;

      if (agent.mode === 'roaming' && speed > 10) {
        if (visual.lastDirection !== direction || !visual.sprite.anims.isPlaying) {
          visual.sprite.play(walkKey, true);
          visual.lastDirection = direction;
        }
      } else {
        visual.sprite.anims.stop();
        visual.sprite.setFrame(this.idleFrameForDirection(direction));
        visual.lastDirection = direction;
      }

      visual.sprite.setAlpha(agent.mode === 'cooldown' ? 0.72 : 1);
      visual.sprite.setFlipX(direction === 'left');
    }

    this.syncBubbles(agents);
    this.cleanupAgents(seen);
  }

  private idleFrameForDirection(direction: AgentSnapshot['facing']): number {
    if (direction === 'left') return 4;
    if (direction === 'right') return 8;
    if (direction === 'up') return 12;
    return 0;
  }

  private ensureAgent(agent: AgentSnapshot, pixel: boolean) {
    const existing = this.agentVisuals.get(agent.id);
    if (existing) return existing;

    const key = spriteKeyForStrategy(agent.name);
    const sprite = this.add.sprite(agent.x, agent.y, key, 0).setOrigin(0.5, 0.85).setScale(2);
    const label = this.add
      .text(agent.x, agent.y + 28, agent.name, {
        fontFamily: pixel ? 'monospace' : 'Inter, system-ui, sans-serif',
        fontSize: pixel ? '10px' : '11px',
        color: agent.color,
        backgroundColor: 'rgba(248,244,222,0.82)',
        padding: { x: 4, y: 1 },
      })
      .setOrigin(0.5, 0);

    const visual: AgentVisual = {
      sprite,
      label,
      displayX: agent.x,
      displayY: agent.y,
      lastDirection: agent.facing,
    };
    this.agentVisuals.set(agent.id, visual);
    return visual;
  }

  private cleanupAgents(seen: Set<string>) {
    for (const [id, visual] of this.agentVisuals.entries()) {
      if (seen.has(id)) continue;
      visual.sprite.destroy();
      visual.label.destroy();
      this.agentVisuals.delete(id);
    }
  }

  private syncBubbles(agents: AgentSnapshot[]) {
    const active = new Set<string>();
    for (const agent of agents) {
      if (!agent.lastAction || agent.bubbleTimer <= 0) continue;
      active.add(agent.id);
      const visual = this.agentVisuals.get(agent.id);
      const x = visual?.displayX ?? agent.x;
      const y = visual?.displayY ?? agent.y;
      const bubble = this.ensureBubble(agent.id, agent.lastAction, agent.lastPoints);
      bubble.setPosition(x, y - 52);
      bubble.setAlpha(Math.min(1, agent.bubbleTimer * 2));
      const [, actionText, pointsText] = bubble.list as [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, Phaser.GameObjects.Text];
      actionText.setText(agent.lastAction);
      actionText.setColor(agent.lastAction === 'C' ? '#2f855a' : '#c53030');
      pointsText.setText(`+${agent.lastPoints}`);
    }

    for (const [id, bubble] of this.encounterBubbles.entries()) {
      if (active.has(id)) continue;
      bubble.destroy();
      this.encounterBubbles.delete(id);
    }
  }

  private ensureBubble(id: string, action: Action, points: number) {
    const existing = this.encounterBubbles.get(id);
    if (existing) return existing;
    const box = this.add.rectangle(0, 0, 68, 50, 0xf8f4de, 0.95).setStrokeStyle(2, 0xffffff, 0.9);
    const actionText = this.add
      .text(0, -8, action, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#2f855a',
        fontStyle: '700',
      })
      .setOrigin(0.5);
    const pointsText = this.add
      .text(0, 12, `+${points}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#52606d',
      })
      .setOrigin(0.5);
    const bubble = this.add.container(0, 0, [box, actionText, pointsText]);
    this.encounterBubbles.set(id, bubble);
    return bubble;
  }

  private applyCamera(agents: AgentSnapshot[], dt: number) {
    const { cameraMode } = useSimulationStore.getState();
    const { width, height } = useSimulationStore.getState().engine.getWorldSize();

    let targetX = width / 2;
    let targetY = height / 2;

    if (cameraMode === 'free') {
      return;
    }

    if (cameraMode !== 'overview' && agents.length > 0) {
      const interacting = agents.filter((agent) => agent.mode === 'interacting');
      const focus = interacting.length > 0 ? interacting : agents;
      targetX = focus.reduce((sum, agent) => sum + agent.x, 0) / focus.length;
      targetY = focus.reduce((sum, agent) => sum + agent.y, 0) / focus.length;
    }

    this.cameraX = expSmoothing(this.cameraX, targetX, dt, cameraMode === 'overview' ? 6 : 9);
    this.cameraY = expSmoothing(this.cameraY, targetY, dt, cameraMode === 'overview' ? 6 : 9);
    this.cameras.main.centerOn(this.cameraX, this.cameraY);
  }
}

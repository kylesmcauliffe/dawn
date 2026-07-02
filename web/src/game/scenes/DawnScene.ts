import Phaser from 'phaser';

import { getActiveReplayFrame, useSimulationStore } from '../../state/useSimulationStore';
import type { Action, AgentSnapshot, AssetThemeId } from '../../simulation/types';

const VIEW_WIDTH = 980;
const VIEW_HEIGHT = 720;

export class DawnScene extends Phaser.Scene {
  private readonly agentSprites = new Map<string, Phaser.GameObjects.Container>();
  private readonly agentBodies = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly agentLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly encounterBubbles = new Map<string, Phaser.GameObjects.Container>();
  private worldLayer: Phaser.GameObjects.Container | null = null;
  private currentTheme: AssetThemeId | null = null;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private cameraStart = { x: 0, y: 0 };

  constructor() {
    super('dawn');
  }

  create() {
    this.setupInput();
    this.refreshWorld();
  }

  update(_time: number, delta: number) {
    const store = useSimulationStore.getState();
    const theme = store.config.assetTheme;
    if (theme !== this.currentTheme) {
      this.refreshWorld();
    }

    const replayFrame = getActiveReplayFrame(store);
    if (replayFrame) {
      store.stepReplay(delta / 1000);
      this.renderFrame(replayFrame.agents);
    } else if (store.phase === 'running' && store.viewMode === 'live') {
      store.step(delta / 1000);
      const snapshot = useSimulationStore.getState().snapshot;
      this.renderFrame(snapshot.agents);
    } else {
      this.renderFrame(store.snapshot.agents);
    }

    this.applyCamera(store.snapshot.agents);
    this.cameras.main.setZoom(store.zoom);
  }

  private setupInput() {
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const store = useSimulationStore.getState();
      if (deltaY > 0) store.zoomOut();
      else store.zoomIn();
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
      this.drawTree(trunkX, trunkY);
      this.drawTree(width - trunkX, Math.max(100, trunkY - 40));
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

    this.drawDesk(180, 180, 0x5b6b7c);
    this.drawDesk(width - 280, 180, 0x5b6b7c);
    this.drawDesk(180, height - 240, 0x5b6b7c);
    this.drawDesk(width - 280, height - 240, 0x5b6b7c);
    this.drawMonitor(width / 2 - 120, 120);
    this.drawMonitor(width / 2 + 40, 120);
    this.drawCouch(width / 2, height / 2 + 40);

    const label = this.add
      .text(width / 2, 78, 'OBSERVATION ROOM — RESEARCH SANDBOX', {
        fontFamily: 'Inter, system-ui, sans-serif',
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

    this.drawArcadeCabinet(200, 200, 0xff6bcb);
    this.drawArcadeCabinet(width - 260, 200, 0x6bcfff);
    this.drawArcadeCabinet(200, height - 280, 0xffd166);
    this.drawArcadeCabinet(width - 260, height - 280, 0x9bf6ff);
    this.drawPixelSofa(width / 2, height / 2);

    const sign = this.add
      .text(width / 2, 96, 'PIXEL LOUNGE', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ff9de2',
      })
      .setOrigin(0.5);

    this.worldLayer?.add([floor, neon, sign]);
  }

  private drawDesk(x: number, y: number, color: number) {
    const desk = this.add.container(x, y);
    const top = this.add.rectangle(0, 0, 140, 70, color);
    const leg1 = this.add.rectangle(-50, 40, 12, 40, 0x2d3748);
    const leg2 = this.add.rectangle(50, 40, 12, 40, 0x2d3748);
    desk.add([top, leg1, leg2]);
    this.worldLayer?.add(desk);
  }

  private drawMonitor(x: number, y: number) {
    const monitor = this.add.container(x, y);
    const screen = this.add.rectangle(0, 0, 90, 60, 0x0f172a).setStrokeStyle(3, 0x94a3b8);
    const glow = this.add.rectangle(0, 0, 70, 40, 0x38bdf8, 0.35);
    const stand = this.add.rectangle(0, 42, 20, 16, 0x64748b);
    monitor.add([stand, screen, glow]);
    this.worldLayer?.add(monitor);
  }

  private drawCouch(x: number, y: number) {
    const couch = this.add.container(x, y);
    const base = this.add.rectangle(0, 0, 220, 80, 0x4a5568);
    const back = this.add.rectangle(0, -36, 220, 40, 0x3d4a5c);
    const cushion = this.add.rectangle(-60, 8, 60, 50, 0x5a6b7d);
    const cushion2 = this.add.rectangle(60, 8, 60, 50, 0x5a6b7d);
    couch.add([base, back, cushion, cushion2]);
    this.worldLayer?.add(couch);
  }

  private drawArcadeCabinet(x: number, y: number, accent: number) {
    const cab = this.add.container(x, y);
    const body = this.add.rectangle(0, 0, 90, 130, 0x2d1b69).setStrokeStyle(3, accent);
    const screen = this.add.rectangle(0, -24, 64, 48, 0x0f172a).setStrokeStyle(2, accent);
    const marquee = this.add.rectangle(0, -70, 72, 14, accent, 0.8);
    cab.add([body, screen, marquee]);
    this.worldLayer?.add(cab);
  }

  private drawPixelSofa(x: number, y: number) {
    const sofa = this.add.container(x, y);
    for (let block = -3; block <= 3; block += 1) {
      const color = block % 2 === 0 ? 0xff6bcb : 0x9bf6ff;
      const part = this.add.rectangle(block * 28, 0, 24, 48, color);
      sofa.add(part);
    }
    this.worldLayer?.add(sofa);
  }

  private drawTree(x: number, y: number) {
    const tree = this.add.container(x, y);
    const trunk = this.add.rectangle(0, 30, 18, 36, 0x775536);
    const canopy = this.add.circle(0, 4, 34, 0x80b36a);
    const canopy2 = this.add.circle(-18, 18, 24, 0x8dc57a);
    const canopy3 = this.add.circle(18, 18, 24, 0x76a863);
    tree.add([trunk, canopy, canopy2, canopy3]);
    this.worldLayer?.add(tree);
  }

  private renderFrame(agents: AgentSnapshot[]) {
    this.syncAgents(agents);
    this.syncBubbles(agents);
  }

  private syncAgents(agents: AgentSnapshot[]) {
    const seen = new Set<string>();
    const pixel = useSimulationStore.getState().config.assetTheme === 'pixel_arcade';

    for (const agent of agents) {
      seen.add(agent.id);
      const sprite = this.ensureAgent(agent, pixel);
      sprite.setPosition(agent.x, agent.y);
      this.applyFacing(agent);
      const label = this.agentLabels.get(agent.id);
      label?.setPosition(agent.x, agent.y + 34);
      sprite.setAlpha(agent.mode === 'cooldown' ? 0.72 : 1);
    }

    for (const id of [...this.agentSprites.keys()]) {
      if (seen.has(id)) continue;
      this.agentSprites.get(id)?.destroy();
      this.agentSprites.delete(id);
      this.agentBodies.delete(id);
      this.agentLabels.get(id)?.destroy();
      this.agentLabels.delete(id);
    }
  }

  private ensureAgent(agent: AgentSnapshot, pixel: boolean) {
    const existing = this.agentSprites.get(agent.id);
    if (existing) {
      return existing;
    }

    const color = Number.parseInt(agent.color.slice(1), 16);
    const body = this.add.rectangle(0, 0, pixel ? 28 : 34, pixel ? 32 : 42, color);
    body.setStrokeStyle(pixel ? 2 : 4, 0xf8f4de);
    const eyeLeft = this.add.rectangle(pixel ? -5 : -7, pixel ? -4 : -5, pixel ? 3 : 4, pixel ? 3 : 4, 0x1e1e1e);
    const eyeRight = this.add.rectangle(pixel ? 5 : 7, pixel ? -4 : -5, pixel ? 3 : 4, pixel ? 3 : 4, 0x1e1e1e);
    const feetLeft = this.add.rectangle(pixel ? -6 : -7, pixel ? 18 : 24, pixel ? 6 : 8, pixel ? 8 : 10, 0x2d3748);
    const feetRight = this.add.rectangle(pixel ? 6 : 7, pixel ? 18 : 24, pixel ? 6 : 8, pixel ? 8 : 10, 0x2d3748);
    const sprite = this.add.container(agent.x, agent.y, [body, eyeLeft, eyeRight, feetLeft, feetRight]);
    const label = this.add
      .text(agent.x, agent.y + 34, agent.name, {
        fontFamily: pixel ? 'monospace' : 'Inter, system-ui, sans-serif',
        fontSize: pixel ? '10px' : '12px',
        color: agent.color,
        backgroundColor: 'rgba(248,244,222,0.82)',
        padding: { x: 5, y: 1 },
      })
      .setOrigin(0.5, 0);

    this.agentSprites.set(agent.id, sprite);
    this.agentBodies.set(agent.id, body);
    this.agentLabels.set(agent.id, label);
    return sprite;
  }

  private applyFacing(agent: AgentSnapshot) {
    const body = this.agentBodies.get(agent.id);
    if (!body) return;
    body.rotation = agent.facing === 'left' ? -0.1 : agent.facing === 'right' ? 0.1 : 0;
  }

  private syncBubbles(agents: AgentSnapshot[]) {
    const active = new Set<string>();
    for (const agent of agents) {
      if (!agent.lastAction || agent.bubbleTimer <= 0) continue;
      active.add(agent.id);
      const bubble = this.ensureBubble(agent.id, agent.lastAction, agent.lastPoints);
      bubble.setPosition(agent.x, agent.y - 62);
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
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '22px',
        color: '#2f855a',
        fontStyle: '700',
      })
      .setOrigin(0.5);
    const pointsText = this.add
      .text(0, 12, `+${points}`, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: '#52606d',
      })
      .setOrigin(0.5);
    const bubble = this.add.container(0, 0, [box, actionText, pointsText]);
    this.encounterBubbles.set(id, bubble);
    return bubble;
  }

  private applyCamera(agents: AgentSnapshot[]) {
    const { cameraMode } = useSimulationStore.getState();
    const { width, height } = useSimulationStore.getState().engine.getWorldSize();

    if (cameraMode === 'overview') {
      this.cameras.main.centerOn(width / 2, height / 2);
      return;
    }

    if (cameraMode === 'free') {
      return;
    }

    if (agents.length === 0) return;
    const interacting = agents.filter((agent) => agent.mode === 'interacting');
    const focus = interacting.length > 0 ? interacting : agents;
    const x = focus.reduce((sum, agent) => sum + agent.x, 0) / focus.length;
    const y = focus.reduce((sum, agent) => sum + agent.y, 0) / focus.length;
    this.cameras.main.centerOn(x, y);
  }
}

import Phaser from 'phaser';

import type { Action, AgentSnapshot } from '../../simulation/types';
import { useSimulationStore } from '../../state/useSimulationStore';

const VIEW_WIDTH = 980;
const VIEW_HEIGHT = 720;
const POSITION_LERP = 0.22;
const CAMERA_LERP = 0.08;

type RenderState = {
  x: number;
  y: number;
  bob: number;
};

export class DawnScene extends Phaser.Scene {
  private readonly agentSprites = new Map<string, Phaser.GameObjects.Container>();
  private readonly agentBodies = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly agentLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly encounterBubbles = new Map<string, Phaser.GameObjects.Container>();
  private readonly renderStates = new Map<string, RenderState>();
  private readonly encounterLines = new Map<string, Phaser.GameObjects.Graphics>();
  private cameraX = VIEW_WIDTH / 2;
  private cameraY = VIEW_HEIGHT / 2;

  constructor() {
    super('dawn');
  }

  create() {
    const { width, height } = useSimulationStore.getState().engine.getWorldSize();
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setViewport(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    this.drawWorld(width, height);
    this.cameraX = width / 2;
    this.cameraY = height / 2;
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    useSimulationStore.getState().step(dt);
    const snapshot = useSimulationStore.getState().engine.snapshot();
    this.syncAgents(snapshot.agents, dt);
    this.syncBubbles(snapshot.agents);
    this.syncEncounterLines(snapshot.agents);
    this.updateCamera(snapshot.agents);
  }

  private drawWorld(width: number, height: number) {
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
  }

  private drawTree(x: number, y: number) {
    const tree = this.add.container(x, y);
    const trunk = this.add.rectangle(0, 30, 18, 36, 0x775536);
    const canopy = this.add.circle(0, 4, 34, 0x80b36a);
    const canopy2 = this.add.circle(-18, 18, 24, 0x8dc57a);
    const canopy3 = this.add.circle(18, 18, 24, 0x76a863);
    tree.add([trunk, canopy, canopy2, canopy3]);
  }

  private syncAgents(agents: AgentSnapshot[], dt: number) {
    const seen = new Set<string>();
    for (const agent of agents) {
      seen.add(agent.id);
      const sprite = this.ensureAgent(agent);
      const render = this.ensureRenderState(agent);
      render.x += (agent.x - render.x) * POSITION_LERP;
      render.y += (agent.y - render.y) * POSITION_LERP;

      const speed = Math.hypot(agent.vx, agent.vy);
      if (agent.mode === 'roaming' && speed > 8) {
        render.bob += dt * 10 * (speed / 72);
      } else {
        render.bob *= 0.85;
      }

      const bobOffset = Math.sin(render.bob) * (agent.mode === 'roaming' ? 3 : 0);
      sprite.setPosition(render.x, render.y + bobOffset);
      this.applyFacing(agent, bobOffset);
      const label = this.agentLabels.get(agent.id);
      label?.setPosition(render.x, render.y + 34 + bobOffset);
      sprite.setAlpha(agent.mode === 'cooldown' ? 0.72 : 1);
      sprite.setScale(agent.mode === 'interacting' ? 1.06 : 1);
    }

    for (const id of [...this.agentSprites.keys()]) {
      if (seen.has(id)) continue;
      this.agentSprites.get(id)?.destroy();
      this.agentSprites.delete(id);
      this.agentBodies.delete(id);
      this.agentLabels.get(id)?.destroy();
      this.agentLabels.delete(id);
      this.renderStates.delete(id);
    }
  }

  private ensureRenderState(agent: AgentSnapshot): RenderState {
    const existing = this.renderStates.get(agent.id);
    if (existing) return existing;
    const created = { x: agent.x, y: agent.y, bob: 0 };
    this.renderStates.set(agent.id, created);
    return created;
  }

  private ensureAgent(agent: AgentSnapshot) {
    const existing = this.agentSprites.get(agent.id);
    if (existing) {
      return existing;
    }

    const shadow = this.add.ellipse(0, 28, 28, 10, 0x000000, 0.18);
    const body = this.add.rectangle(0, 0, 34, 42, Number.parseInt(agent.color.slice(1), 16));
    body.setStrokeStyle(4, 0xf8f4de);
    const eyeLeft = this.add.rectangle(-7, -5, 4, 4, 0x1e1e1e);
    const eyeRight = this.add.rectangle(7, -5, 4, 4, 0x1e1e1e);
    const feetLeft = this.add.rectangle(-7, 24, 8, 10, 0x2d3748);
    const feetRight = this.add.rectangle(7, 24, 8, 10, 0x2d3748);
    const sprite = this.add.container(agent.x, agent.y, [shadow, body, eyeLeft, eyeRight, feetLeft, feetRight]);
    const label = this.add
      .text(agent.x, agent.y + 34, agent.name, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
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

  private applyFacing(agent: AgentSnapshot, bobOffset: number) {
    const body = this.agentBodies.get(agent.id);
    if (!body) return;
    const tilt =
      agent.facing === 'left' ? -0.12 : agent.facing === 'right' ? 0.12 : agent.facing === 'up' ? -0.04 : 0.04;
    body.rotation = tilt + bobOffset * 0.015;
  }

  private syncBubbles(agents: AgentSnapshot[]) {
    const active = new Set<string>();
    for (const agent of agents) {
      if (!agent.lastAction || agent.bubbleTimer <= 0) continue;
      active.add(agent.id);
      const render = this.renderStates.get(agent.id);
      const bubble = this.ensureBubble(agent.id, agent.lastAction, agent.lastPoints);
      bubble.setPosition(render?.x ?? agent.x, (render?.y ?? agent.y) - 62);
      bubble.setAlpha(Math.min(1, agent.bubbleTimer * 2));
      bubble.setScale(1 + (1 - Math.min(1, agent.bubbleTimer * 2)) * 0.08);
      const [box, actionText, pointsText] = bubble.list as [
        Phaser.GameObjects.Rectangle,
        Phaser.GameObjects.Text,
        Phaser.GameObjects.Text,
      ];
      box.setFillStyle(0xf8f4de, 0.95);
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

  private syncEncounterLines(agents: AgentSnapshot[]) {
    const activePairs = new Set<string>();

    for (const agent of agents) {
      if (agent.mode !== 'interacting') continue;
      const partner = agents.find(
        (other) => other.id !== agent.id && other.mode === 'interacting' && Math.hypot(other.x - agent.x, other.y - agent.y) < 120,
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
      line.lineStyle(3, 0xf8f4de, 0.55);
      line.beginPath();
      line.moveTo(ax, ay);
      line.lineTo(bx, by);
      line.strokePath();
      line.fillStyle(agent.lastAction === 'C' && partner.lastAction === 'C' ? 0x68d391 : 0xf6ad55, 0.35);
      line.fillCircle((ax + bx) / 2, (ay + by) / 2 - 8, 10 + agent.bubbleTimer * 8);
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

  private updateCamera(agents: AgentSnapshot[]) {
    if (agents.length === 0) return;
    const interacting = agents.filter((agent) => agent.mode === 'interacting');
    const focus = interacting.length > 0 ? interacting : agents;
    const targetX = focus.reduce((sum, agent) => sum + agent.x, 0) / focus.length;
    const targetY = focus.reduce((sum, agent) => sum + agent.y, 0) / focus.length;

    const lerp = interacting.length > 0 ? CAMERA_LERP * 1.6 : CAMERA_LERP;
    this.cameraX += (targetX - this.cameraX) * lerp;
    this.cameraY += (targetY - this.cameraY) * lerp;
    this.cameras.main.centerOn(this.cameraX, this.cameraY);
  }
}

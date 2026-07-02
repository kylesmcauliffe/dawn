from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field

import pygame

from simulation.actions import Action
from simulation.payoff import score_round
from strategies import DEFAULT_STRATEGIES, clone_strategy
from visualization.roaming_npc import NPCState, RoamingNPC
from visualization.viz_common import SCREEN_HEIGHT, VIEW_WIDTH
from visualization.world_map import WorldMap


ENCOUNTER_DISTANCE = 96
ENCOUNTER_DISPLAY_SECONDS = 1.4
PAIR_COOLDOWN_SECONDS = 2.0


@dataclass
class ActiveEncounter:
    npc_a: RoamingNPC
    npc_b: RoamingNPC
    timer: float = ENCOUNTER_DISPLAY_SECONDS
    summary: str = ""


@dataclass
class RoamingSimulation:
    world: WorldMap
    npcs: list[RoamingNPC] = field(default_factory=list)
    standings: dict[str, int] = field(default_factory=dict)
    event_log: deque[str] = field(default_factory=lambda: deque(maxlen=8))
    active_encounter: ActiveEncounter | None = None
    pair_cooldowns: dict[tuple[str, str], float] = field(default_factory=dict)
    pair_histories: dict[tuple[str, str], dict[str, list[Action]]] = field(default_factory=dict)

    @classmethod
    def create(cls, strategy_names: list[str] | None = None) -> RoamingSimulation:
        world = WorldMap()
        names = strategy_names or [strategy.name for strategy in DEFAULT_STRATEGIES]
        sim = cls(world=world)
        used_points: list[pygame.math.Vector2] = []
        for name in names:
            template = next(strategy for strategy in DEFAULT_STRATEGIES if strategy.name == name)
            strategy = clone_strategy(template)
            spawn = world.random_spawn()
            while any(spawn.distance_to(point) < 120 for point in used_points):
                spawn = world.random_spawn()
            used_points.append(spawn)
            npc = RoamingNPC(
                name=name,
                strategy=strategy,
                pos=spawn,
                target=world.random_destination(spawn),
            )
            sim.npcs.append(npc)
            sim.standings[name] = 0
        return sim

    def update(self, dt: float) -> None:
        self._tick_pair_cooldowns(dt)

        if self.active_encounter:
            self._update_encounter(dt)
            return

        for npc in self.npcs:
            npc.update_roaming(dt, self.world)

        self._seek_encounters()

    def _tick_pair_cooldowns(self, dt: float) -> None:
        expired: list[tuple[str, str]] = []
        for pair, remaining in self.pair_cooldowns.items():
            remaining -= dt
            if remaining <= 0:
                expired.append(pair)
            else:
                self.pair_cooldowns[pair] = remaining
        for pair in expired:
            del self.pair_cooldowns[pair]

    def _seek_encounters(self) -> None:
        for index_a in range(len(self.npcs)):
            for index_b in range(index_a + 1, len(self.npcs)):
                npc_a = self.npcs[index_a]
                npc_b = self.npcs[index_b]
                if npc_a.state != NPCState.ROAMING or npc_b.state != NPCState.ROAMING:
                    continue
                if npc_a.pos.distance_to(npc_b.pos) > ENCOUNTER_DISTANCE:
                    continue
                pair_key = self._pair_key(npc_a.name, npc_b.name)
                if pair_key in self.pair_cooldowns:
                    continue
                self._start_encounter(npc_a, npc_b)
                return

    def _start_encounter(self, npc_a: RoamingNPC, npc_b: RoamingNPC) -> None:
        pair_key = self._pair_key(npc_a.name, npc_b.name)
        histories = self.pair_histories.setdefault(
            pair_key,
            {npc_a.name: [], npc_b.name: []},
        )
        npc_a.opponent_history = histories[npc_b.name]
        npc_a.my_history = histories[npc_a.name]
        npc_b.opponent_history = histories[npc_a.name]
        npc_b.my_history = histories[npc_b.name]

        npc_a.state = NPCState.DUELING
        npc_b.state = NPCState.DUELING
        npc_a.set_partner(npc_b)
        npc_b.set_partner(npc_a)
        npc_a.face_toward(npc_b)
        npc_b.face_toward(npc_a)

        action_a = npc_a.preview_action()
        action_b = npc_b.preview_action()
        npc_a.record_round(action_a, action_b)
        npc_b.record_round(action_b, action_a)

        points_a, points_b = score_round(action_a, action_b)
        npc_a.last_action = action_a
        npc_b.last_action = action_b
        npc_a.last_points = points_a
        npc_b.last_points = points_b
        self.standings[npc_a.name] += points_a
        self.standings[npc_b.name] += points_b

        summary = (
            f"{npc_a.name} {action_a.value} ({points_a}) vs "
            f"{npc_b.name} {action_b.value} ({points_b})"
        )
        self.event_log.appendleft(summary)
        self.active_encounter = ActiveEncounter(npc_a=npc_a, npc_b=npc_b, summary=summary)

    def _update_encounter(self, dt: float) -> None:
        assert self.active_encounter is not None
        encounter = self.active_encounter
        encounter.timer -= dt
        if encounter.timer > 0:
            return

        pair_key = self._pair_key(encounter.npc_a.name, encounter.npc_b.name)
        self.pair_cooldowns[pair_key] = PAIR_COOLDOWN_SECONDS

        for npc in (encounter.npc_a, encounter.npc_b):
            npc.state = NPCState.COOLDOWN
            npc.cooldown_timer = 0.6
            npc.set_partner(None)
            npc.last_action = None
            npc.last_points = 0
            npc.target = self.world.random_destination(npc.pos, min_distance=100)

        self.active_encounter = None

    def camera_focus(self) -> pygame.math.Vector2:
        if self.active_encounter:
            midpoint = (self.active_encounter.npc_a.pos + self.active_encounter.npc_b.pos) / 2
        elif self.npcs:
            midpoint = sum((npc.pos for npc in self.npcs), pygame.math.Vector2()) / len(self.npcs)
        else:
            midpoint = pygame.math.Vector2(self.world.width / 2, self.world.height / 2)

        camera = midpoint - pygame.math.Vector2(VIEW_WIDTH / 2, SCREEN_HEIGHT / 2)
        camera.x = max(0, min(camera.x, self.world.width - VIEW_WIDTH))
        camera.y = max(0, min(camera.y, self.world.height - SCREEN_HEIGHT))
        return camera

    @staticmethod
    def _pair_key(name_a: str, name_b: str) -> tuple[str, str]:
        return tuple(sorted((name_a, name_b)))

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

import pygame

from simulation.actions import Action
from strategies.classic import StrategyBase
from visualization.viz_common import FONT_PATH, GRAPHICS_PATH, import_folder, strategy_color


class NPCState(Enum):
    ROAMING = "roaming"
    DUELING = "dueling"
    COOLDOWN = "cooldown"


_ANIMATIONS: dict[str, list[pygame.Surface]] | None = None


def _get_animations() -> dict[str, list[pygame.Surface]]:
    global _ANIMATIONS
    if _ANIMATIONS is None:
        _ANIMATIONS = {}
        for direction in ("down", "up", "left", "right"):
            frames = import_folder(GRAPHICS_PATH / "character" / direction)
            idle_frames = import_folder(GRAPHICS_PATH / "character" / f"{direction}_idle")
            _ANIMATIONS[direction] = frames or idle_frames
            _ANIMATIONS[f"{direction}_idle"] = idle_frames or frames
    return _ANIMATIONS


@dataclass
class RoamingNPC:
    name: str
    strategy: StrategyBase
    pos: pygame.math.Vector2
    target: pygame.math.Vector2
    speed: float = 120.0
    state: NPCState = NPCState.ROAMING
    status: str = "down_idle"
    frame_index: float = 0.0
    color: tuple[int, int, int] = field(init=False)
    hitbox: pygame.Rect = field(init=False)
    partner: RoamingNPC | None = None
    last_action: Action | None = None
    last_points: int = 0
    cooldown_timer: float = 0.0
    opponent_history: list[Action] = field(default_factory=list)
    my_history: list[Action] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.color = strategy_color(self.name)
        self.hitbox = pygame.Rect(0, 0, 28, 20)

    def reset_histories(self) -> None:
        self.opponent_history = []
        self.my_history = []

    def preview_action(self) -> Action:
        return self.strategy.choose(self.opponent_history, self.my_history)

    def record_round(self, my_action: Action, opponent_action: Action) -> None:
        self.my_history.append(my_action)
        self.opponent_history.append(opponent_action)

    def set_partner(self, other: RoamingNPC | None) -> None:
        self.partner = other
        if other is None:
            base = self.status.split("_")[0]
            self.status = f"{base}_idle"

    def face_toward(self, other: RoamingNPC) -> None:
        delta = other.pos - self.pos
        if abs(delta.x) > abs(delta.y):
            self.status = "right_idle" if delta.x > 0 else "left_idle"
        else:
            self.status = "down_idle" if delta.y > 0 else "up_idle"

    def update_roaming(self, dt: float, world) -> None:
        if self.cooldown_timer > 0:
            self.cooldown_timer = max(0.0, self.cooldown_timer - dt)
            if self.cooldown_timer == 0 and self.state == NPCState.COOLDOWN:
                self.state = NPCState.ROAMING

        if self.state != NPCState.ROAMING:
            return

        direction = self.target - self.pos
        distance = direction.length()
        if distance < 12:
            self.target = world.random_destination(self.pos, min_distance=140)
            return

        direction = direction.normalize()
        move = direction * self.speed * dt
        next_pos = self.pos + move
        self.hitbox.center = (int(next_pos.x), int(next_pos.y) + 10)

        if world.is_blocked(self.hitbox):
            self.target = world.random_destination(self.pos, min_distance=80)
            return

        self.pos = next_pos
        if abs(direction.x) > abs(direction.y):
            self.status = "right" if direction.x > 0 else "left"
        else:
            self.status = "down" if direction.y > 0 else "up"

        self.frame_index += 4 * dt

    def current_image(self) -> pygame.Surface:
        animations = _get_animations()
        frames = animations.get(self.status) or animations["down_idle"]
        frame = frames[int(self.frame_index) % len(frames)]
        return pygame.transform.scale_by(frame, 1.6)

    def draw(
        self,
        surface: pygame.Surface,
        camera_offset: pygame.math.Vector2,
        name_font: pygame.font.Font,
    ) -> pygame.Rect:
        image = self.current_image()
        screen_pos = self.pos - camera_offset
        rect = image.get_rect(center=(int(screen_pos.x), int(screen_pos.y)))
        surface.blit(image, rect)

        label = name_font.render(self.name, True, self.color)
        label_rect = label.get_rect(midtop=(rect.centerx, rect.bottom - 6))
        surface.blit(label, label_rect)
        return rect

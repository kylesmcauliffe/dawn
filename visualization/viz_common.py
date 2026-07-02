from __future__ import annotations

import hashlib
from os import walk
from pathlib import Path

import pygame

from simulation.actions import Action

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = PROJECT_ROOT / "game" / "s23 - Audio & fixes"
FONT_PATH = ASSET_ROOT / "font" / "LycheeSoda.ttf"
GRAPHICS_PATH = ASSET_ROOT / "graphics"
DATA_PATH = ASSET_ROOT / "data"

SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
SIDEBAR_WIDTH = 300
VIEW_WIDTH = SCREEN_WIDTH - SIDEBAR_WIDTH
TILE_SIZE = 64

STRATEGY_COLORS = {
    "AlwaysCooperate": (88, 196, 118),
    "AlwaysDefect": (214, 84, 84),
    "TitForTat": (92, 164, 230),
    "Grudger": (186, 120, 220),
    "Pavlov": (236, 176, 72),
    "GenerousTitForTat": (96, 210, 198),
    "Random": (170, 170, 170),
}


def strategy_color(name: str) -> tuple[int, int, int]:
    if name in STRATEGY_COLORS:
        return STRATEGY_COLORS[name]
    digest = hashlib.md5(name.encode("utf-8")).hexdigest()
    return tuple(int(digest[i : i + 2], 16) for i in (0, 2, 4))


def import_folder(path: Path) -> list[pygame.Surface]:
    surfaces: list[pygame.Surface] = []
    for _, __, img_files in walk(path):
        for image in sorted(img_files):
            surfaces.append(pygame.image.load(path / image).convert_alpha())
    return surfaces


def draw_action_bubble(
    surface: pygame.Surface,
    center: tuple[int, int],
    action: Action,
    points: int,
    camera_offset: pygame.math.Vector2,
) -> None:
    screen_center = (
        int(center[0] - camera_offset.x),
        int(center[1] - camera_offset.y),
    )
    bubble = pygame.Surface((72, 56), pygame.SRCALPHA)
    bubble_rect = bubble.get_rect(center=screen_center)
    pygame.draw.rect(bubble, (250, 246, 236, 235), bubble.get_rect(), border_radius=18)
    accent = (70, 190, 110) if action == Action.COOPERATE else (220, 70, 70)
    pygame.draw.rect(bubble, accent, pygame.Rect(0, 0, 72, 5), border_radius=8)
    surface.blit(bubble, bubble_rect)

    tail_points = [
        (bubble_rect.centerx - 7, bubble_rect.bottom - 2),
        (bubble_rect.centerx + 7, bubble_rect.bottom - 2),
        (bubble_rect.centerx, bubble_rect.bottom + 10),
    ]
    pygame.draw.polygon(surface, (250, 246, 236), tail_points)

    badge_font = pygame.font.Font(FONT_PATH, 26)
    score_font = pygame.font.Font(FONT_PATH, 16)
    badge = "C" if action == Action.COOPERATE else "D"
    badge_surf = badge_font.render(badge, True, accent)
    score_surf = score_font.render(f"+{points}", True, (64, 70, 78))
    surface.blit(badge_surf, badge_surf.get_rect(center=(bubble_rect.centerx, bubble_rect.centery - 6)))
    surface.blit(score_surf, score_surf.get_rect(center=(bubble_rect.centerx, bubble_rect.centery + 14)))

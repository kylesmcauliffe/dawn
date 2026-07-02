from __future__ import annotations

import hashlib
import sys
from pathlib import Path

import pygame

from simulation.actions import Action
from simulation.tournament import MatchResult, Tournament, TournamentResult

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = PROJECT_ROOT / "game" / "s23 - Audio & fixes"
FONT_PATH = ASSET_ROOT / "font" / "LycheeSoda.ttf"
GROUND_PATH = ASSET_ROOT / "graphics" / "world" / "ground.png"
CHARACTER_PATH = ASSET_ROOT / "graphics" / "character" / "down_idle"

SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
SIDEBAR_WIDTH = 300
ARENA_LEFT = SIDEBAR_WIDTH + 40
ARENA_WIDTH = SCREEN_WIDTH - SIDEBAR_WIDTH - 80
ROUND_PAUSE_MS = 450
MATCH_PAUSE_MS = 1800
TOURNAMENT_PAUSE_MS = 4000
DUEL_GROUND_Y = SCREEN_HEIGHT // 2 + 150

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


class AgentSprite:
    def __init__(self, name: str, side: str):
        self.name = name
        self.side = side
        self.color = strategy_color(name)
        self.base_image = _load_character_frame()
        self.image = self.base_image.copy()
        self.rect = self.image.get_rect()
        self.action: Action | None = None
        self.points = 0
        self.pulse = 0.0

    def set_action(self, action: Action, points: int) -> None:
        self.action = action
        self.points = points
        self.pulse = 1.0
        tint = (70, 190, 110) if action == Action.COOPERATE else (220, 70, 70)
        self.image = _tint_surface(self.base_image, tint, strength=0.45)

    def update(self, dt: float) -> None:
        if self.pulse > 0:
            self.pulse = max(0.0, self.pulse - dt * 2.5)
        if self.pulse == 0 and self.image is not self.base_image:
            self.image = self.base_image.copy()

    def draw(self, surface: pygame.Surface, center: tuple[int, int]) -> None:
        self.rect.center = center
        scale = 1.0 + self.pulse * 0.12
        scaled = pygame.transform.smoothscale(
            self.image,
            (int(self.rect.width * scale), int(self.rect.height * scale)),
        )
        scaled_rect = scaled.get_rect(center=center)
        surface.blit(scaled, scaled_rect)

        if self.action is not None:
            _draw_action_bubble(
                surface,
                center=(center[0], center[1] - 92),
                action=self.action,
                points=self.points,
            )

        label_font = pygame.font.Font(FONT_PATH, 22)
        label = label_font.render(self.name, True, self.color)
        label_rect = label.get_rect(midtop=(center[0], center[1] + 38))
        surface.blit(label, label_rect)


class TournamentViewer:
    def __init__(self, result: TournamentResult, auto_play: bool = True):
        pygame.init()
        pygame.display.set_caption("PyDew Valley — Prisoner Dilemma Tournament")
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        self.font_title = pygame.font.Font(FONT_PATH, 34)
        self.font_body = pygame.font.Font(FONT_PATH, 22)
        self.font_small = pygame.font.Font(FONT_PATH, 18)
        self.ground = pygame.transform.scale(
            pygame.image.load(GROUND_PATH).convert_alpha(),
            (SCREEN_WIDTH - SIDEBAR_WIDTH, SCREEN_HEIGHT),
        )
        self.map_surface = self.ground.copy()

        self.result = result
        self.auto_play = auto_play
        self.paused = not auto_play
        self.match_index = 0
        self.round_index = 0
        self.phase = "round"
        self.phase_timer = 0
        self.running_totals: dict[str, int] = {name: 0 for name, _ in result.standings}
        self.finished_match_totals: dict[str, int] = {}
        self.current_match: MatchResult | None = None
        self.agent_a = AgentSprite("?", "left")
        self.agent_b = AgentSprite("?", "right")
        self.status_line = "Press SPACE to begin"
        self._load_match()

    def _load_match(self) -> None:
        if self.match_index >= len(self.result.matches):
            self.phase = "complete"
            self.status_line = f"Tournament complete — winner: {self.result.winner()}"
            return

        self.current_match = self.result.matches[self.match_index]
        self.round_index = 0
        self.agent_a = AgentSprite(self.current_match.player_a, "left")
        self.agent_b = AgentSprite(self.current_match.player_b, "right")
        self.phase = "round"
        self.phase_timer = 0
        self.status_line = (
            f"Match {self.match_index + 1}/{len(self.result.matches)}: "
            f"{self.current_match.player_a} vs {self.current_match.player_b}"
        )

    def _apply_round(self) -> None:
        assert self.current_match is not None
        record = self.current_match.rounds[self.round_index]
        self.agent_a.set_action(record.action_a, record.points_a)
        self.agent_b.set_action(record.action_b, record.points_b)
        self.status_line = (
            f"Round {record.round_number}/{self.current_match.rounds_played} | "
            f"{record.player_a} {record.action_a.value} ({record.points_a}) vs "
            f"{record.player_b} {record.action_b.value} ({record.points_b})"
        )

    def _finish_match(self) -> None:
        assert self.current_match is not None
        self.finished_match_totals[self.current_match.player_a] = (
            self.finished_match_totals.get(self.current_match.player_a, 0)
            + self.current_match.score_a
        )
        self.finished_match_totals[self.current_match.player_b] = (
            self.finished_match_totals.get(self.current_match.player_b, 0)
            + self.current_match.score_b
        )
        self.running_totals = dict(self.finished_match_totals)
        self.phase = "match_pause"
        self.phase_timer = MATCH_PAUSE_MS
        self.status_line = (
            f"Match over: {self.current_match.player_a} {self.current_match.score_a} — "
            f"{self.current_match.score_b} {self.current_match.player_b}"
        )

    def _advance(self) -> None:
        if self.phase == "complete":
            return

        assert self.current_match is not None

        if self.phase in {"round", "round_pause"}:
            if self.round_index >= len(self.current_match.rounds):
                self._finish_match()
                return
            self._apply_round()
            self.round_index += 1
            self.phase = "round_pause"
            self.phase_timer = ROUND_PAUSE_MS
            return

        if self.phase == "match_pause":
            self.match_index += 1
            self._load_match()
            if self.phase != "complete":
                self._advance()

    def _skip_match(self) -> None:
        if self.phase == "complete":
            return
        self._finish_match()
        self.match_index += 1
        self._load_match()

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        if event.type != pygame.KEYDOWN:
            return

        if event.key == pygame.K_ESCAPE:
            pygame.quit()
            sys.exit()
        if event.key == pygame.K_SPACE:
            if self.phase == "complete":
                return
            if self.paused:
                self.paused = False
                if self.round_index == 0 and self.phase == "round":
                    self._advance()
            else:
                self.paused = True
        if event.key in {pygame.K_RIGHT, pygame.K_n}:
            self._skip_match()
        if event.key == pygame.K_RETURN and self.paused:
            self._advance()
        if event.key == pygame.K_a:
            self.auto_play = not self.auto_play
            self.paused = not self.auto_play

    def update(self, dt: float) -> None:
        self.agent_a.update(dt)
        self.agent_b.update(dt)

        if self.phase == "complete" or self.paused:
            return

        if self.phase_timer > 0:
            self.phase_timer -= dt * 1000
            return

        if self.phase == "round_pause":
            self.phase = "round"
        self._advance()

    def _draw_sidebar(self) -> None:
        sidebar = pygame.Surface((SIDEBAR_WIDTH, SCREEN_HEIGHT))
        sidebar.fill((28, 34, 42))
        self.screen.blit(sidebar, (0, 0))

        title = self.font_title.render("Standings", True, (245, 245, 245))
        self.screen.blit(title, (20, 20))

        standings = sorted(
            self.running_totals.items(),
            key=lambda item: item[1],
            reverse=True,
        )
        if not standings:
            standings = list(self.result.standings)

        y = 80
        for rank, (name, score) in enumerate(standings, start=1):
            color = strategy_color(name)
            display_name = name if len(name) <= 16 else f"{name[:14]}.."
            rank_surf = self.font_body.render(f"{rank}. {display_name}", True, color)
            score_surf = self.font_small.render(str(score), True, (220, 220, 220))
            self.screen.blit(rank_surf, (20, y))
            self.screen.blit(score_surf, (SIDEBAR_WIDTH - 60, y + 2))
            y += 34

        help_y = SCREEN_HEIGHT - 170
        help_lines = [
            "SPACE: pause / play",
            "ENTER: next round",
            "N: next match",
            "A: toggle auto",
            "ESC: quit",
        ]
        for line in help_lines:
            surf = self.font_small.render(line, True, (170, 178, 188))
            self.screen.blit(surf, (20, help_y))
            help_y += 24

    def _draw_arena(self) -> None:
        arena_surface = pygame.Surface((SCREEN_WIDTH - SIDEBAR_WIDTH, SCREEN_HEIGHT))
        arena_surface.blit(self.map_surface, (0, 0))
        shade = pygame.Surface(arena_surface.get_size(), pygame.SRCALPHA)
        shade.fill((255, 255, 255, 24))
        arena_surface.blit(shade, (0, 0))
        self.screen.blit(arena_surface, (SIDEBAR_WIDTH, 0))

        header_panel = pygame.Surface((ARENA_WIDTH, 84), pygame.SRCALPHA)
        header_panel.fill((246, 242, 230, 225))
        self.screen.blit(header_panel, (SIDEBAR_WIDTH + 40, 20))
        header = self.font_title.render("Prisoner Dilemma Arena", True, (34, 40, 48))
        self.screen.blit(header, (SIDEBAR_WIDTH + 60, 32))

        if self.current_match:
            match_text = (
                f"{self.current_match.player_a} vs {self.current_match.player_b} "
                f"({self.match_index + 1}/{len(self.result.matches)})"
            )
        else:
            match_text = "Tournament complete"
        match_surf = self.font_body.render(match_text, True, (40, 48, 58))
        self.screen.blit(match_surf, (SIDEBAR_WIDTH + 60, 66))

        self._draw_duel_stage()

        arena_center_y = SCREEN_HEIGHT // 2 + 56
        left_x = SIDEBAR_WIDTH + 80 + ARENA_WIDTH // 3
        right_x = SIDEBAR_WIDTH + (ARENA_WIDTH * 2) // 3
        self.agent_a.draw(self.screen, (left_x, arena_center_y))
        self.agent_b.draw(self.screen, (right_x, arena_center_y))

        vs_font = pygame.font.Font(FONT_PATH, 34)
        vs_surf = vs_font.render("VS", True, (66, 74, 84))
        vs_rect = vs_surf.get_rect(center=(SIDEBAR_WIDTH + 40 + ARENA_WIDTH // 2, arena_center_y))
        self.screen.blit(vs_surf, vs_rect)

        score_a, score_b = self._current_match_score()
        self._draw_nameplate(self.agent_a.name, score_a, (left_x, arena_center_y - 138), self.agent_a.color)
        self._draw_nameplate(self.agent_b.name, score_b, (right_x, arena_center_y - 138), self.agent_b.color)

        panel = pygame.Surface((ARENA_WIDTH, 70), pygame.SRCALPHA)
        panel.fill((246, 242, 230, 225))
        panel_rect = panel.get_rect(topleft=(SIDEBAR_WIDTH + 40, SCREEN_HEIGHT - 110))
        self.screen.blit(panel, panel_rect)
        status = self.font_body.render(self.status_line, True, (30, 36, 44))
        status_rect = status.get_rect(center=panel_rect.center)
        self.screen.blit(status, status_rect)

    def _draw_duel_stage(self) -> None:
        ground_rect = pygame.Rect(SIDEBAR_WIDTH + 90, DUEL_GROUND_Y, ARENA_WIDTH - 100, 56)
        shadow_rect = pygame.Rect(ground_rect.x, ground_rect.y + 14, ground_rect.width, 16)
        pygame.draw.ellipse(self.screen, (60, 70, 52, 120), shadow_rect)
        pygame.draw.rect(self.screen, (164, 124, 76), ground_rect, border_radius=18)
        grass_rect = ground_rect.inflate(0, -22)
        pygame.draw.rect(self.screen, (128, 180, 104), grass_rect, border_radius=18)

    def _draw_nameplate(
        self,
        name: str,
        score: int,
        center: tuple[int, int],
        accent: tuple[int, int, int],
    ) -> None:
        plate = pygame.Surface((210, 60), pygame.SRCALPHA)
        plate.fill((246, 242, 230, 230))
        pygame.draw.rect(plate, accent, pygame.Rect(0, 0, 210, 6), border_radius=6)
        plate_rect = plate.get_rect(center=center)
        self.screen.blit(plate, plate_rect)

        name_surf = self.font_body.render(name, True, (30, 36, 44))
        score_surf = self.font_small.render(f"Match score: {score}", True, (74, 84, 94))
        self.screen.blit(name_surf, name_surf.get_rect(midtop=(center[0], center[1] - 18)))
        self.screen.blit(score_surf, score_surf.get_rect(midtop=(center[0], center[1] + 8)))

    def _current_match_score(self) -> tuple[int, int]:
        if not self.current_match:
            return (0, 0)
        if self.round_index == 0:
            return (0, 0)

        rounds = self.current_match.rounds[: self.round_index]
        score_a = sum(record.points_a for record in rounds)
        score_b = sum(record.points_b for record in rounds)
        return (score_a, score_b)

    def draw(self) -> None:
        self.screen.fill((18, 22, 28))
        self._draw_sidebar()
        self._draw_arena()
        pygame.display.update()

    def run(self) -> None:
        if self.auto_play and self.phase != "complete":
            self._advance()
        while True:
            dt = self.clock.tick(60) / 1000
            for event in pygame.event.get():
                self.handle_event(event)
            self.update(dt)
            self.draw()


def _load_character_frame() -> pygame.Surface:
    frame_path = next(CHARACTER_PATH.glob("*.png"))
    image = pygame.image.load(frame_path).convert_alpha()
    return pygame.transform.scale_by(image, 1.8)


def _tint_surface(surface: pygame.Surface, color: tuple[int, int, int], strength: float) -> pygame.Surface:
    tinted = surface.copy()
    overlay = pygame.Surface(tinted.get_size(), pygame.SRCALPHA)
    overlay.fill((*color, int(255 * strength)))
    tinted.blit(overlay, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
    return tinted


def _draw_action_bubble(
    surface: pygame.Surface,
    center: tuple[int, int],
    action: Action,
    points: int,
) -> None:
    bubble = pygame.Surface((72, 56), pygame.SRCALPHA)
    bubble.fill((250, 246, 236, 235))
    bubble_rect = bubble.get_rect(center=center)
    pygame.draw.rect(bubble, (250, 246, 236, 235), bubble.get_rect(), border_radius=18)
    accent = (70, 190, 110) if action == Action.COOPERATE else (220, 70, 70)
    pygame.draw.rect(bubble, accent, pygame.Rect(0, 0, 72, 5), border_radius=8)
    surface.blit(bubble, bubble_rect)

    tail_points = [
        (bubble_rect.centerx - 7, bubble_rect.bottom - 2),
        (bubble_rect.centerx + 7, bubble_rect.bottom - 2),
        (bubble_rect.centerx, bubble_rect.bottom + 12),
    ]
    pygame.draw.polygon(surface, (250, 246, 236), tail_points)

    badge_font = pygame.font.Font(FONT_PATH, 26)
    score_font = pygame.font.Font(FONT_PATH, 16)
    badge = "C" if action == Action.COOPERATE else "D"
    badge_surf = badge_font.render(badge, True, accent)
    score_surf = score_font.render(f"+{points}", True, (64, 70, 78))
    surface.blit(badge_surf, badge_surf.get_rect(center=(bubble_rect.centerx, bubble_rect.centery - 6)))
    surface.blit(score_surf, score_surf.get_rect(center=(bubble_rect.centerx, bubble_rect.centery + 14)))


def run_viewer(
    rounds_per_match: int = 200,
    strategy_names: list[str] | None = None,
    replay_path: str | Path | None = None,
    auto_play: bool = True,
) -> None:
    if replay_path:
        from visualization.loader import load_tournament_result

        result = load_tournament_result(replay_path)
    else:
        from strategies import DEFAULT_STRATEGIES

        names = strategy_names or [strategy.name for strategy in DEFAULT_STRATEGIES]
        result = Tournament(strategy_names=names, rounds_per_match=rounds_per_match).run()

    viewer = TournamentViewer(result, auto_play=auto_play)
    viewer.run()

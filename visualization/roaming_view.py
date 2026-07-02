from __future__ import annotations

import sys
from pathlib import Path

import pygame

from visualization.roaming_sim import RoamingSimulation
from visualization.viz_common import (
    FONT_PATH,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    SIDEBAR_WIDTH,
    VIEW_WIDTH,
    draw_action_bubble,
    strategy_color,
)


class RoamingViewer:
    def __init__(self, strategy_names: list[str] | None = None) -> None:
        pygame.init()
        pygame.display.set_caption("PyDew Valley — Roaming Strategy Society")
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        self.font_title = pygame.font.Font(FONT_PATH, 32)
        self.font_body = pygame.font.Font(FONT_PATH, 20)
        self.font_small = pygame.font.Font(FONT_PATH, 16)
        self.name_font = pygame.font.Font(FONT_PATH, 14)
        self.sim = RoamingSimulation.create(strategy_names=strategy_names)
        self.camera = pygame.math.Vector2()
        self.paused = False
        self.status_line = "Agents are roaming the valley..."

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
        if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            pygame.quit()
            sys.exit()
        if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            self.paused = not self.paused

    def update(self, dt: float) -> None:
        if self.paused:
            return
        self.sim.update(dt)
        target_camera = self.sim.camera_focus()
        self.camera.update(target_camera, 0.08)
        if self.sim.active_encounter:
            self.status_line = self.sim.active_encounter.summary
        elif self.sim.event_log:
            self.status_line = self.sim.event_log[0]
        else:
            self.status_line = "Agents are roaming the valley..."

    def _draw_sidebar(self) -> None:
        sidebar = pygame.Surface((SIDEBAR_WIDTH, SCREEN_HEIGHT))
        sidebar.fill((28, 34, 42))
        self.screen.blit(sidebar, (0, 0))

        title = self.font_title.render("Standings", True, (245, 245, 245))
        self.screen.blit(title, (20, 20))

        standings = sorted(self.sim.standings.items(), key=lambda item: item[1], reverse=True)
        y = 78
        for rank, (name, score) in enumerate(standings, start=1):
            display_name = name if len(name) <= 16 else f"{name[:14]}.."
            name_surf = self.font_body.render(f"{rank}. {display_name}", True, strategy_color(name))
            score_surf = self.font_small.render(str(score), True, (220, 220, 220))
            self.screen.blit(name_surf, (20, y))
            self.screen.blit(score_surf, (SIDEBAR_WIDTH - 58, y + 2))
            y += 32

        feed_title = self.font_body.render("Play-by-play", True, (245, 245, 245))
        self.screen.blit(feed_title, (20, 330))
        feed_y = 362
        for line in list(self.sim.event_log)[:6]:
            wrapped = line if len(line) <= 28 else f"{line[:26]}.."
            surf = self.font_small.render(wrapped, True, (186, 194, 204))
            self.screen.blit(surf, (20, feed_y))
            feed_y += 22

        help_y = SCREEN_HEIGHT - 150
        for line in ("SPACE: pause", "ESC: quit"):
            surf = self.font_small.render(line, True, (170, 178, 188))
            self.screen.blit(surf, (20, help_y))
            help_y += 22

    def _draw_world(self) -> None:
        world_view = self.screen.subsurface(pygame.Rect(SIDEBAR_WIDTH, 0, VIEW_WIDTH, SCREEN_HEIGHT))
        world_view.fill((20, 24, 18))
        self.sim.world.draw(world_view, self.camera)

        sorted_npcs = sorted(self.sim.npcs, key=lambda npc: npc.pos.y)
        for npc in sorted_npcs:
            npc.draw(world_view, self.camera, self.name_font)
            if npc.last_action is not None:
                draw_action_bubble(
                    world_view,
                    center=(npc.pos.x, npc.pos.y - 48),
                    action=npc.last_action,
                    points=npc.last_points,
                    camera_offset=self.camera,
                )

        if self.sim.active_encounter:
            encounter = self.sim.active_encounter
            midpoint = (encounter.npc_a.pos + encounter.npc_b.pos) / 2 - self.camera
            ring = pygame.Surface((120, 40), pygame.SRCALPHA)
            pygame.draw.ellipse(ring, (255, 255, 255, 70), ring.get_rect())
            self.screen.blit(ring, ring.get_rect(center=(SIDEBAR_WIDTH + int(midpoint.x), int(midpoint.y) + 18)))

        panel = pygame.Surface((VIEW_WIDTH - 40, 58), pygame.SRCALPHA)
        panel.fill((246, 242, 230, 225))
        panel_rect = panel.get_rect(topleft=(SIDEBAR_WIDTH + 20, SCREEN_HEIGHT - 78))
        self.screen.blit(panel, panel_rect)
        status = self.font_body.render(self.status_line, True, (30, 36, 44))
        self.screen.blit(status, status.get_rect(center=panel_rect.center))

    def draw(self) -> None:
        self.screen.fill((18, 22, 28))
        self._draw_sidebar()
        self._draw_world()
        pygame.display.update()

    def run(self) -> None:
        while True:
            dt = self.clock.tick(60) / 1000
            for event in pygame.event.get():
                self.handle_event(event)
            self.update(dt)
            self.draw()


def run_roaming_viewer(strategy_names: list[str] | None = None) -> None:
    RoamingViewer(strategy_names=strategy_names).run()

from __future__ import annotations

import random

import pygame
from pytmx.util_pygame import load_pygame

from visualization.viz_common import ASSET_ROOT, DATA_PATH, GRAPHICS_PATH, TILE_SIZE, import_folder


class WorldMap:
    def __init__(self) -> None:
        if not pygame.get_init():
            pygame.init()
        self.tmx_data = load_pygame(str(DATA_PATH / "map.tmx"))
        self.width = self.tmx_data.width * TILE_SIZE
        self.height = self.tmx_data.height * TILE_SIZE
        self.blocked_rects: list[pygame.Rect] = []
        self.walkable_points: list[pygame.math.Vector2] = []
        self.farm_points: list[pygame.math.Vector2] = []
        self.world_surface = pygame.Surface((self.width, self.height)).convert_alpha()
        self._build_world()
        self._build_navigation()

    def _build_world(self) -> None:
        ground = pygame.image.load(GRAPHICS_PATH / "world" / "ground.png").convert_alpha()
        self.world_surface.blit(ground, (0, 0))

        tile_layers = [
            "Forest Grass",
            "Hills",
            "Outside Decoration",
            "Water",
            "Fence",
        ]
        for layer_name in tile_layers:
            layer = self.tmx_data.get_layer_by_name(layer_name)
            if layer is None:
                continue
            for x, y, surf in layer.tiles():
                self.world_surface.blit(surf, (x * TILE_SIZE, y * TILE_SIZE))

        water_frames = import_folder(GRAPHICS_PATH / "water")
        water_layer = self.tmx_data.get_layer_by_name("Water")
        if water_layer is not None and water_frames:
            for x, y, _ in water_layer.tiles():
                self.world_surface.blit(water_frames[0], (x * TILE_SIZE, y * TILE_SIZE))

        trees = self.tmx_data.get_layer_by_name("Trees")
        if trees is not None:
            for obj in trees:
                self.world_surface.blit(obj.image, (obj.x, obj.y))
                self.blocked_rects.append(pygame.Rect(obj.x, obj.y, obj.width, obj.height))

        decorations = self.tmx_data.get_layer_by_name("Decoration")
        if decorations is not None:
            for obj in decorations:
                if obj.image:
                    self.world_surface.blit(obj.image, (obj.x, obj.y))

    def _build_navigation(self) -> None:
        blocked_tiles: set[tuple[int, int]] = set()
        for layer_name in ("Collision", "Water", "Fence"):
            layer = self.tmx_data.get_layer_by_name(layer_name)
            if layer is None:
                continue
            for x, y, _ in layer.tiles():
                blocked_tiles.add((x, y))

        for x in range(self.tmx_data.width):
            for y in range(self.tmx_data.height):
                if (x, y) in blocked_tiles:
                    continue
                if y < 8:
                    continue
                point = pygame.math.Vector2(
                    x * TILE_SIZE + TILE_SIZE // 2,
                    y * TILE_SIZE + TILE_SIZE // 2,
                )
                if not self._point_hits_tree(point):
                    self.walkable_points.append(point)
                    if 900 <= point.x <= 2300 and 1100 <= point.y <= 2300:
                        self.farm_points.append(point)

        if not self.farm_points:
            self.farm_points = self.walkable_points.copy()

    def _point_hits_tree(self, point: pygame.math.Vector2) -> bool:
        probe = pygame.Rect(0, 0, 20, 20)
        probe.center = (int(point.x), int(point.y))
        return any(probe.colliderect(rect) for rect in self.blocked_rects)

    def random_spawn(self) -> pygame.math.Vector2:
        return random.choice(self.farm_points).copy()

    def random_destination(self, origin: pygame.math.Vector2, min_distance: float = 120) -> pygame.math.Vector2:
        candidates = [
            point
            for point in self.farm_points
            if point.distance_to(origin) >= min_distance
        ]
        if not candidates:
            return self.random_spawn()
        return random.choice(candidates).copy()

    def is_blocked(self, rect: pygame.Rect) -> bool:
        if rect.left < 0 or rect.top < 0 or rect.right > self.width or rect.bottom > self.height:
            return True
        return any(rect.colliderect(blocked) for blocked in self.blocked_rects)

    def draw(self, surface: pygame.Surface, camera_offset: pygame.math.Vector2) -> None:
        view_rect = pygame.Rect(
            int(camera_offset.x),
            int(camera_offset.y),
            surface.get_width(),
            surface.get_height(),
        )
        surface.blit(self.world_surface, (0, 0), view_rect)

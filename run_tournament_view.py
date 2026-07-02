#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from visualization.roaming_view import run_roaming_viewer
from visualization.tournament_view import run_viewer as run_arena_viewer


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Watch prisoner dilemma strategies in the PyDew Valley game shell."
    )
    parser.add_argument(
        "--mode",
        choices=("roaming", "arena"),
        default="roaming",
        help="roaming = NPCs walk the map and meet; arena = head-to-head replay viewer",
    )
    parser.add_argument("--rounds", type=int, default=200, help="Arena mode: rounds per match.")
    parser.add_argument(
        "--strategies",
        nargs="*",
        help="Optional strategy subset. Defaults to the full classic roster.",
    )
    parser.add_argument(
        "--replay",
        type=Path,
        help="Arena mode: replay a saved tournament JSON.",
    )
    parser.add_argument(
        "--manual",
        action="store_true",
        help="Arena mode: start paused so you can step round-by-round.",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.mode == "roaming":
        run_roaming_viewer(strategy_names=args.strategies)
        return

    run_arena_viewer(
        rounds_per_match=args.rounds,
        strategy_names=args.strategies,
        replay_path=args.replay,
        auto_play=not args.manual,
    )


if __name__ == "__main__":
    main()

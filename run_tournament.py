#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from simulation.tournament import Tournament
from strategies import DEFAULT_STRATEGIES, STRATEGY_REGISTRY


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run an iterated prisoner dilemma tournament with classic strategies."
    )
    parser.add_argument(
        "--rounds",
        type=int,
        default=200,
        help="Number of rounds played in each head-to-head match.",
    )
    parser.add_argument(
        "--strategies",
        nargs="*",
        default=[strategy.name for strategy in DEFAULT_STRATEGIES],
        help="Strategy names to include. Defaults to the full classic set.",
    )
    parser.add_argument(
        "--list-strategies",
        action="store_true",
        help="Print available strategies and exit.",
    )
    parser.add_argument(
        "--save",
        type=Path,
        help="Optional path to save full play-by-play JSON.",
    )
    parser.add_argument(
        "--show-rounds",
        type=int,
        default=10,
        help="How many opening rounds to print per match.",
    )
    return parser


def print_play_by_play(result, show_rounds: int) -> None:
    print(f"\nTournament complete ({result.rounds_per_match} rounds per match)\n")
    print("Standings")
    print("---------")
    for rank, (name, score) in enumerate(result.standings, start=1):
        print(f"{rank:>2}. {name:<20} {score:>6}")

    winner_name, winner_score = result.standings[0]
    print(f"\nWinner: {winner_name} ({winner_score} total points)\n")

    for match in result.matches:
        print(f"Match: {match.player_a} vs {match.player_b}")
        print(f"Final score: {match.score_a} - {match.score_b}")
        print("Opening rounds:")
        for record in match.rounds[:show_rounds]:
            print(
                f"  R{record.round_number:>3} | "
                f"{record.player_a}: {record.action_a.value} ({record.points_a}) | "
                f"{record.player_b}: {record.action_b.value} ({record.points_b})"
            )
        if len(match.rounds) > show_rounds:
            print(f"  ... {len(match.rounds) - show_rounds} more rounds")
        print()


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.list_strategies:
        print("Available strategies:")
        for name in sorted(STRATEGY_REGISTRY):
            print(f"  - {name}")
        return

    tournament = Tournament(strategy_names=args.strategies, rounds_per_match=args.rounds)
    result = tournament.run()
    print_play_by_play(result, show_rounds=args.show_rounds)

    if args.save:
        result.save(args.save)
        print(f"Saved full play-by-play to {args.save}")


if __name__ == "__main__":
    main()

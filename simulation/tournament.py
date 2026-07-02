from __future__ import annotations

from dataclasses import dataclass, field
from itertools import combinations
import json
from pathlib import Path

from simulation.actions import Action
from simulation.payoff import score_round
from simulation.player import StrategyPlayer
from strategies.classic import StrategyBase, get_strategy


@dataclass
class RoundRecord:
    match_id: str
    round_number: int
    player_a: str
    player_b: str
    action_a: Action
    action_b: Action
    points_a: int
    points_b: int


@dataclass
class MatchResult:
    player_a: str
    player_b: str
    rounds_played: int
    score_a: int
    score_b: int
    rounds: list[RoundRecord] = field(default_factory=list)


@dataclass
class TournamentResult:
    rounds_per_match: int
    matches: list[MatchResult]
    standings: list[tuple[str, int]]

    def winner(self) -> str:
        return self.standings[0][0]

    def to_json(self) -> str:
        payload = {
            "rounds_per_match": self.rounds_per_match,
            "standings": [{"name": name, "score": score} for name, score in self.standings],
            "matches": [
                {
                    "player_a": match.player_a,
                    "player_b": match.player_b,
                    "score_a": match.score_a,
                    "score_b": match.score_b,
                    "rounds_played": match.rounds_played,
                    "rounds": [
                        {
                            "round": record.round_number,
                            "action_a": record.action_a.value,
                            "action_b": record.action_b.value,
                            "points_a": record.points_a,
                            "points_b": record.points_b,
                        }
                        for record in match.rounds
                    ],
                }
                for match in self.matches
            ],
        }
        return json.dumps(payload, indent=2)

    def save(self, path: str | Path) -> None:
        Path(path).write_text(self.to_json())


class Tournament:
    def __init__(self, strategy_names: list[str], rounds_per_match: int = 200, seed: int | None = None):
        if len(strategy_names) < 2:
            raise ValueError("A tournament needs at least two strategies.")
        if rounds_per_match < 1:
            raise ValueError("rounds_per_match must be at least 1.")

        self.rounds_per_match = rounds_per_match
        self.seed = seed
        self.players = [
            StrategyPlayer(strategy=_clone_strategy(get_strategy(name)))
            for name in strategy_names
        ]

    def run(self) -> TournamentResult:
        totals = {player.name: 0 for player in self.players}
        matches: list[MatchResult] = []

        for player in self.players:
            player.reset()

        for left, right in combinations(self.players, 2):
            match = self._play_match(left, right)
            matches.append(match)
            totals[left.name] += match.score_a
            totals[right.name] += match.score_b

        standings = sorted(totals.items(), key=lambda item: item[1], reverse=True)
        return TournamentResult(
            rounds_per_match=self.rounds_per_match,
            matches=matches,
            standings=standings,
        )

    def _play_match(self, player_a: StrategyPlayer, player_b: StrategyPlayer) -> MatchResult:
        strategy_a = _clone_strategy(player_a.strategy)
        strategy_b = _clone_strategy(player_b.strategy)
        strategy_a.reset()
        strategy_b.reset()

        history_a: list[Action] = []
        history_b: list[Action] = []
        score_a = 0
        score_b = 0
        rounds: list[RoundRecord] = []
        match_id = f"{player_a.name}_vs_{player_b.name}"

        for round_number in range(1, self.rounds_per_match + 1):
            action_a = strategy_a.choose(history_b, history_a)
            action_b = strategy_b.choose(history_a, history_b)
            history_a.append(action_a)
            history_b.append(action_b)

            points_a, points_b = score_round(action_a, action_b)
            score_a += points_a
            score_b += points_b
            rounds.append(
                RoundRecord(
                    match_id=match_id,
                    round_number=round_number,
                    player_a=player_a.name,
                    player_b=player_b.name,
                    action_a=action_a,
                    action_b=action_b,
                    points_a=points_a,
                    points_b=points_b,
                )
            )

        return MatchResult(
            player_a=player_a.name,
            player_b=player_b.name,
            rounds_played=self.rounds_per_match,
            score_a=score_a,
            score_b=score_b,
            rounds=rounds,
        )


def _clone_strategy(strategy: StrategyBase) -> StrategyBase:
    from strategies.classic import clone_strategy

    return clone_strategy(strategy)

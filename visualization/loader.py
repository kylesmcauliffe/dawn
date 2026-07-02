from __future__ import annotations

import json
from pathlib import Path

from simulation.tournament import TournamentResult


def load_tournament_result(path: str | Path) -> TournamentResult:
    data = json.loads(Path(path).read_text())
    from simulation.actions import Action
    from simulation.tournament import MatchResult, RoundRecord

    matches = []
    for match_data in data["matches"]:
        rounds = [
            RoundRecord(
                match_id=f"{match_data['player_a']}_vs_{match_data['player_b']}",
                round_number=round_data["round"],
                player_a=match_data["player_a"],
                player_b=match_data["player_b"],
                action_a=Action(round_data["action_a"]),
                action_b=Action(round_data["action_b"]),
                points_a=round_data["points_a"],
                points_b=round_data["points_b"],
            )
            for round_data in match_data["rounds"]
        ]
        matches.append(
            MatchResult(
                player_a=match_data["player_a"],
                player_b=match_data["player_b"],
                rounds_played=match_data["rounds_played"],
                score_a=match_data["score_a"],
                score_b=match_data["score_b"],
                rounds=rounds,
            )
        )

    standings = [(entry["name"], entry["score"]) for entry in data["standings"]]
    return TournamentResult(
        rounds_per_match=data["rounds_per_match"],
        matches=matches,
        standings=standings,
    )

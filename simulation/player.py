from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

from simulation.actions import Action


class Strategy(Protocol):
    name: str

    def reset(self) -> None: ...

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action: ...


@dataclass
class StrategyPlayer:
    strategy: Strategy
    score: int = 0
    history: list[Action] = field(default_factory=list)

    @property
    def name(self) -> str:
        return self.strategy.name

    def reset(self) -> None:
        self.score = 0
        self.history = []
        self.strategy.reset()

    def choose(self, opponent_history: list[Action]) -> Action:
        action = self.strategy.choose(opponent_history, self.history)
        self.history.append(action)
        return action

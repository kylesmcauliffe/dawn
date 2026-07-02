from __future__ import annotations

import random
from dataclasses import dataclass, field

from simulation.actions import Action


class StrategyBase:
    name = "base"

    def reset(self) -> None:
        pass

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action:
        raise NotImplementedError


@dataclass
class AlwaysCooperate(StrategyBase):
    name: str = "AlwaysCooperate"

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action:
        return Action.COOPERATE


@dataclass
class AlwaysDefect(StrategyBase):
    name: str = "AlwaysDefect"

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action:
        return Action.DEFECT


@dataclass
class TitForTat(StrategyBase):
    name: str = "TitForTat"

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action:
        if not opponent_history:
            return Action.COOPERATE
        return opponent_history[-1]


@dataclass
class Grudger(StrategyBase):
    """Grim trigger: cooperate until the opponent defects once, then always defect."""

    name: str = "Grudger"
    triggered: bool = False

    def reset(self) -> None:
        self.triggered = False

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action:
        if self.triggered or Action.DEFECT in opponent_history:
            self.triggered = True
            return Action.DEFECT
        return Action.COOPERATE


@dataclass
class RandomStrategy(StrategyBase):
    name: str = "Random"
    seed: int | None = None
    _rng: random.Random = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self._rng = random.Random(self.seed)

    def reset(self) -> None:
        if self.seed is not None:
            self._rng = random.Random(self.seed)

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action:
        return self._rng.choice([Action.COOPERATE, Action.DEFECT])


@dataclass
class Pavlov(StrategyBase):
    """Win-stay, lose-shift."""

    name: str = "Pavlov"

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action:
        if not my_history:
            return Action.COOPERATE
        last_mine = my_history[-1]
        last_theirs = opponent_history[-1]
        my_payoff, _ = {
            (Action.COOPERATE, Action.COOPERATE): (3, 3),
            (Action.COOPERATE, Action.DEFECT): (0, 5),
            (Action.DEFECT, Action.COOPERATE): (5, 0),
            (Action.DEFECT, Action.DEFECT): (1, 1),
        }[(last_mine, last_theirs)]
        if my_payoff in (3, 5):
            return last_mine
        return Action.DEFECT if last_mine == Action.COOPERATE else Action.COOPERATE


@dataclass
class GenerousTitForTat(StrategyBase):
    name: str = "GenerousTitForTat"
    forgiveness_chance: float = 0.1
    seed: int | None = None
    _rng: random.Random = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self._rng = random.Random(self.seed)

    def reset(self) -> None:
        if self.seed is not None:
            self._rng = random.Random(self.seed)

    def choose(self, opponent_history: list[Action], my_history: list[Action]) -> Action:
        if not opponent_history:
            return Action.COOPERATE
        if opponent_history[-1] == Action.DEFECT and self._rng.random() < self.forgiveness_chance:
            return Action.COOPERATE
        return opponent_history[-1]


DEFAULT_STRATEGIES: list[StrategyBase] = [
    AlwaysCooperate(),
    AlwaysDefect(),
    TitForTat(),
    Grudger(),
    Pavlov(),
    GenerousTitForTat(seed=42),
    RandomStrategy(seed=42),
]

STRATEGY_REGISTRY = {strategy.name: strategy for strategy in DEFAULT_STRATEGIES}


def get_strategy(name: str) -> StrategyBase:
    try:
        return STRATEGY_REGISTRY[name]
    except KeyError as exc:
        known = ", ".join(sorted(STRATEGY_REGISTRY))
        raise ValueError(f"Unknown strategy '{name}'. Known strategies: {known}") from exc


def clone_strategy(strategy: StrategyBase) -> StrategyBase:
    from dataclasses import fields

    cls = strategy.__class__
    kwargs = {
        field.name: getattr(strategy, field.name)
        for field in fields(cls)
        if field.init
    }
    return cls(**kwargs)

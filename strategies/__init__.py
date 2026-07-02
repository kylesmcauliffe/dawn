from strategies.classic import (
    DEFAULT_STRATEGIES,
    STRATEGY_REGISTRY,
    AlwaysCooperate,
    AlwaysDefect,
    GenerousTitForTat,
    Grudger,
    Pavlov,
    RandomStrategy,
    TitForTat,
    get_strategy,
    clone_strategy,
)

__all__ = [
    "DEFAULT_STRATEGIES",
    "STRATEGY_REGISTRY",
    "AlwaysCooperate",
    "AlwaysDefect",
    "TitForTat",
    "Grudger",
    "Pavlov",
    "GenerousTitForTat",
    "RandomStrategy",
    "get_strategy",
    "clone_strategy",
]

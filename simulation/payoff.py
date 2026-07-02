from simulation.actions import Action

# Standard Axelrod payoff matrix (temptation=5, reward=3, punishment=1, sucker=0)
PAYOFF_MATRIX = {
    (Action.COOPERATE, Action.COOPERATE): (3, 3),
    (Action.COOPERATE, Action.DEFECT): (0, 5),
    (Action.DEFECT, Action.COOPERATE): (5, 0),
    (Action.DEFECT, Action.DEFECT): (1, 1),
}


def score_round(action_a: Action, action_b: Action) -> tuple[int, int]:
    return PAYOFF_MATRIX[(action_a, action_b)]

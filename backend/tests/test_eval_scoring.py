"""
Unit tests for the evaluation scoring vocabulary normalisation.

Regression guard for the defect where gold-case expectations
(answer | refuse | escalate | redirect) were compared literally against the
chat pipeline's runtime outcomes (answered | declined | escalated |
redirected), causing semantically correct cases to be scored as failures.
"""

import pytest

from app.features.ops.service import canonical_behavior


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        # Gold-case (imperative) vocabulary
        ("answer", "answer"),
        ("refuse", "refuse"),
        ("escalate", "escalate"),
        ("redirect", "redirect"),
        # Pipeline (past-tense) vocabulary
        ("answered", "answer"),
        ("declined", "refuse"),
        ("escalated", "escalate"),
        ("redirected", "redirect"),
        # Extra accepted synonyms
        ("decline", "refuse"),
        ("refused", "refuse"),
        # Case / whitespace insensitivity
        ("  ANSWERED  ", "answer"),
        ("Escalated", "escalate"),
        # Empty / unknown values are deterministic (never silently coerced)
        ("", ""),
        (None, ""),
        ("something_else", "something_else"),
    ],
)
def test_canonical_behavior(raw, expected):
    assert canonical_behavior(raw) == expected


@pytest.mark.parametrize(
    ("gold", "runtime"),
    [
        ("answer", "answered"),
        ("refuse", "declined"),
        ("escalate", "escalated"),
        ("redirect", "redirected"),
    ],
)
def test_gold_and_runtime_vocabularies_agree(gold, runtime):
    """The whole point of the fix: equivalent labels must normalise equal."""
    assert canonical_behavior(gold) == canonical_behavior(runtime)


@pytest.mark.parametrize(
    ("gold", "runtime"),
    [
        ("answer", "escalated"),
        ("refuse", "answered"),
        ("escalate", "redirected"),
        ("answer", "declined"),
    ],
)
def test_genuinely_different_behaviours_stay_different(gold, runtime):
    """Distinct behaviours must NOT be conflated by normalisation."""
    assert canonical_behavior(gold) != canonical_behavior(runtime)

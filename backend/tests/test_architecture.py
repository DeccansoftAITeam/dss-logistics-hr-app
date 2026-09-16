"""
Architecture test suite powered by ArchUnitPython.

Enforces:
1. No circular dependencies across the application.
2. Layer boundaries: core infrastructure must never depend on domain feature slices.
3. Code metrics: hard 1000-line-per-file limit enforced directly in pytest.
"""

from archunitpython import assert_passes, metrics, project_files


def test_no_circular_dependencies():
    """Verify that no circular dependencies exist within the backend application."""
    rule = project_files("app/").should().have_no_cycles()
    assert_passes(rule)


def test_core_does_not_depend_on_features():
    """
    App core contains cross-cutting concerns (DB session, config, errors, auth).
    It must never depend on specific domain features.
    """
    rule = (
        project_files("app/")
        .in_folder("**/core/**")
        .should_not()
        .depend_on_files()
        .in_folder("**/features/**")
    )
    assert_passes(rule)


def test_no_file_exceeds_1000_lines():
    """
    Hard 1000-line-per-file limit.
    Enforces decomposition and prevents bloated monolithic files.
    """
    rule = metrics("app/").count().lines_of_code().should_be_below(1000)
    assert_passes(rule)

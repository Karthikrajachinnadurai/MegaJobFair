import pandas as pd

WINDOW_MIN = 60                  # prefer the last 60 minutes of this company's activity
MIN_EVENTS = 3                   # need at least 3 interview starts to measure a speed
FALLBACK_LAST = 6                # slow company? use its last 6 starts instead
DEFAULT_MIN_PER_STUDENT = 10.0   # cold-start guess, before any real data


def minutes_per_student(starts: pd.Series) -> float:
    """Average gap between consecutive interview starts."""
    s = starts.sort_values()
    return (s.iloc[-1] - s.iloc[0]).total_seconds() / 60 / (len(s) - 1)


def predict_wait(history: pd.DataFrame, company_id, now, people_ahead: int) -> dict:
    """
    history: this company's queue rows, with interview_started_at (NaT = not started yet).
    Returns the ETA in minutes plus how it was worked out.
    """
    starts = history.loc[
        (history["company_id"] == company_id)
        & history["interview_started_at"].notna()
        & (history["interview_started_at"] <= now),
        "interview_started_at",
    ]
    recent = starts[starts > now - pd.Timedelta(minutes=WINDOW_MIN)]

    if len(recent) >= MIN_EVENTS:
        mps = minutes_per_student(recent)
        method = f"last {WINDOW_MIN} min: {len(recent)} interviews started"
    elif len(starts) >= MIN_EVENTS:
        last = starts.sort_values().tail(FALLBACK_LAST)
        mps = minutes_per_student(last)
        method = f"slow queue: based on its last {len(last)} interviews"
    else:
        mps = DEFAULT_MIN_PER_STUDENT
        method = "estimate only: not enough interviews yet"

    # +0.5: on average you also wait for half of the current interview to finish
    eta = 0.0 if people_ahead == 0 else (people_ahead + 0.5) * mps
    return {"eta_min": round(eta, 1), "minutes_per_student": round(mps, 1),
            "people_ahead": people_ahead, "method": method}
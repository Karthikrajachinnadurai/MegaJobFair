import numpy as np
import pandas as pd
from datetime import datetime, timedelta

rng = np.random.default_rng(42)          # fixed seed -> same data every run

NUM_COMPANIES = 6

# Fake companies for testing: random panels and interview lengths
COMPANIES = [
    (
        cid,
        f"Company {cid}",                       # just a label
        int(rng.integers(1, 4)),                # 1 to 3 HR panels
        int(rng.integers(8, 26)),               # 8 to 25 minute interviews
    )
    for cid in range(1, NUM_COMPANIES + 1)
]
DAY_START = datetime(2026, 12, 5, 9, 30)
DAY_END   = datetime(2026, 12, 5, 15, 0)


def simulate_company(cid, name, panels, typical_min):
    capacity = panels * 60 / typical_min           # students/hour it can handle
    panel_free = [DAY_START] * panels               # when each panel is next free
    rows, t = [], DAY_START

    while True:
        # Morning rush (more arrivals than capacity), quieter afternoon
        rate = capacity * (1.3 if t.hour < 12 else 0.7)
        t += timedelta(minutes=rng.exponential(60 / rate))
        if t > DAY_END:
            break

        p = int(np.argmin(panel_free))              # first panel to become free
        start = max(t, panel_free[p])               # wait if all panels are busy
        duration = rng.lognormal(np.log(typical_min), 0.35)
        end = start + timedelta(minutes=duration)
        panel_free[p] = end

        rows.append({
            "company_id": cid, "company": name, "panels": panels,
            "joined_queue_at": t, "interview_started_at": start, "decided_at": end,
        })
    return rows


def main():
    rows = []
    for c in COMPANIES:
        rows += simulate_company(*c)
    df = pd.DataFrame(rows).sort_values("joined_queue_at").reset_index(drop=True)

    df["wait_min"] = (df["interview_started_at"] - df["joined_queue_at"]).dt.total_seconds() / 60
    df["interview_min"] = (df["decided_at"] - df["interview_started_at"]).dt.total_seconds() / 60

    df.to_csv("simulated_queue.csv", index=False)
    print(df.groupby("company")[["wait_min", "interview_min"]]
            .agg(["count", "mean", "max"]).round(1))


if __name__ == "__main__":
    main()
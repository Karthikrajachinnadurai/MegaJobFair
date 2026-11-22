import sys
import pandas as pd
from wait_predictor import predict_wait


def evaluate(path: str):
    df = pd.read_csv(path, parse_dates=["joined_queue_at", "interview_started_at", "decided_at"])
    rows = []
    for _, s in df.iterrows():
        now = s["joined_queue_at"]
        same = df[df["company_id"] == s["company_id"]]

        # Only what the system KNEW at this moment: no peeking into the future
        known = same[same["joined_queue_at"] < now].copy()
        known.loc[known["interview_started_at"] > now, "interview_started_at"] = pd.NaT
        people_ahead = int(known["interview_started_at"].isna().sum())

        model = predict_wait(known, s["company_id"], now, people_ahead)["eta_min"]
        naive = people_ahead * 10                 # "10 minutes per person" guess
        rows.append({"company": s["company"], "actual": s["wait_min"],
                     "model": model, "naive": naive})

    r = pd.DataFrame(rows)
    r["model_err"] = (r["model"] - r["actual"]).abs()
    r["naive_err"] = (r["naive"] - r["actual"]).abs()
    return r


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "simulated_queue.csv"
    r = evaluate(path)
    print("Average error in minutes (lower is better):")
    print(r.groupby("company")[["model_err", "naive_err"]].mean().round(1))
    print(f"\nOverall: model {r['model_err'].mean():.1f} min | naive {r['naive_err'].mean():.1f} min")
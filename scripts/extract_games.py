#!/usr/bin/env python3
"""Extract NBCML game results from team-stats.htm + schedule.js → data/games.js"""
from __future__ import annotations

import json
import re
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path("/workspace/nbcml-league")
SOURCE = Path("/workspace/nbc-source/team-stats.htm")
SCHEDULE_JS = ROOT / "data" / "schedule.js"
OUT = ROOT / "data" / "games.js"

MONTHS = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec"
DATE_RE = re.compile(rf"^({MONTHS})-\d+$")


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_tr = False
        self.in_td = False
        self.text = ""
        self.cur: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.in_tr = True
            self.cur = []
            self.text = ""
        elif tag == "td" and self.in_tr:
            self.in_td = True
            self.text = ""

    def handle_endtag(self, tag):
        if tag == "td" and self.in_td:
            cell = self.text.replace("\xa0", " ").replace("\n", " ").strip()
            # collapse internal whitespace
            cell = re.sub(r"\s+", " ", cell)
            self.cur.append(cell)
            self.in_td = False
        elif tag == "tr" and self.in_tr:
            if any(c for c in self.cur):
                self.rows.append(self.cur)
            self.in_tr = False

    def handle_data(self, data):
        if self.in_td:
            self.text += data


def load_schedule() -> dict:
    text = SCHEDULE_JS.read_text(encoding="utf-8")
    m = re.search(r"window\.NBCML_SCHEDULE\s*=\s*(\{.*\})\s*;?\s*$", text, re.S)
    if not m:
        raise SystemExit("Could not parse schedule.js")
    return json.loads(m.group(1))


def parse_points(val: str):
    v = (val or "").strip()
    if not v or v == "-":
        return None
    try:
        if re.fullmatch(r"-?\d+", v):
            return int(v)
        return float(v)
    except ValueError:
        return None


def schedule_date_to_label(date_str: str) -> str:
    day, mon, _yr = date_str.split("-")
    return f"{mon}-{int(day)}"


def iso_from_schedule(date_str: str) -> str:
    return datetime.strptime(date_str, "%d-%b-%y").strftime("%Y-%m-%d")


def extract_players_by_team(rows: list[list[str]]):
    date_labels: list[str] = []
    header_idx = None
    date_start = None

    for i, r in enumerate(rows):
        if "Sep-23" not in r:
            continue
        if "GP" not in r and "Player Name" not in " ".join(r):
            continue
        for j, c in enumerate(r):
            if DATE_RE.match(c):
                date_start = j
                date_labels = [x for x in r[j:] if DATE_RE.match(x)]
                header_idx = i
                break
        if date_labels:
            break

    if not date_labels or date_start is None:
        raise SystemExit("No date labels found in team-stats.htm")

    teams: dict[int, list[dict]] = {}
    current_team = None
    normal_width = len(rows[header_idx])

    for r in rows[header_idx + 1 :]:
        team_cell = next((c for c in r[:3] if re.match(r"^TEAM\s+\d+$", c, re.I)), None)
        if team_cell:
            current_team = int(re.search(r"\d+", team_cell).group())
            teams.setdefault(current_team, [])
            continue
        if current_team is None:
            continue

        last = r[1] if len(r) > 1 else ""
        first = r[2] if len(r) > 2 else ""
        number = r[3] if len(r) > 3 else ""

        # Team total / blank
        if not last.strip() and not first.strip():
            continue

        is_other = "other" in last.lower() or "trades" in last.lower()

        if is_other:
            name = "Other (trades)"
            number_out = ""
            # Excel export omits the blank spacer before dates → dates start one col earlier
            start = date_start - 1 if len(r) < normal_width or r[date_start - 1 : date_start] != [""] else date_start
            # Prefer: if col at date_start-1 looks like a point and date_start looks like next day,
            # and blank spacer missing
            if len(r) > date_start - 1 and r[7] != "" and (len(r) < normal_width or r[7] != ""):
                # Standard player has '' at index 7; Other has first date at 7
                if r[7] != "" and DATE_RE.match(rows[header_idx][8] or ""):
                    start = 7
            pts_slice = r[start : start + len(date_labels)]
        else:
            if not last or not first:
                continue
            if first.lower() == "x" and "other" not in last.lower():
                continue
            name = f"{first} {last}".strip()
            number_out = number if str(number).isdigit() else ""
            pts_slice = r[date_start : date_start + len(date_labels)]

        by_date = {}
        for label, raw in zip(date_labels, pts_slice):
            pts = parse_points(raw)
            if pts is not None:
                by_date[label] = pts

        teams[current_team].append(
            {
                "name": name,
                "number": number_out,
                "by_date": by_date,
                "is_other": is_other,
            }
        )

    return date_labels, teams


def build_games(schedule: dict, teams: dict, date_labels: list[str]) -> list[dict]:
    captains = schedule.get("captains", {})
    times = schedule.get("times", {})
    label_set = set(date_labels)
    games = []

    holiday_dates = set()
    for h in schedule.get("holidays", []):
        holiday_dates.update(h.get("dates", []))

    for week in schedule.get("weeks", []):
        date = week["date"]
        if date in holiday_dates:
            continue
        if not all(k in week for k in ("early", "middle", "late")):
            continue

        label = schedule_date_to_label(date)
        if label not in label_set:
            print(f"WARN: no points column for {date} → {label}")
            continue

        iso = iso_from_schedule(date)
        week_num = week["week"]

        for slot in ("early", "middle", "late"):
            matchup = week[slot]
            home_t = int(matchup["home"])
            away_t = int(matchup["away"])
            time = matchup.get("time") or times.get(slot, "")

            def team_night(team_num: int):
                players_out = []
                score = 0
                for p in teams.get(team_num, []):
                    if label not in p["by_date"]:
                        continue
                    pts = p["by_date"][label]
                    score += pts
                    players_out.append(
                        {
                            "team": team_num,
                            "name": p["name"],
                            "number": p["number"],
                            "points": pts,
                        }
                    )
                players_out.sort(key=lambda x: (-x["points"], x["name"]))
                cap = captains.get(str(team_num), "")
                return score, players_out, cap

            home_score, home_players, home_cap = team_night(home_t)
            away_score, away_players, away_cap = team_night(away_t)

            if home_score > away_score:
                winner = home_t
            elif away_score > home_score:
                winner = away_t
            else:
                winner = None

            games.append(
                {
                    "id": f"{iso}-{slot}",
                    "week": week_num,
                    "date": date,
                    "isoDate": iso,
                    "dateLabel": label,
                    "slot": slot,
                    "time": time,
                    "home": {"team": home_t, "score": home_score, "captain": home_cap},
                    "away": {"team": away_t, "score": away_score, "captain": away_cap},
                    "winner": winner,
                    "players": home_players + away_players,
                }
            )

    return games


def main():
    raw = SOURCE.read_text(encoding="latin-1", errors="replace")
    parser = TableParser()
    parser.feed(raw)
    date_labels, teams = extract_players_by_team(parser.rows)
    schedule = load_schedule()
    games = build_games(schedule, teams, date_labels)

    # Sanity: compare week-1 to known sheet totals
    sheet_totals = {}  # team -> label -> total from summing
    for t, plist in teams.items():
        sheet_totals[t] = {}
        for label in date_labels:
            sheet_totals[t][label] = sum(p["by_date"].get(label, 0) for p in plist)

    payload = {
        "season": schedule.get("season", "2025-26"),
        "source": "club team scoring sheet (player points summed per game)",
        "gameCount": len(games),
        "games": games,
    }

    OUT.write_text(
        "/** Auto-extracted — do not hand-edit lightly */\n"
        "window.NBCML_GAMES = "
        + json.dumps(payload, indent=2, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )

    print(f"Wrote {OUT} with {len(games)} games ({OUT.stat().st_size} bytes)")
    for t in sorted(teams):
        print(f"  Team {t}: {len(teams[t])} rows; Sep-23 total={sheet_totals[t].get('Sep-23')}")

    for g in [g for g in games if g["week"] == 1]:
        h, a = g["home"], g["away"]
        print(
            f"  W1 {g['slot']}: Team {h['team']} ({h['captain'].split()[-1]}) {h['score']} – "
            f"{a['score']} Team {a['team']} ({a['captain'].split()[-1]})"
        )


if __name__ == "__main__":
    main()

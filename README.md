# NBCML — Newmarket Basketball Club Men's League

Static multi-page league site for Pete Raf. Hardwood court look, seven-ball nav,
and the club hub link tree with 2025–26 season data.

**This is a local modern rebuild — it does not host the live domain.**

## Backups

Before the 2026 UI refresh, a full copy was saved:

- Box folder: `/workspace/nbcml-league-backup-20260916-041634/`
- Box archive: `/workspace/nbcml-league-backup-20260916-041634.tar.gz`
- Mac: `/Users/petarrafajlovic/Documents/nbcml-league-backup-20260916-041634.tar.gz`

**Do not delete those backups.** Updated site archive after the refresh:
`/workspace/nbcml-league-modern.tar.gz` (sync to Mac separately).
Standings update archive: `/workspace/nbcml-league-with-standings.tar.gz`.

## Run locally

```bash
cd /workspace/nbcml-league
python3 -m http.server 5180 --bind 127.0.0.1
```

Open **http://127.0.0.1:5180/**

## Pages

| Page | File |
|------|------|
| Home | `index.html` (includes FINAL STANDINGS 2025-26) |
| Our Rules | `rules.html` (+ `assets/Printable-Rules-NBCML.pdf`) |
| Rosters | `rosters.html` |
| Standings | `standings.html` |
| Player Stats | `individual-scoring.html` |
| Schedule (grid + scores/box links) | `schedule.html` (`team-scoring.html` redirects here) |
| Scorekeeping Schedule | `scorekeeping.html` |

See **[LINK-TREE.md](LINK-TREE.md)** for official URL → local mapping.

## Data

| File | Source |
|------|--------|
| `data/rosters.js` | Club roster sheet |
| `data/schedule.js` | `schedule.htm` (29 weeks + playoffs) |
| `data/scorekeeping.js` | `scorekeeping.htm` |
| `data/leaders.js` | `indiv-stats.htm` FINAL player stats |
| `data/standings.js` | Hub FINAL standings |

## Design (2026 refresh)

- Hardwood court background + orange ball nav (unchanged identity)
- Sticky frosted header; black 6-cell nav with yellow active label (scrolls on narrow screens)
- Soft white glass cards, 14px radius, soft shadows, Inter typography
- Horizontal-snap mobile nav; sticky table headers; clearer zebra rows
- Magna Centre venue bar, Executive / Draft Committee, scoresheets + rules PDF

## Notes

- Scorekeeping rules: Middle game teams score Early **and** Late; Late game teams score Middle.
- Individual scoring page lists the full extractable FINAL leaderboard (Player, Team, GP, TP, AVG).
- Dedicated Standings page (+ home section) shows FINAL standings with W/L/T; Team Scoring keeps the same table and links to Standings. Game-by-game team sheets can be imported later.

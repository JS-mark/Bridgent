# Launch playbook — Bridgent AI

Per-channel templates for the Bridgent AI v0.2.x alpha launch. Each file is meant to be
copy-pasted (or adapted) by the maintainer at launch time.

| Channel | Language | File | Best window |
|---|---|---|---|
| [Hacker News (Show HN)](./hn.md) | EN | `hn.md` | Tue–Thu 06:00–09:00 PT |
| [Product Hunt](./ph.md) | EN | `ph.md` | 00:01 PT, full-day window |
| [X / Twitter thread](./twitter.md) | EN | `twitter.md` | Weekday 09–11 or 18–20 PT |
| [V2EX](./v2ex.md) | 中文 | `v2ex.md` | Weekday 10–12 / 20–22 北京时间 |
| [知乎](./zhihu.md) | 中文 | `zhihu.md` | 周末晚 / 工作日 21:00 后 |

## Sequence

1. **Day 0**: ship release on npm (see `docs/release-checklist.md`)
2. **Day 0 evening**: HN Show submission (best aligned with PT mornings)
3. **Day 1 PT 00:01**: Product Hunt
4. **Day 1 09:00 PT**: Twitter / X thread
5. **Day 2 北京时间 21:00**: V2EX + 知乎专栏 双发

## What to record before launch

- 4-host demo GIF (`docs/recording.md` → `assets/demo.gif`)
- One screenshot per Product Hunt gallery slot (5 total)
- 30-second screen recording of `bridgent inspect ./server.ts` for Twitter

## Anti-patterns

- ❌ Asking friends to upvote on HN (auto de-rank)
- ❌ Cross-posting the same link to 5 V2EX nodes within an hour (gets flagged)
- ❌ Only English: half the data sample for "先发优势" was Chinese — V2EX + 知乎 covers it
- ❌ No follow-ups: the first 60 minutes of replies decide each channel's algo signal

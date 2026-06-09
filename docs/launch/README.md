# Launch playbook — Bridgent AI

Per-channel templates for the Bridgent AI v0.2.3 alpha launch. These are release
drafts for use after `@bridgent/source-prisma@0.2.3` has been published to npm.

| Channel | Language | File | Best window |
|---|---|---|---|
| [Hacker News (Show HN)](./hn.md) | EN | `hn.md` | Tue–Thu 06:00–09:00 PT |
| [Product Hunt](./ph.md) | EN | `ph.md` | 00:01 PT, full-day window |
| [X / Twitter thread](./twitter.md) | EN | `twitter.md` | Weekday 09–11 or 18–20 PT |
| [X short posts](./x-short.md) | EN | `x-short.md` | Weekday 09–11 or 18–20 PT |
| [V2EX](./v2ex.md) | 中文 | `v2ex.md` | Weekday 10–12 / 20–22 北京时间 |
| [知乎](./zhihu.md) | 中文 | `zhihu.md` | 周末晚 / 工作日 21:00 后 |
| [掘金](./juejin.md) | 中文 | `juejin.md` | 工作日 10:00–11:30 / 20:00–22:00 |
| [小红书](./xiaohongshu.md) | 中文 | `xiaohongshu.md` | 工作日 12:00–13:30 / 20:00–23:00 |
| [微博短文](./weibo-short.md) | 中文 | `weibo-short.md` | 工作日 11:30–13:00 / 18:00–20:00 |
| [微博头条文章](./weibo-article.md) | 中文 | `weibo-article.md` | 工作日 19:00–22:00 |
| [微信朋友圈](./wechat-moments.md) | 中文 | `wechat-moments.md` | 工作日 11:30–13:00 / 20:00–22:30 |

## Sequence

1. **Day 0**: ship release on npm (see `docs/release-checklist.md`)
2. **Day 0 evening**: HN Show submission (best aligned with PT mornings)
3. **Day 1 PT 00:01**: Product Hunt
4. **Day 1 09:00 PT**: Twitter / X thread + one short X post
5. **Day 2 北京时间 20:00**: V2EX + 知乎专栏
6. **Day 3 北京时间 20:00**: 掘金 + 微博头条文章
7. **Day 4 北京时间 12:00 / 20:00**: 小红书 + 短微博 + 微信朋友圈

## What to record before launch

- 4-host demo GIF (`docs/recording.md` → `assets/demo.gif`)
- One screenshot per Product Hunt gallery slot (5 total)
- 30-second screen recording of `bridgent inspect ./server.ts` for Twitter
- One square logo/architecture image for 小红书、微博、朋友圈

## Anti-patterns

- ❌ Asking friends to upvote on HN (auto de-rank)
- ❌ Cross-posting the same link to 5 V2EX nodes within an hour (gets flagged)
- ❌ Only English: half the data sample for "先发优势" was Chinese — V2EX、知乎、掘金、小红书、微博、朋友圈 cover it
- ❌ No follow-ups: the first 60 minutes of replies decide each channel's algo signal

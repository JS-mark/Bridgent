# Bridgent Plan 6 — Bridgent AI 品牌 + changesets 发布流 + 发布渠道文案

## Context

Plan 1-5 已经把 Bridgent **跑通**：3 source（Zod / OpenAPI / Prisma 只读）+ 3 transport（stdio / Streamable HTTP / Web Standard）+ 跨 4 宿主可消费。所有功能 22/22 turbo tasks 全绿。

但仓库**未发布**：

- npm 上没有 `bridgent` / `@bridgent/*` 任何包
- README 是个 alpha 标识，没有发布渠道文案
- 没有 changesets 的版本/changelog 自动化
- 品牌仍是裸「Bridgent」，定位"AI agent 工具"时辨识度不够

Plan 6 把项目从「跑得通」推到「能被发现 + 能被安装」最后一公里：

1. **品牌升级** Bridgent → **Bridgent AI**（仅显示名，npm 名不动）
2. **changesets** + GitHub Release workflow
3. **发布前 checklist** + GitHub release notes 模板
4. **4 个发布渠道的文案模板**（HN / PH / Twitter / V2EX+知乎）

> 2026-06-09 update: the original linked-version release decision below is historical.
> ADR-032 removed changesets `linked` so package versions now follow the package that
> actually changed. The Prisma hardening release shipped as
> `@bridgent/source-prisma@0.2.3` only.

原计划完成后 maintainer 只需：写 changeset → push → GitHub Action 自动开 Version PR → merge 后自动 publish + 创建 release，再按 `docs/launch/` 模板贴 4 个渠道。实际发布流后续改为 maintainer 本地手动 `pnpm changeset publish`。**真录 demo GIF** 仍是 user 手工，本 plan 不做。

## 范围

| 模块 | 做什么 | 不做什么 |
|---|---|---|
| 品牌 | README hero / VitePress title / 文档站 description / 关键 marketing 文案改 "Bridgent AI"；npm 包名不动 | 改 GitHub 仓库名、改 import 名、改 CLI binary 名 |
| changesets | `@changesets/cli@^2.31` + `@changesets/changelog-github@^0.7` 配置；当时计划 publishable 包 `linked` 同步版本，后续已由 ADR-032 改为按包独立版本 | beta channel；snapshot release（v0.5+ 再做） |
| Release workflow | 原计划 `.github/workflows/release.yml` 跑 `changesets/action`，PR 模式生成 Version PR → 合入后 publish；实际发布流后续改为本地手动 publish | 双 npm registry 发布；GitHub Packages |
| Checklist + Release notes | `docs/release-checklist.md` + `.github/RELEASE_TEMPLATE.md` | 中英双语两份；中文社区版渠道文案另算 |
| 发布渠道文案 | `docs/launch/{hn,ph,twitter,v2ex,zhihu}.md` | 真投递；图片素材 |
| ADRs | ADR-024 ~ ADR-026 | — |

**显式不做**：
- 改 GitHub 仓库名（`js-mark/bridgent` 维持；改名会断已有外链）
- 改 npm 包名（已经在 README/example/host docs 里深度使用 `bridgent`/`@bridgent/*`，改名是无收益的 breaking change）
- 改 CLI binary 名（`bridgent` 命令保持）
- 抢注 `bridgent.ai` 域名（user 自己做；plan 仅在文档里把 placeholder 切到 `bridgent.ai`）
- 真录 demo GIF（沙箱不能跑 GUI 宿主；`docs/recording.md` 已有配方）
- 真投递 awesome-* PR / 真发 HN / PH（user 手工）

## 关键技术决策（已锁定）

1. **「Bridgent AI」是品牌显示名，不是包名**：所有 `bridgent` / `@bridgent/*` 不变；改的只是 README hero / VitePress title + description / docs 顶页 / launch 文案这几处面向人的地方
2. **changesets 模式**：`baseBranch: main`，`access: public`，`changelog: ['@changesets/changelog-github', { repo: 'js-mark/bridgent' }]`，private 包（host-test / docs / examples）跳过；workspace 内部协议 `workspace:*` 在发布时由 changesets 自动 swap 成具体版本
3. **首发版本**：所有 publishable 包从 `0.0.1` → **`0.1.0`**（首次有意义的对外 release，alpha 阶段）；同步起步 changeset 内容描述四个 source + 三个 transport
4. **`linked` 同步版本**：历史决策。4 个 publishable 包当时用 `linked`，alpha 阶段保持版本号同步（用户不需要记多个版本组合）；该决策已被 ADR-032 取代
5. **Release workflow** 标准 `changesets/action@v1`；`NPM_TOKEN` + `GITHUB_TOKEN` secret 由 user 后续手配
6. **发布渠道文案中英双语**：HN / PH / Twitter 英文（国际市场为主），V2EX / 知乎 中文（数据采样里中文社区命中度高）
7. **域名**：文档统一从 `bridgent.dev` 切到 `bridgent.ai`（仅 placeholder，user 自抢）
8. **publishable 包清单（4 个）**：`bridgent`（CLI）、`@bridgent/core`、`@bridgent/source-openapi`、`@bridgent/source-prisma`；`@bridgent/host-test` / `@bridgent/docs` / `@bridgent-examples/*` 都是 private

## 仓库新增 / 修改

```
.changeset/
├── config.json                              # NEW: changesets 配置
├── README.md                                # NEW: 解释 changeset 用法
└── inaugural-release.md                     # NEW: 0.1.0 首发 changeset

.github/
├── workflows/release.yml                    # NEW: changesets/action workflow
└── RELEASE_TEMPLATE.md                      # NEW: GitHub release notes 模板

docs/
├── release-checklist.md                     # NEW: 发布前 checklist
├── launch/
│   ├── hn.md                                # NEW: Show HN 英文
│   ├── ph.md                                # NEW: Product Hunt 英文
│   ├── twitter.md                           # NEW: X thread 英文
│   ├── v2ex.md                              # NEW: V2EX 中文
│   └── zhihu.md                             # NEW: 知乎 中文
├── decisions.md                             # MOD: ADR-024 ~ ADR-026
├── progress.md                              # MOD: Plan 6 章节
└── plans/2026-06-06-plan-6-launch.md        # 归档

# 改 hero / title 的文件（仅显示名，不动 import / npm name）：
README.md
apps/docs/.vitepress/config.ts
apps/docs/index.md
apps/docs/guide/what-is-bridgent.md
package.json                                 # description / homepage
packages/core/package.json                   # description / homepage / repository / bugs / keywords
packages/cli/package.json
packages/source-openapi/package.json
packages/source-prisma/package.json
```

## changesets 配置草稿

### `.changeset/config.json`

Current config uses independent package versions (`linked: []`); the original linked
sketch was superseded by ADR-032.

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "js-mark/bridgent" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@bridgent/host-test", "@bridgent/docs", "@bridgent-examples/*"]
}
```

### `.changeset/inaugural-release.md`

```md
---
"bridgent": minor
"@bridgent/core": minor
"@bridgent/source-openapi": minor
"@bridgent/source-prisma": minor
---

First public alpha. Three sources (Zod / OpenAPI / Prisma read-only),
three transports (stdio / Streamable HTTP / Web Standard fetch),
verified against any MCP 1.x compliant client via the protocol-level
host-test harness.
```

### `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write

concurrency:
  group: release-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }

      - uses: pnpm/action-setup@v4
        with: { version: 10 }

      - uses: actions/setup-node@v5
        with:
          node-version: '24'
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install --frozen-lockfile

      - run: pnpm turbo run build

      - name: Create release PR or publish
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          version: pnpm changeset version
          commit: 'chore(release): version packages'
          title: 'chore(release): version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 发布渠道文案要点

每篇 ~150-300 字。结构：

1. 一句话定位（hero）
2. 痛点 + Bridgent 怎么解（3 行）
3. 30 秒可复制粘贴的代码块（Quick start）
4. 链接（GitHub / docs）
5. 给读者的 ask（star / try / 反馈）

英文 3 篇（HN / PH / Twitter）侧重国际开发者视角；中文 2 篇（V2EX / 知乎）侧重国内 AI Agent / Claude Code 生态。

## 实施顺序

1. **品牌改名（先做，因为之后 changeset 文案要带新品牌）**
   - `package.json` 顶层 `description` / `homepage`
   - 4 个 publishable 包的 `description` / `keywords` / `homepage` / `repository` / `bugs`
   - README hero
   - `apps/docs/.vitepress/config.ts` title / description
   - `apps/docs/index.md` hero name
   - `apps/docs/guide/what-is-bridgent.md` 首段
2. **changesets**
   - `pnpm add -wD @changesets/cli @changesets/changelog-github`
   - `.changeset/config.json` + `.changeset/README.md` + `.changeset/inaugural-release.md`
3. **Release workflow**：`.github/workflows/release.yml`
4. **Checklist + release notes 模板**
5. **发布渠道文案** × 5（hn.md / ph.md / twitter.md / v2ex.md / zhihu.md）
6. **ADR-024 ~ ADR-026** + progress.md Plan 6 章节
7. **plan 文件归档**
8. **端到端验证**

## 验证（端到端）

按顺序跑、全部为绿才算 Plan 6 完成：

1. `pnpm install` 不报错（catalog 不变；root devDeps 增 changesets）
2. `pnpm changeset status` → 显示 1 个 pending changeset 影响 4 包
3. `pnpm turbo run lint typecheck test build` → 22/22 packages 全绿（不应被改名影响）
4. **VitePress 看新 title**：`pnpm docs:dev`，浏览器标签栏应显示 "Bridgent AI"
5. README hero 视觉检查（"Bridgent AI" + 4 hosts 链接 + demo GIF placeholder）
6. **launch 文案 lint**：5 篇都 `pnpm exec eslint docs/launch/**/*.md` 通过
7. release.yml 文件存在 + YAML 合法（actionlint 如果装了）

## 风险与待实测项

| # | 项 | 验证方法 |
|---|---|---|
| R1 | `@changesets/cli@2.31` + pnpm catalog 协议兼容 | `pnpm changeset status` 实测 |
| R2 | 历史项:`linked` 让 4 包同步版本是否影响 `workspace:*` 协议 swap | 后续 ADR-032 已移除 `linked` |
| R3 | `changesets/action@v1` 当前稳定性 | 按官方 README 配置；workflow 文件本身不真跑 |
| R4 | `NPM_TOKEN` vs OIDC `id-token: write` 路径选 | checklist 写"二选一"，user 决策 |
| R5 | `bridgent.ai` 域名是否可注册 | user 验证；plan 仅 placeholder |

## ADR 增补

- **ADR-024** Bridgent → Bridgent AI 仅品牌显示名升级，npm 包名不变（避免无意义 breaking change）
- **ADR-025** changesets `linked` 模式让 4 个 publishable 包同步版本号，alpha 阶段保持简单；后续已被 ADR-032 取代
- **ADR-026** 发布渠道文案中英双语并行（HN/PH/Twitter 英文，V2EX/知乎中文），与"先发优势"数据采样里中文社区命中度匹配

## 后续 plan 预告（不在本次范围）

- **Plan 7+**：自写 Bridgent Inspector（差异化 web UI）+ source-prisma v0.2（写操作 + audit log）
- **Plan 8+**：source-drizzle / source-trpc / source-graphql
- **Plan 9+**：Cloud 版（托管 Bridgent + OAuth 中转）+ 私有 registry

## Critical Files

- `/Users/mark/myself/code/Bridgent/.changeset/config.json`
- `/Users/mark/myself/code/Bridgent/.changeset/README.md`
- `/Users/mark/myself/code/Bridgent/.changeset/inaugural-release.md`
- `/Users/mark/myself/code/Bridgent/.github/workflows/release.yml`
- `/Users/mark/myself/code/Bridgent/.github/RELEASE_TEMPLATE.md`
- `/Users/mark/myself/code/Bridgent/docs/release-checklist.md`
- `/Users/mark/myself/code/Bridgent/docs/launch/{hn,ph,twitter,v2ex,zhihu}.md`
- `/Users/mark/myself/code/Bridgent/README.md`
- `/Users/mark/myself/code/Bridgent/package.json`
- `/Users/mark/myself/code/Bridgent/packages/core/package.json`
- `/Users/mark/myself/code/Bridgent/packages/cli/package.json`
- `/Users/mark/myself/code/Bridgent/packages/source-openapi/package.json`
- `/Users/mark/myself/code/Bridgent/packages/source-prisma/package.json`
- `/Users/mark/myself/code/Bridgent/apps/docs/.vitepress/config.ts`
- `/Users/mark/myself/code/Bridgent/apps/docs/index.md`
- `/Users/mark/myself/code/Bridgent/apps/docs/guide/what-is-bridgent.md`
- `/Users/mark/myself/code/Bridgent/docs/decisions.md`
- `/Users/mark/myself/code/Bridgent/docs/progress.md`

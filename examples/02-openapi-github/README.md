# 02-openapi-github

用 Bridgent 把 GitHub REST API 的只读子集（`/repos/{owner}/{repo}/issues|pulls|releases`）暴露为 MCP server。

## Setup

1. 生成一个 GitHub personal access token（classic 或 fine-grained 都行；只需 `repo` read 权限）
   <https://github.com/settings/tokens>
2. 复制 `.env.example` 为 `.env` 并填入 `GITHUB_TOKEN`，或直接 export

## Run

```bash
GITHUB_TOKEN=ghp_xxx pnpm --filter @bridgent-examples/02-openapi-github start
```

## 预期

- `tools/list` 应只看到 `gh_*` 前缀且全是 issues / pulls / releases 路径下的 GET 操作
- `tools/call gh_issues_list_for_repo { owner: "cli", repo: "cli" }` 真实返回 GitHub 返回的 issue 列表

## 想加写操作？

`server.ts` 加一行 `allow: { mutating: true }` 即可暴露 POST / PATCH / DELETE。**注意：让 LLM 直接 `delete repo` 是极易出事的姿势**——更安全的做法是 `allowOperations: ['issuesCreate', 'issuesUpdate']` 精确白名单。

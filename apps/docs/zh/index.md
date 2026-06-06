---
layout: home

hero:
  name: Bridgent AI
  text: 一行命令把任意 API 暴露为 MCP
  tagline: 把你已有的 OpenAPI / Prisma / Drizzle / tRPC / Zod 转换为生产可用的 Model Context Protocol 服务器 —— 在 Claude Code、Codex、Cursor 与 Gemini CLI 中即刻可用。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 什么是 Bridgent AI?
      link: /guide/what-is-bridgent
    - theme: alt
      text: GitHub
      link: https://github.com/js-mark/bridgent

features:
  - title: 一行命令,任意数据源
    details: OpenAPI 3.1、Prisma、Drizzle、tRPC、GraphQL,或手写 Zod 工具 —— Bridgent AI 把它们统一成同一套 MCP 接口。
  - title: stdio + HTTP
    details: 同一份服务,两种传输。本地跑给 IDE Agent,或通过 SSE 暴露用于托管场景。
  - title: 跨宿主设计
    details: 在 Claude Code、Codex、Cursor、Gemini CLI 上构建并验证。只要对方说 MCP,Bridgent AI 就能工作。
  - title: 默认安全
    details: 只读模式、行数限制、查询超时与策略 DSL,即便 Agent 走样也能保护你的数据层。
---

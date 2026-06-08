# 品牌资产

Bridgent AI 的 logo 系统表达的是:已有 API、数据库、代码流入协议网关,再输出为 MCP-ready server streams。

## Logo Lockup

Lockup 适合文档页头、README、发布物料,以及需要直接显示产品名的场景。

<div class="logo-grid">
  <figure class="logo-surface logo-light">
    <img src="/bridgent-logo-lockup.svg" alt="浅色背景上的 Bridgent AI logo lockup">
    <figcaption>浅色背景</figcaption>
  </figure>
  <figure class="logo-surface logo-dark">
    <img src="/bridgent-logo-lockup.svg" alt="深色背景上的 Bridgent AI logo lockup">
    <figcaption>深色背景</figcaption>
  </figure>
</div>

## Icon / Mark

当周围已经有品牌上下文时使用 mark,例如 GitHub 组织头像、社媒预览或图表图例。

<div class="logo-grid">
  <figure class="logo-surface logo-light">
    <img class="logo-mark" src="/bridgent-logo-mark.svg" alt="浅色背景上的 Bridgent AI mark">
    <figcaption>输入源 → 网关 → MCP 输出流</figcaption>
  </figure>
  <figure class="logo-surface logo-dark">
    <img class="logo-mark" src="/bridgent-logo-mark.svg" alt="深色背景上的 Bridgent AI mark">
    <figcaption>通过 CSS media query 适配深色</figcaption>
  </figure>
</div>

## Favicon / Small Size

小尺寸资产去掉了详细的数据源图标,保留中央 gateway 与左右短线/圆点。

<div class="favicon-row">
  <figure class="favicon-surface logo-light">
    <img src="/bridgent-logo-favicon.svg" alt="大尺寸预览的 Bridgent AI favicon">
    <figcaption>预览</figcaption>
  </figure>
  <figure class="favicon-small logo-light">
    <img src="/bridgent-logo-favicon.svg" alt="32px Bridgent AI favicon">
    <figcaption>32px</figcaption>
  </figure>
  <figure class="favicon-small logo-dark">
    <img src="/bridgent-logo-favicon.svg" alt="深色背景上的 32px Bridgent AI favicon">
    <figcaption>32px dark</figcaption>
  </figure>
</div>

## 文件

| 资产 | 用途 |
|---|---|
| [`bridgent-logo-lockup.svg`](/bridgent-logo-lockup.svg) | 产品名 + mark |
| [`bridgent-logo-mark.svg`](/bridgent-logo-mark.svg) | 独立 icon / mark |
| [`bridgent-logo-favicon.svg`](/bridgent-logo-favicon.svg) | 浏览器 favicon 与小尺寸 UI |

<style>
.logo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
  margin: 24px 0;
}

.logo-surface,
.favicon-surface,
.favicon-small {
  margin: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  display: grid;
  place-items: center;
  gap: 12px;
}

.logo-surface {
  min-height: 220px;
  padding: 28px;
}

.logo-light {
  background: #f8fafc;
  color: #0e1b27;
}

.logo-dark {
  background: #07111f;
  color: #f8fbff;
}

.logo-surface img {
  width: min(100%, 540px);
}

.logo-surface .logo-mark {
  width: min(100%, 360px);
}

.favicon-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 24px 0;
}

.favicon-surface {
  width: 180px;
  height: 180px;
}

.favicon-surface img {
  width: 116px;
  height: 116px;
}

.favicon-small {
  width: 100px;
  height: 100px;
}

.favicon-small img {
  width: 32px;
  height: 32px;
}

figcaption {
  color: currentColor;
  font-size: 13px;
  opacity: .72;
}
</style>

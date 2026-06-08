# Brand Assets

Bridgent AI's logo system represents existing APIs, databases, and code flowing into a protocol gateway, then out as MCP-ready server streams.

## Logo Lockup

Use the lockup for documentation headers, README surfaces, launch posts, and places where the product name must be visible.

<div class="logo-grid">
  <figure class="logo-surface logo-light">
    <img src="/bridgent-logo-lockup.svg" alt="Bridgent AI logo lockup on a light surface">
    <figcaption>Light surface</figcaption>
  </figure>
  <figure class="logo-surface logo-dark">
    <img src="/bridgent-logo-lockup.svg" alt="Bridgent AI logo lockup on a dark surface">
    <figcaption>Dark surface</figcaption>
  </figure>
</div>

## Icon / Mark

Use the mark when the brand already has surrounding context, such as GitHub organization images, social previews, or diagram legends.

<div class="logo-grid">
  <figure class="logo-surface logo-light">
    <img class="logo-mark" src="/bridgent-logo-mark.svg" alt="Bridgent AI mark on a light surface">
    <figcaption>Input sources → gateway → MCP streams</figcaption>
  </figure>
  <figure class="logo-surface logo-dark">
    <img class="logo-mark" src="/bridgent-logo-mark.svg" alt="Bridgent AI mark on a dark surface">
    <figcaption>Dark variant via CSS media query</figcaption>
  </figure>
</div>

## Favicon / Small Size

The small-size asset removes the detailed source icons and keeps the central gateway plus short input/output lines.

<div class="favicon-row">
  <figure class="favicon-surface logo-light">
    <img src="/bridgent-logo-favicon.svg" alt="Bridgent AI favicon at large preview size">
    <figcaption>Preview</figcaption>
  </figure>
  <figure class="favicon-small logo-light">
    <img src="/bridgent-logo-favicon.svg" alt="Bridgent AI favicon at 32 pixels">
    <figcaption>32px</figcaption>
  </figure>
  <figure class="favicon-small logo-dark">
    <img src="/bridgent-logo-favicon.svg" alt="Bridgent AI favicon at 32 pixels on dark surface">
    <figcaption>32px dark</figcaption>
  </figure>
</div>

## Files

| Asset | Use |
|---|---|
| [`bridgent-logo-lockup.svg`](/bridgent-logo-lockup.svg) | Product name + mark |
| [`bridgent-logo-mark.svg`](/bridgent-logo-mark.svg) | Standalone icon / mark |
| [`bridgent-logo-favicon.svg`](/bridgent-logo-favicon.svg) | Browser favicon and small-size UI |

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

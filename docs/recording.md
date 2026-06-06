# Recording the demo GIF

This is a hand-off note: the README's `assets/demo.gif` slot is intentionally a placeholder. The actual recording is a manual step we run before each release announcement.

## Story (~30 seconds)

Goal: convey "**one Bridgent server runs in 4 IDE-Agent hosts at once**".

1. Open a terminal split into 4 panes (tmux / iTerm / Wezterm)
2. Pane 1: `bridgent dev examples/01-zod-hello/server.ts` (stdio)
3. Panes 2-4: configured Claude Code / Cursor / Codex / Gemini CLI each calling the same `add(2,3)` and getting `5`
4. Hold for 1 sec, fade out

## Tooling

We recommend [`vhs`](https://github.com/charmbracelet/vhs) by Charm — terminal-only, scriptable, deterministic, outputs GIF directly.

```bash
brew install vhs
vhs docs/demo.tape   # would render assets/demo.gif
```

`docs/demo.tape` (TODO: author when we have signed-in hosts ready):

```tape
Output assets/demo.gif

Set FontSize 16
Set Width 1200
Set Height 600

Type "bridgent dev examples/01-zod-hello/server.ts"
Enter
Sleep 2s

# … script the four host interactions here
```

## Why not now?

- Recording requires real, signed-in IDE-agent hosts (Claude Code / Cursor / Codex / Gemini CLI). The maintainer has to be in front of those hosts.
- AI tooling (us) can't drive GUI clients to record meaningfully.
- We don't want a fake or staged GIF to ship in the README — wait for the real thing.

## Until then

The README links to `assets/demo.gif` as a placeholder. It will 404 until someone runs the recording script. That's fine — `404 image` doesn't break the page; it just shows alt text.

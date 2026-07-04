# AGENTS.md — Meridian brand rules for coding & design agents

Agents working on Meridian surfaces must stay on-brand. Load `meridian.tokens.json`
(or `meridian.tailwind.js`) and follow these rules.

## Color
- Primary action / brand: `#2348E0` (Cobalt). Text & dark surfaces: `#0E1116` (Ink). Cool surface: `#EEF1F5` (Mist).
- Use the brand and neutral scales from the tokens; do not invent hex values.
- Validate text/background pairs to WCAG 2.2 AA (4.5:1 body, 3:1 large/UI). Never encode meaning in color alone.

## Type
- Display/headings: Space Grotesk. Body: Inter. Code/data: Space Mono.
- Always ship metric-matched fallbacks (system stack + size-adjust) to avoid layout shift.
- Sentence case. Two weights in UI: 400 and 500/700 for headings.

## Logo
- Use approved variants only. Keep clear space = height of the symbol. Min size 24px screen / 8mm print.
- Never stretch, recolor, rotate, add shadows, or place on low-contrast backgrounds.

## Voice
- Write clear, confident, human. See `meridian-voice.md`. Avoid jargon and hype.

## Spacing & radius
- 8pt spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96). Radius: 6 / 10 / 16px.

## Before shipping
- Run accessibility checks, confirm tokens (no hard-coded values), and request brand review for net-new components.

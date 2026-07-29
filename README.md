# F1LEO — Field Notes

The source for [maaskk.github.io](https://maaskk.github.io): an offensive-security field journal backed by GitHub Pages.

## Publishing

The private publishing studio validates each note, commits it to `content/journal.json`, and triggers the Pages workflow. Active Hack The Box machines are automatically restricted to spoiler-safe field notes.

## Architecture

- `site/` — dependency-free static site generator and visual system
- `content/` — structured journal entries
- `studio/` — private GitHub-authenticated publishing service deployed separately
- `.github/workflows/pages.yml` — automatic public deployment

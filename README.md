# F1LEO Lab Notes

Source for [maaskk.github.io](https://maaskk.github.io).

## Publishing

The private publishing studio validates each note, commits it to `content/journal.json`, and triggers the Pages workflow. Active Hack The Box machines are automatically restricted to spoiler-safe field notes.

## Architecture

- `site/`: static site generator and styles
- `content/`: lab entries
- `studio/`: publishing service
- `.github/workflows/pages.yml`: GitHub Pages deployment

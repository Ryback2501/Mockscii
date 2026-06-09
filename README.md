# Mockscii

[![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Built with Claude Code](https://img.shields.io/badge/-Claude_Code-000000?logo=claude&logoColor=white)](https://claude.ai/code)
[![GitHub Release](https://img.shields.io/github/v/release/Ryback2501/Mockscii)](https://github.com/Ryback2501/Mockscii/releases/latest)
[![Build](https://img.shields.io/github/actions/workflow/status/Ryback2501/Mockscii/release.yml?label=release)](https://github.com/Ryback2501/Mockscii/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker Hub](https://img.shields.io/badge/docker-ryback2501%2Fmockscii-2496ED?logo=docker&logoColor=white)](https://hub.docker.com/r/ryback2501/mockscii)
[![Docker Pulls](https://img.shields.io/docker/pulls/ryback2501/mockscii?logo=docker&logoColor=white)](https://hub.docker.com/r/ryback2501/mockscii)
[![GitHub Stars](https://img.shields.io/github/stars/Ryback2501/Mockscii?style=flat&logo=github)](https://github.com/Ryback2501/Mockscii/stargazers)

A browser-based editor for designing **coloured terminal-app mockups**. Paint Unicode glyphs onto a character grid, colour them with foreground and background colours, and export or import your work as a JSON file. It runs entirely in your browser — no backend, no accounts, nothing leaves your machine.

> Vibe-coded with [Claude Code](https://claude.ai/code).

## Features

- Paint glyphs onto an auto-fitting character grid that renders like a real terminal
- A huge, categorised glyph library — ASCII, box-drawing, block elements, geometric shapes, arrows, braille and more — with foldable groups
- Foreground and background colours from a palette, plus a colour picker with a preset table and a full custom HSV editor (hue slider, saturation/value square, hex field, eyedropper)
- Drawing tools: draw, erase, flood fill, line, rectangle, and type-on-grid text
- Select cells to recolour, move, delete, or copy and paste
- Undo / redo and one-click clear
- Choose from many monospace fonts, each rendered at its natural size
- Export and Import your mockup as a JSON file — your work stays on your machine
- 100% client-side — nothing is uploaded and no account is needed

## Use it!

### Try it online

Just open **[ryback2501.github.io/Mockscii](https://ryback2501.github.io/Mockscii/)** — no install required.

### Docker

Pull and run the latest image:

```bash
docker run -d \
  --name mockscii \
  -p 8080:80 \
  --restart unless-stopped \
  ryback2501/mockscii:latest
```

The app runs at `http://localhost:8080`.

### Run from the source code

**Prerequisites:** [Node.js 20+](https://nodejs.org/).

1. Clone the repository:
   ```bash
   git clone https://github.com/Ryback2501/Mockscii.git
   cd Mockscii
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start it:
   ```bash
   npm run dev
   ```
   Then open the URL Vite prints (`http://localhost:5173/Mockscii/`).

To build a production bundle and preview it instead:

```bash
npm run build
npm run preview
```

## Contributing

Contributions and ideas are welcome. The repository is public — anyone can fork it and open a pull request.

If you have a suggestion, found a bug, or want to discuss a change before implementing it, [open an issue](https://github.com/Ryback2501/Mockscii/issues) — it's the best place to start.

To contribute code:

1. Fork the repository
2. Create a branch from `dev`: `git checkout -b feature/your-feature`
3. Make your changes and commit following [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a pull request targeting the `dev` branch

Please keep PRs focused — one feature or fix per PR.

## License

[MIT](LICENSE)

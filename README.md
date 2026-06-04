# Mockscii

A browser-based editor for designing colored **terminal-app mockups** — paint glyphs onto a character grid with foreground/background colors, then **Export**/**Import** your work as JSON. Runs entirely client-side on **GitHub Pages** (no backend, no stored user data).

> Live site: deployed to GitHub Pages from `main`.

## Development

```bash
npm install
npm run dev          # Vite dev server
npm run build        # production bundle -> dist/
npm run preview      # serve the built bundle
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e     # Playwright (builds + serves automatically)
```

Docker (production image, nginx serving the bundle):

```bash
docker build -t mockscii .
docker run -p 8080:80 mockscii   # http://localhost:8080/Mockscii/
```

## Branching & releases

- `main` = production, `dev` = integration; work happens on `feature/* | bug/* | chore/*` branches.
- Each change → branch from `dev` → PR into `dev` → CI (`lint, unit, integration, e2e, build, docker`) → squash-merge.
- Releases are cut `dev → main`, which tags the version, builds artifacts, publishes a GitHub Release, and pushes a Docker Hub image.

## License

MIT — see [LICENSE](LICENSE).

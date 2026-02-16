# Discdle

Wordle-style disc golf guessing game built with React + Vite.

## Local dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages deploy

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

Steps:
1. Push this repo to GitHub.
2. In GitHub, go to Settings -> Pages.
3. Under Build and deployment, set Source to GitHub Actions.
4. Push to `main` to trigger a deploy.

Notes:
- The workflow sets `VITE_BASE` to `/<repo>/` automatically.
- If your default branch is not `main`, update the workflow branch.

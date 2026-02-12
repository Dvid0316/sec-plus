# Security+ Study App

A React study app for CompTIA Security+ SY0-701 exam preparation. Study with flashcards, take practice quizzes, and filter content by exam domain.

## Features

- **Flashcards** – Flip through cards by domain or all at once
- **Quiz** – Multiple-choice practice questions with explanations
- **Study by Domain** – Home page cards linking to domain-specific study

Content is distributed across the five SY0-701 domains:
- Domain 1: General Security Concepts
- Domain 2: Threats, Vulnerabilities, and Mitigations
- Domain 3: Security Architecture
- Domain 4: Operations and Incident Response
- Domain 5: Governance, Risk, and Compliance

## Quick Start

```bash
npm install
npm run dev
```

`npm run dev` runs the flashcard and question generators, then starts Vite. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output goes to the `dist/` folder.

## Data & Input

Place **`SECPLUS_COMPLETE_STUDY_DATA.json`** in the repo root. The generators read from it by default.

Supported input schemas:
- **Array** – `[{ front, back, tags }]` — the generator normalizes each card and assigns a domain.
- **Domains object** – `{ domains: [{ name, sections: [{ name, bullets }] }] }` — legacy format also supported.

## Regenerating Content

### From a different input file

```bash
# Flashcards
node scripts/generateFlashcards.mjs --in path/to/my-data.json

# Questions (uses flashcards.generated.json by default)
node scripts/generateQuestionsFromFlashcards.mjs --in src/data/flashcards.generated.json --out src/data/questions.generated.json
```

### Full regeneration flow

```bash
npm run gen:flashcards    # → src/data/flashcards.generated.json (~300 cards)
npm run gen:questions    # → src/data/questions.generated.json (~295 MCQs)
```

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run `gen:flashcards` + `gen:questions`, then start Vite |
| `npm run build` | Run `gen:flashcards` + `gen:questions`, then build for production |
| `npm run gen:flashcards` | Generate flashcards from study data |
| `npm run gen:questions` | Generate MCQs from flashcards |
| `npm run gen:concepts` | Generate concept dictionary |

## Generated Files

| File | Source | Notes |
|------|--------|------|
| `src/data/flashcards.generated.json` | `gen:flashcards` | ~300 cards, stratified by SY0-701 domain weights |
| `src/data/questions.generated.json` | `gen:questions` | ~295 MCQs (depends on stratification and dedupe) |

These files are gitignored and recreated on each `dev` or `build`.

## Tech Stack

- React 19 + Vite
- React Router
- Tailwind CSS
- Lucide React (icons)

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

## Adding New Flashcards/Questions

To merge a new JSON file into your existing study data (new items at the top):

```bash
# 1. Place your new JSON file somewhere (e.g. repo root or a folder)
# 2. Run the merge (output overwrites SECPLUS_COMPLETE_STUDY_DATA.json by default)
node scripts/mergeStudyData.mjs --new path/to/your-new-cards.json

# 3. Regenerate flashcards and questions
npm run gen:flashcards
npm run gen:questions
```

**Options:**
- `--new` (required) – Path to the new JSON file
- `--out` – Output file (default: `SECPLUS_COMPLETE_STUDY_DATA.json`)
- `--existing` – Current file to merge with (default: `SECPLUS_COMPLETE_STUDY_DATA.json`)
- `--no-dedupe` – Keep exact duplicates (default: dedupes by front+back)

**New file format:** Array `[{ front, back, tags }]` or `{ cards: [...] }` or `{ flashcards: [...] }`. Fields can be `front`/`back` or `question`/`answer`.

If the new file also has `practice_questions` (`{ "Domain 1": [{ question, options: {A,B,C,D}, correct, explanation }], ... }`), they are extracted to `src/data/practice_questions.static.json` and combined with generated quiz questions.

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
| `npm run merge:data -- --new <file>` | Merge new cards into existing study data |

## Generated Files

| File | Source | Notes |
|------|--------|------|
| `src/data/flashcards.generated.json` | `gen:flashcards` | ~300 cards, stratified by SY0-701 domain weights |
| `src/data/questions.generated.json` | `gen:questions` | ~295 MCQs (depends on stratification and dedupe) |
| `src/data/practice_questions.static.json` | `merge:data` (when source has `practice_questions`) | Curated scenario/multiple-choice from study materials |

Static practice questions are merged with generated MCQs in the Quiz.

## Tech Stack

- React 19 + Vite
- React Router
- Tailwind CSS
- Lucide React (icons)

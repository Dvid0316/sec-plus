# Security+ Study App - Cursor Build Instructions

## 🎯 Project Goal
Build a full-stack Security+ study application that DERIVES flashcards and quizzes from structured source notes (SECPLUS_COMPLETE_STUDY_DATA.json) containing:
- - Structured Security+ domain and section content
- Bullet-level key concepts derived from Professor Messer notes
- Flashcards and practice questions should be generated from this content
- 193 sections with 670 key concepts
- Complete Professor Messer SY0-701 course content
IMPORTANT:
The JSON file does NOT contain pre-built flashcards or quiz questions.
It contains structured source material (domains, sections, bullet points).

You must:
- Generate flashcards by converting bullet points into Q/A pairs
- Generate quiz questions from section concepts
- Assign domain and section metadata to all generated items
- Keep generation deterministic and consistent

## 📊 Data Structure

The `SECPLUS_COMPLETE_STUDY_DATA.json` file contains:

```json
{
  "metadata": {
    "source": "Professor Messer SY0-701 Security+ Course Notes",
    "exam": "CompTIA Security+ SY0-701"
  },
  "domains": [
    {
      "domain_num": "1",
      "name": "General Security Concepts",
      "sections": [
        {
          "section_num": "1.1",
          "name": "Security Controls",
          "bullets": ["key concept 1", "key concept 2", ...],
          "content_preview": "..."
        }
      ]
    }
  ],
  "flashcards": [
    {
      "id": 1,
      "domain": "1",
      "domain_name": "General Security Concepts",
      "section": "1.1",
      "question": "What is X?",
      "answer": "...",
      "topic": "...",
      "type": "definition|concept",
      "difficulty": "easy|medium|hard"
    }
  ],
  "practice_questions": [
    {
      "id": 1,
      "domain": "1",
      "domain_name": "...",
      "question": "Which of the following...?",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "correct_answer": "A",
      "explanation": "...",
      "difficulty": "medium"
    }
  ],
  "stats": {
    "total_flashcards": 363,
    "total_questions": 67,
    "by_domain": [...]
  }
}
```

## 🛠️ Tech Stack Recommendation

### Option 1: Fast & Simple (Recommended for MVP)
**Frontend:** React + Vite + Tailwind CSS
**State:** Local state (useState/useContext)
**Storage:** LocalStorage for progress tracking
**Deployment:** Vercel/Netlify (free tier)

**Why:** Quick to build, no backend needed, works offline, fast deployment

### Option 2: Full-Featured
**Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind  
**Backend:** Next.js API routes OR Supabase
**Database:** Supabase (PostgreSQL) for user accounts & progress
**Auth:** Supabase Auth OR Clerk
**Deployment:** Vercel

**Why:** User accounts, cloud sync, analytics, scalable

## 🎨 Core Features (MVP - Phase 1)

### 1. Home Dashboard
- **Display:** Total cards, total questions, progress by domain
- **Quick Actions:** Start flashcards, Take quiz, Browse by domain
- **Progress Visualization:** Circular progress charts for each domain

### 2. Flashcard Mode
- **Features:**
  - Click to flip card (question → answer)
  - "Know it" / "Review again" buttons
  - Keyboard shortcuts (Space = flip, 1 = know, 2 = review)
  - Progress bar (X/363 cards)
  - Filter by domain
  - Shuffle option
  
- **Spaced Repetition (Simple):**
  - Track which cards marked "Review again"
  - Show those cards more frequently
  - Store in localStorage: `{ cardId: { lastSeen: timestamp, reviewCount: number } }`

### 3. Quiz Mode
- **Features:**
  - Multiple choice questions
  - Track score (correct/total)
  - Immediate feedback (correct/incorrect)
  - Show explanation after answer
  - Filter by domain
  - Timed mode option (90 seconds per question like real exam)
  
### 4. Study by Domain
- **Browse view:** List all 5 domains
- **Click domain:** See all sections
- **Click section:** View key concepts (bullets)
- **Accordion style** for easy navigation

### 5. Progress Tracking
- **Store in localStorage:**
  ```js
  {
    flashcards: {
      seen: [1, 2, 3, ...],
      mastered: [1, 5, 10, ...],
      needsReview: [2, 7, 15, ...]
    },
    quizzes: {
      totalAttempts: 50,
      totalCorrect: 38,
      byDomain: { "1": { correct: 5, total: 8 }, ... }
    },
    lastStudied: "2025-02-11T18:00:00Z"
  }
  ```

## 🎯 UI/UX Guidelines

### Design Principles
- **Clean & Minimal:** Focus on content, not decoration
- **ADHD-Friendly:** 
  - Clear visual hierarchy
  - Immediate feedback
  - Progress indicators everywhere
  - No overwhelming walls of text
  - Dark mode option
  
### Color Scheme
- **Primary:** Blue (#3B82F6) for trust/learning
- **Success:** Green (#10B981) for correct answers
- **Warning:** Yellow (#F59E0B) for review needed
- **Error:** Red (#EF4444) for incorrect
- **Dark Mode:** True black background (#000000) with high contrast

### Animations
- **Card Flips:** 3D flip animation (CSS transform)
- **Progress:** Smooth transitions on counters
- **Feedback:** Subtle pulse on correct/incorrect
- **Keep it subtle** - no distracting animations

## 📱 Responsive Design
- **Mobile-first:** Most study happens on phones
- **Breakpoints:**
  - Mobile: < 640px (full screen cards)
  - Tablet: 640-1024px (2 column layout)
  - Desktop: > 1024px (3 column dashboard)

## 🚀 Implementation Steps for Cursor

### Step 1: Project Setup
```bash
# Create React + Vite project
npm create vite@latest secplus-study-app -- --template react
cd secplus-study-app
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom lucide-react
```

### Step 2: File Structure
```
src/
├── data/
│   └── secplus_data.json          # Your complete study data
├── components/
│   ├── FlashCard.jsx              # Single flashcard component
│   ├── QuizQuestion.jsx           # Quiz question component
│   ├── ProgressBar.jsx            # Progress indicator
│   ├── DomainCard.jsx             # Domain summary card
│   └── Navigation.jsx             # Nav bar
├── pages/
│   ├── Home.jsx                   # Dashboard
│   ├── Flashcards.jsx             # Flashcard mode
│   ├── Quiz.jsx                   # Quiz mode
│   └── Browse.jsx                 # Browse by domain
├── hooks/
│   ├── useProgress.js             # Progress tracking hook
│   ├── useFlashcards.js           # Flashcard logic
│   └── useQuiz.js                 # Quiz logic
├── utils/
│   ├── storage.js                 # localStorage wrapper
│   └── shuffle.js                 # Array shuffle utility
└── App.jsx                        # Main app with routing
```

### Step 3: Core Components

#### FlashCard Component
```jsx
// Features needed:
// - Flip animation on click
// - Show question on front, answer on back
// - "Know it" / "Review" buttons on back
// - Keyboard support (Space to flip)
// - Track which side is showing
```

#### QuizQuestion Component
```jsx
// Features needed:
// - Display question with 4 options
// - Highlight selected option
// - Show correct/incorrect after selection
// - Display explanation
// - Disable selection after answer
// - Next question button
```

#### Progress Hook
```js
// Manage:
// - Load progress from localStorage
// - Update progress (cards seen, mastered, etc.)
// - Calculate stats (% complete, weak domains)
// - Auto-save on changes
```

### Step 4: Pages

#### Home Page (Dashboard)
- Hero section with total progress
- 5 domain cards showing individual progress
- Quick action buttons (Study Now, Take Quiz)
- Recent activity / streak tracker

#### Flashcards Page
- Filter by domain (dropdown)
- Shuffle toggle
- Card display with flip
- Progress: "Card 15/363"
- Session stats at end

#### Quiz Page  
- Domain selector
- Question counter
- Timer (optional)
- Score display
- Review wrong answers at end

## 🎯 Cursor Prompt (Copy This)

```
I want you to build a Security+ study application using React + Vite + Tailwind CSS.

I have a JSON file (SECPLUS_COMPLETE_STUDY_DATA.json) with:
- 363 flashcards
- 67 practice questions  
- 5 Security+ domains with full content

Build a web app with these features:

1. HOME PAGE
   - Dashboard showing progress by domain
   - Quick actions: Study Flashcards, Take Quiz
   - Progress visualization

2. FLASHCARD MODE
   - Click to flip cards (question → answer)
   - "Know it" / "Review again" buttons
   - Filter by domain, shuffle option
   - Track progress in localStorage
   - Keyboard shortcuts (Space = flip)

3. QUIZ MODE
   - Multiple choice questions
   - Immediate feedback (correct/incorrect)
   - Show explanations
   - Track score
   - Filter by domain

4. BROWSE MODE
   - List all 5 domains
   - Click to see sections and key concepts
   - Accordion-style navigation

5. PROGRESS TRACKING
   - Store in localStorage: cards seen, mastered, quiz scores
   - Display stats on dashboard
   - Calculate % complete per domain

DESIGN REQUIREMENTS:
- Clean, minimal UI
- ADHD-friendly (clear hierarchy, immediate feedback, progress everywhere)
- Dark mode option
- Mobile-first responsive
- 3D flip animation for cards
- Blue primary color (#3B82F6)
- Use lucide-react for icons

TECH STACK:
- React 18 + Vite
- Tailwind CSS
- React Router for navigation
- localStorage for persistence
- No backend needed (static site)

FILE STRUCTURE:
- src/data/secplus_data.json (the data file)
- src/components/ (FlashCard, QuizQuestion, etc.)
- src/pages/ (Home, Flashcards, Quiz, Browse)
- src/hooks/ (useProgress, useFlashcards, useQuiz)
- src/utils/ (storage helpers)

Start with:
1. Project setup (Vite + React + Tailwind + Router)
2. Create basic layout and navigation
3. Build Home dashboard
4. Implement Flashcard mode
5. Implement Quiz mode

Make it fast, clean, and optimized for studying. This is for Security+ exam prep.
```

## 🔥 Advanced Features (Phase 2)

After MVP is working, add:

### Spaced Repetition Algorithm
- Implement SM-2 or Leitner system
- Cards appear based on: mastery level, time since last review
- Auto-schedule review sessions

### Analytics Dashboard
- Study time tracking
- Weak areas identification  
- Performance trends over time
- Predicted exam readiness score

### Study Sessions
- Timed study blocks (25 min Pomodoro)
- Mixed mode (flashcards + quiz)
- Daily goals / streaks

### Export / Share
- Export progress as PDF report
- Share quiz results
- Print flashcards

### Collaboration (if adding backend)
- User accounts
- Cloud sync across devices
- Leaderboards
- Study groups

## 💾 Data Loading

```js
// In your app:
import studyData from './data/secplus_data.json';

const { domains } = studyData;
// flashcards and questions are derived at runtime


// All data available in structured format
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
# 1. Push to GitHub
# 2. Import in Vercel dashboard
# 3. Auto-deploys on push
# Free tier = perfect for this
```

### Netlify
```bash
npm run build
# Drag & drop 'dist' folder to Netlify
# Or connect to GitHub for auto-deploy
```

## 📈 Success Metrics

**MVP is complete when:**
- ✅ Can study all 363 flashcards
- ✅ Can take quizzes with 67 questions
- ✅ Progress persists in localStorage
- ✅ Works on mobile
- ✅ Dark mode toggle
- ✅ Filter by domain works
- ✅ Deployed and accessible via URL

**You've built something awesome when:**
- People actually use it to study
- You pass Security+ using it
- You add it to your portfolio
- It becomes a template for other cert exams

---

## 🎮 Ready to Build?

1. Copy the "Cursor Prompt" section above
2. Open Cursor
3. Create new project folder
4. Drop in `SECPLUS_COMPLETE_STUDY_DATA.json`
5. Open Cursor Composer (Cmd/Ctrl + I)
6. Paste the prompt
7. Watch it build your app

**LET'S FUCKING GO!** 🚀

---

*Built with vibe coding energy and ADHD-optimized workflows*

# GitHub Portfolio Mirror

Build a polished, professional web app called "HireMirror", a GitHub Portfolio Auditor for students applying for internships. Tagline: "See your GitHub the way recruiters do."

TECH AND RULES
- React + TypeScript + Tailwind + shadcn/ui, with framer-motion for subtle animation.
- No login, no Supabase, no database. All data comes from an external REST API.
- Create one file src/lib/api.ts. It reads VITE_API_BASE_URL and has a USE_MOCK flag, default true. With mock on, every screen must work using realistic mock data (a Java student profile with 6 repos), and the mock must simulate the loading steps over about 8 seconds.
- Do not add features beyond this list.

DESIGN
- Modern developer-tool look, clean and premium. Dark mode by default with a light/dark toggle. Indigo to emerald accent gradient. Inter for text, JetBrains Mono for code and numbers.
- Rounded cards, soft borders, subtle glow, generous spacing. Fully responsive (mobile first) and keyboard accessible.

PAGES
1. Landing page (/)
 - Hero with headline, subtext, a GitHub username input, a target role dropdown (Java Backend Intern, Full Stack Intern, General Software Intern), and an "Audit my GitHub" button.
 - A static sample report preview card.
 - "How it works" in 3 steps: Enter username, We score your public repos, Get a fix list.
 - "What we check" grid: README, tests, commit history, project depth, polish, tech-stack fit.
 - FAQ accordion: is it free, is my data stored, does it read private repos (no, public only), how accurate is the score.
 - Footer disclaimer: "The score is a checklist-based guide, not a prediction of interview results. Only public GitHub data is used. Not affiliated with GitHub."
2. Audit page (/audit/:auditId)
 - While status is PENDING or PROCESSING: an animated stepper showing Fetching profile, Fetching repos, Scoring, AI feedback, with the current step highlighted. Poll GET /api/audits/{auditId} every 2 seconds.
 - On FAILED: friendly error screens for USER_NOT_FOUND, RATE_LIMITED, NO_PUBLIC_REPOS and INTERNAL_ERROR, each with a retry action.
 - On COMPLETED, the report with these sections:
   a. Header: avatar, username, role, big animated score ring (0-100), grade badge.
   b. "What a recruiter sees in 10 seconds" card with the recruiter summary.
   c. Category breakdown as horizontal progress bars with notes.
   d. "Top fixes" list with HIGH/MEDIUM/LOW priority chips.
   e. "Pin these repos" section with repo cards.
   f. All repos as expandable cards: score, language, stars, a passed/failed checklist, AI feedback, and a copyable README suggestion where present.
   g. "Resume bullets" with a copy button on each.
   h. Actions: Copy share link, Download score card as PNG (use html-to-image), Re-audit.
 - Extra: save the last score per username in localStorage and show a "+12 since your last audit" delta chip after a re-audit.

STATES
Include loading skeletons, empty states, toasts for copy actions, and a 404 page.

API CONTRACT (use exactly)
POST /api/audits  body { username, targetRole: "JAVA_BACKEND_INTERN"|"FULL_STACK_INTERN"|"GENERAL_SOFTWARE_INTERN" } -> 202 { auditId, status }
GET /api/audits/{auditId} -> { auditId, status: "PENDING"|"PROCESSING"|"COMPLETED"|"FAILED", progressStep: "FETCHING_PROFILE"|"FETCHING_REPOS"|"SCORING"|"AI_FEEDBACK"|"DONE", errorCode: null|"USER_NOT_FOUND"|"RATE_LIMITED"|"NO_PUBLIC_REPOS"|"INTERNAL_ERROR", result: null|Result }
Result = { username, avatarUrl, profileUrl, targetRole, overallScore, grade ("A"|"B"|"C"|"D"), recruiterSummary, categories: [{key,label,score,maxScore,note}], topFixes: [{priority,title,detail,repoName|null}], pinRecommendations: [repoName], repos: [{name,url,description,language,stars,score,checks:[{label,passed,detail}],aiFeedback,readmeSuggestion|null}], resumeBullets: [{repoName,bullet}], analyzedAt, disclaimer }

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/60fdb7a2-78af-47f2-bf89-98318f5711a7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

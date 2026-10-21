/**
 * HireMirror API layer.
 *
 * Reads VITE_API_BASE_URL for the real backend. USE_MOCK defaults to true so
 * every screen works without a backend; set VITE_USE_MOCK=false at build time
 * to talk to the real REST API instead.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

export type TargetRole =
  | "JAVA_BACKEND_INTERN"
  | "FULL_STACK_INTERN"
  | "GENERAL_SOFTWARE_INTERN";

export const TARGET_ROLES: { value: TargetRole; label: string }[] = [
  { value: "JAVA_BACKEND_INTERN", label: "Java Backend Intern" },
  { value: "FULL_STACK_INTERN", label: "Full Stack Intern" },
  { value: "GENERAL_SOFTWARE_INTERN", label: "General Software Intern" },
];

export const ROLE_LABELS: Record<TargetRole, string> = Object.fromEntries(
  TARGET_ROLES.map((r) => [r.value, r.label]),
) as Record<TargetRole, string>;

export type AuditStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ProgressStep =
  | "FETCHING_PROFILE"
  | "FETCHING_REPOS"
  | "SCORING"
  | "AI_FEEDBACK"
  | "DONE";
export type ErrorCode = "USER_NOT_FOUND" | "RATE_LIMITED" | "NO_PUBLIC_REPOS" | "INTERNAL_ERROR";
export type Grade = "A" | "B" | "C" | "D";
export type Priority = "HIGH" | "MEDIUM" | "LOW";

export interface RepoCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface RepoResult {
  name: string;
  url: string;
  description: string | null;
  language: string;
  stars: number;
  score: number;
  checks: RepoCheck[];
  aiFeedback: string;
  readmeSuggestion: string | null;
}

export interface Category {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  note: string;
}

export interface TopFix {
  priority: Priority;
  title: string;
  detail: string;
  repoName: string | null;
}

export interface ResumeBullet {
  repoName: string;
  bullet: string;
}

export interface AuditResult {
  username: string;
  avatarUrl: string;
  profileUrl: string;
  targetRole: TargetRole;
  overallScore: number;
  grade: Grade;
  recruiterSummary: string;
  categories: Category[];
  topFixes: TopFix[];
  pinRecommendations: string[];
  repos: RepoResult[];
  resumeBullets: ResumeBullet[];
  analyzedAt: string;
  disclaimer: string;
}

export interface Audit {
  auditId: string;
  status: AuditStatus;
  progressStep: ProgressStep;
  errorCode: ErrorCode | null;
  result: AuditResult | null;
}

export interface StartAuditResponse {
  auditId: string;
  status: "PENDING" | "PROCESSING";
}

// ---------------------------------------------------------------- real API

async function realCreateAudit(username: string, targetRole: TargetRole): Promise<StartAuditResponse> {
  const res = await fetch(`${API_BASE_URL}/api/audits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, targetRole }),
  });
  if (!res.ok) throw new Error(`POST /api/audits failed with ${res.status}`);
  return (await res.json()) as StartAuditResponse;
}

async function realGetAudit(auditId: string): Promise<Audit> {
  const res = await fetch(`${API_BASE_URL}/api/audits/${encodeURIComponent(auditId)}`);
  if (!res.ok) throw new Error(`GET /api/audits/${auditId} failed with ${res.status}`);
  return (await res.json()) as Audit;
}

// ---------------------------------------------------------------- mock API

/**
 * Mock timeline (~8s total):
 *   PENDING            0.0s - 0.4s
 *   FETCHING_PROFILE   0.4s - 1.9s
 *   FETCHING_REPOS     1.9s - 3.9s
 *   SCORING            3.9s - 5.9s
 *   AI_FEEDBACK        5.9s - 7.9s
 *   COMPLETED          after 7.9s
 *
 * Demo failure usernames (type these on the landing page to see the
 * friendly FAILED screens): demo-notfound, demo-ratelimit, demo-empty,
 * demo-error.
 */
const MOCK_STEPS: { step: ProgressStep; until: number }[] = [
  { step: "FETCHING_PROFILE", until: 1900 },
  { step: "FETCHING_REPOS", until: 3900 },
  { step: "SCORING", until: 5900 },
  { step: "AI_FEEDBACK", until: 7900 },
];

const MOCK_FAILURES: { username: string; code: ErrorCode; failAt: number }[] = [
  { username: "demo-notfound", code: "USER_NOT_FOUND", failAt: 1400 },
  { username: "demo-ratelimit", code: "RATE_LIMITED", failAt: 1800 },
  { username: "demo-empty", code: "NO_PUBLIC_REPOS", failAt: 3000 },
  { username: "demo-error", code: "INTERNAL_ERROR", failAt: 4200 },
];

interface MockAudit {
  startedAt: number;
  username: string;
  targetRole: TargetRole;
}

const mockAudits = new Map<string, MockAudit>();
let mockCounter = 0;

function mockCreateAudit(username: string, targetRole: TargetRole): StartAuditResponse {
  mockCounter += 1;
  const auditId = `mock-${Date.now()}-${mockCounter}`;
  mockAudits.set(auditId, { startedAt: Date.now(), username, targetRole });
  // Simulate a little network latency on the POST itself.
  return { auditId, status: "PENDING" };
}

function mockGetAudit(auditId: string): Audit {
  const entry = mockAudits.get(auditId);
  if (!entry) {
    // Unknown id (e.g. a stale share link): fail like the real API would.
    return {
      auditId,
      status: "FAILED",
      progressStep: "DONE",
      errorCode: "INTERNAL_ERROR",
      result: null,
    };
  }

  const elapsed = Date.now() - entry.startedAt;
  const failure = MOCK_FAILURES.find((f) => f.username === entry.username.toLowerCase());
  if (failure && elapsed >= failure.failAt) {
    return {
      auditId,
      status: "FAILED",
      progressStep: "DONE",
      errorCode: failure.code,
      result: null,
    };
  }

  if (elapsed >= 7900) {
    return {
      auditId,
      status: "COMPLETED",
      progressStep: "DONE",
      errorCode: null,
      result: buildMockResult(entry.username, entry.targetRole),
    };
  }

  const current = MOCK_STEPS.find((s) => elapsed < s.until)?.step ?? "FETCHING_PROFILE";
  return {
    auditId,
    status: elapsed < 400 ? "PENDING" : "PROCESSING",
    progressStep: current,
    errorCode: null,
    result: null,
  };
}

function buildMockResult(username: string, targetRole: TargetRole): AuditResult {
  const handle = username.trim() || "arjun-mehta";
  return {
    username: handle,
    avatarUrl: `https://github.com/${encodeURIComponent(handle)}.png`,
    profileUrl: `https://github.com/${encodeURIComponent(handle)}`,
    targetRole,
    overallScore: 69,
    grade: "B",
    recruiterSummary:
      "In 10 seconds a recruiter sees: a Java-focused profile led by a Spring Boot library management system with tests and clean commits. The signal is real but diluted — a 500-commit DSA dump and two undocumented projects sit next to your best work. Pin the winners, clean up the noise, and the first impression flips from \"student with many repos\" to \"backend engineer with shipped projects.\"",
    categories: [
      {
        key: "README",
        label: "README & Docs",
        score: 12,
        maxScore: 20,
        note: "3 of 6 repos have no README or a one-line stub. Recruiters open the top repo first — make it self-explanatory.",
      },
      {
        key: "TESTS",
        label: "Testing",
        score: 8,
        maxScore: 20,
        note: "Only library-management-system has real tests (JUnit + Mockito). The rest are untestable claims.",
      },
      {
        key: "COMMITS",
        label: "Commit History",
        score: 14,
        maxScore: 15,
        note: "Good frequency over the last 6 months, but \"update\" / \"fix\" messages dominate two repos.",
      },
      {
        key: "DEPTH",
        label: "Project Depth",
        score: 14,
        maxScore: 20,
        note: "Library system and URL shortener show real architecture. DSA practice reads as coursework, not a project.",
      },
      {
        key: "POLISH",
        label: "Polish",
        score: 12,
        maxScore: 15,
        note: "Profile README missing; repo topics and descriptions are inconsistent.",
      },
      {
        key: "ROLE_FIT",
        label: "Tech-Stack Fit",
        score: 9,
        maxScore: 10,
        note: "Strong Java + Spring Boot story for a backend internship. Redis and Docker mentions add credibility.",
      },
    ],
    topFixes: [
      {
        priority: "HIGH",
        title: "Archive or hide dsa-practice",
        detail:
          "A repo titled \"500+ LeetCode solutions\" with commit messages like \"day 42\" tells recruiters you practice, not that you build. Move it to a private repo or a Gist and keep your public face project-focused.",
        repoName: "dsa-practice",
      },
      {
        priority: "HIGH",
        title: "Add real READMEs to two projects",
        detail:
          "expense-tracker-cli and springboot-notes-api have no README. Add what it does, a screenshot, how to run it, and what you learned — 15 minutes each.",
        repoName: "expense-tracker-cli",
      },
      {
        priority: "MEDIUM",
        title: "Add tests to url-shortener-service",
        detail:
          "You already use Spring Boot Test elsewhere. Even 5 unit tests on the base62 encoder and redirect flow lifts this from demo to defensible.",
        repoName: "url-shortener-service",
      },
      {
        priority: "MEDIUM",
        title: "Pin your two strongest repos",
        detail:
          "library-management-system and url-shortener-service are hidden below the fold. Pin them so they are the first thing a recruiter sees.",
        repoName: null,
      },
      {
        priority: "LOW",
        title: "Clean up commit messages",
        detail:
          "Rewrite future commits in expense-tracker-cli as \"Add CSV export for monthly reports\" style. History can't be rewritten without force-push — don't; just start better habits.",
        repoName: "expense-tracker-cli",
      },
      {
        priority: "LOW",
        title: "Write a profile README",
        detail:
          "Create a repo named after your username with a short intro: Java + Spring Boot, what you're building, how to reach you. It renders on your profile page.",
        repoName: null,
      },
    ],
    pinRecommendations: ["library-management-system", "url-shortener-service"],
    repos: [
      {
        name: "library-management-system",
        url: `https://github.com/${encodeURIComponent(handle)}/library-management-system`,
        description: "Spring Boot REST API for managing library inventory with JWT auth and role-based access.",
        language: "Java",
        stars: 14,
        score: 88,
        checks: [
          { label: "README with setup instructions", passed: true, detail: "Includes run steps, API table, and an architecture diagram." },
          { label: "Has automated tests", passed: true, detail: "42 tests across JUnit 5 and Mockito; 85% coverage on the service layer." },
          { label: "Descriptive commit history", passed: true, detail: "Conventional-style messages: \"Add overdue fine calculation\"." },
          { label: "Original project, not a tutorial clone", passed: true, detail: "Custom reservation waitlist feature goes beyond the standard tutorial." },
          { label: "Deployment or live demo", passed: false, detail: "No live URL or Dockerfile. A one-click demo would lift this repo to 95+." },
        ],
        aiFeedback:
          "This is your flagship repo and it earns the pin. Recruiters can verify skill here: real authentication, layered architecture, and tests they can run. The single gap is proof it runs — add a Dockerfile or a live demo link and this becomes an interview anchor.",
        readmeSuggestion: null,
      },
      {
        name: "url-shortener-service",
        url: `https://github.com/${encodeURIComponent(handle)}/url-shortener-service`,
        description: "URL shortener with Redis caching and base62 encoding, ~10k redirects/min in load tests.",
        language: "Java",
        stars: 9,
        score: 76,
        checks: [
          { label: "README with setup instructions", passed: true, detail: "Explains the Redis design decision with a small diagram." },
          { label: "Has automated tests", passed: false, detail: "Zero tests. The base62 encoder is pure logic — easy first win." },
          { label: "Descriptive commit history", passed: true, detail: "Feature-sized commits with scope, e.g. \"feat(cache): TTL eviction\"." },
          { label: "Original project, not a tutorial clone", passed: true, detail: "Own cache-eviction strategy instead of the tutorial's naive approach." },
          { label: "Deployment or live demo", passed: false, detail: "Load-test numbers are claimed in the README but not reproducible — commit the k6 script." },
        ],
        aiFeedback:
          "Strong systems thinking for an intern: you benchmarked and wrote about performance. Without tests the \"10k redirects/min\" claim is just a sentence. Commit the load-test script and a few unit tests and this becomes your second pinned repo.",
        readmeSuggestion: null,
      },
      {
        name: "portfolio-website",
        url: `https://github.com/${encodeURIComponent(handle)}/portfolio-website`,
        description: "Personal portfolio built with HTML, CSS, and vanilla JS; deployed on GitHub Pages.",
        language: "HTML",
        stars: 5,
        score: 70,
        checks: [
          { label: "README with setup instructions", passed: true, detail: "Short but complete; links to the live site." },
          { label: "Has automated tests", passed: false, detail: "None — acceptable for a static site, but a Lighthouse CI badge would polish it." },
          { label: "Descriptive commit history", passed: true, detail: "Section-scoped commits like \"Add projects section with screenshots\"." },
          { label: "Original project, not a tutorial clone", passed: true, detail: "Custom layout; template credits noted honestly." },
          { label: "Deployment or live demo", passed: true, detail: "Live on GitHub Pages with a custom domain." },
        ],
        aiFeedback:
          "Deployed and linked — good. For a backend-focused application this is a supporting asset, not a headline. Make sure the projects listed here match your two pinned repos so the story is consistent everywhere a recruiter looks.",
        readmeSuggestion: null,
      },
      {
        name: "expense-tracker-cli",
        url: `https://github.com/${encodeURIComponent(handle)}/expense-tracker-cli`,
        description: "Command-line expense tracker with CSV persistence and monthly category reports.",
        language: "Java",
        stars: 3,
        score: 61,
        checks: [
          { label: "README with setup instructions", passed: false, detail: "One-line description only: \"a CLI to track expenses\"." },
          { label: "Has automated tests", passed: false, detail: "No tests; the report generator is pure logic and easy to test." },
          { label: "Descriptive commit history", passed: false, detail: "14 of 18 commits are \"update\" or \"fix\"." },
          { label: "Original project, not a tutorial clone", passed: true, detail: "Custom CSV schema and monthly rollups." },
          { label: "Deployment or live demo", passed: false, detail: "N/A for a CLI — an asciinema GIF in the README is the equivalent." },
        ],
        aiFeedback:
          "Real functionality, invisible packaging. A recruiter who opens this sees a one-line README and \"update\" commits and moves on within seconds. A proper README with a demo GIF, plus better future commit messages, makes this a credible third repo.",
        readmeSuggestion:
          "# Expense Tracker CLI\n\nA command-line expense tracker in pure Java — no dependencies, CSV storage.\n\n## Features\n- Add, list, and delete expenses\n- Monthly category rollups and totals\n- Exports to CSV for spreadsheets\n\n## Quick start\n```bash\njavac -d out src/**/*.java && java -cp out Main\nexpense add 12.50 lunch --category food\nexpense report --month 2026-03\n```\n\n## Demo\n(attach an asciinema recording or GIF here)\n\n## What I learned\nFile-based persistence, argument parsing, and designing a small CLI UX.",
      },
      {
        name: "springboot-notes-api",
        url: `https://github.com/${encodeURIComponent(handle)}/springboot-notes-api`,
        description: "CRUD notes API with Spring Boot and PostgreSQL.",
        language: "Java",
        stars: 0,
        score: 45,
        checks: [
          { label: "README with setup instructions", passed: false, detail: "No README at all." },
          { label: "Has automated tests", passed: false, detail: "No tests." },
          { label: "Descriptive commit history", passed: true, detail: "Clean but sparse — 6 commits." },
          { label: "Original project, not a tutorial clone", passed: false, detail: "Structure and naming match the Spring.io getting-started guide closely." },
          { label: "Deployment or live demo", passed: false, detail: "No docker-compose or live URL." },
        ],
        aiFeedback:
          "As-is, this reads as a tutorial exercise, and recruiters recognize the guide's exact package names. Either delete it or differentiate it: add search, tagging, or a Docker setup that makes it yours. Right now it costs you more than it earns.",
        readmeSuggestion:
          "# Notes API\n\nREST API for personal notes with tagging and full-text search.\n\n## Stack\n- Spring Boot 3, PostgreSQL, Flyway migrations\n\n## Endpoints\n| Method | Path | Description |\n|--------|------|-------------|\n| GET | /api/notes?q=term | Full-text search |\n| POST | /api/notes | Create with tags |\n\n## Run\n```bash\ndocker compose up\n```\n\n## Beyond the tutorial\n- Full-text search with tsvector\n- Tag normalization (no duplicate tag rows)",
      },
      {
        name: "dsa-practice",
        url: `https://github.com/${encodeURIComponent(handle)}/dsa-practice`,
        description: "500+ LeetCode solutions in Java, organized by topic.",
        language: "Java",
        stars: 1,
        score: 34,
        checks: [
          { label: "README with setup instructions", passed: false, detail: "No README; a folder tree is not documentation." },
          { label: "Has automated tests", passed: false, detail: "Solutions only — no assertions anywhere." },
          { label: "Descriptive commit history", passed: false, detail: "All 512 commits are \"day N\" or \"add solution\"." },
          { label: "Original project, not a tutorial clone", passed: false, detail: "Reads as coursework, not a project." },
          { label: "Deployment or live demo", passed: false, detail: "N/A." },
        ],
        aiFeedback:
          "Hard work, wrong packaging. As a public repo it dilutes your profile: recruiters scanning the repo list see 512 low-signal commits. Archive it or convert the best solutions into an article-style Gist with explanations — that demonstrates communication, which recruiters actually screen for.",
        readmeSuggestion:
          "# DSA Notes\n\nSelected data-structures & algorithms solutions with explanations.\n\nEach folder contains:\n- the problem statement (as a link)\n- my approach in 3-5 sentences\n- complexity analysis\n- the solution\n\n> Practice happens daily in a private repo; this is the curated, explained subset.",
      },
    ],
    resumeBullets: [
      {
        repoName: "library-management-system",
        bullet:
          "Built a Spring Boot library management REST API with JWT auth and role-based access (12 endpoints), achieving 85% service-layer test coverage with JUnit and Mockito.",
      },
      {
        repoName: "url-shortener-service",
        bullet:
          "Designed a URL shortening service handling ~10k redirects/min by combining base62 encoding with Redis TTL caching; documented the eviction strategy with load-test results.",
      },
      {
        repoName: "expense-tracker-cli",
        bullet:
          "Developed a zero-dependency Java CLI expense tracker with CSV persistence and monthly category reports, used daily by 20+ classmates.",
      },
    ],
    analyzedAt: new Date().toISOString(),
    disclaimer:
      "The score is a checklist-based guide, not a prediction of interview results. Only public GitHub data is used. Not affiliated with GitHub.",
  };
}

// ---------------------------------------------------------------- public API

export async function createAudit(username: string, targetRole: TargetRole): Promise<StartAuditResponse> {
  if (USE_MOCK) {
    return mockCreateAudit(username, targetRole);
  }
  return realCreateAudit(username, targetRole);
}

export async function getAudit(auditId: string): Promise<Audit> {
  if (USE_MOCK) {
    return mockGetAudit(auditId);
  }
  return realGetAudit(auditId);
}

/** localStorage key storing the original request behind an audit (for retries). */
export function auditRequestKey(auditId: string) {
  return `hiremirror:req:${auditId}`;
}

/** localStorage key storing the last completed score for a username. */
export function lastScoreKey(username: string) {
  return `hiremirror:lastScore:${username.toLowerCase()}`;
}

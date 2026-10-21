import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "./score-ring";
import { ScoreBar } from "./score-bar";

const SAMPLE_CATEGORIES = [
  { label: "README & Docs", score: 12, maxScore: 20 },
  { label: "Testing", score: 8, maxScore: 20 },
  { label: "Commit History", score: 14, maxScore: 15 },
];

const SAMPLE_FIXES = [
  { priority: "HIGH", title: "Archive the 500-commit DSA dump" },
  { priority: "MEDIUM", title: "Add tests to url-shortener-service" },
  { priority: "LOW", title: "Write a profile README" },
];

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "border-destructive/30 bg-destructive/10 text-destructive",
  MEDIUM: "border-warning/30 bg-warning/10 text-warning",
  LOW: "border-border bg-muted text-muted-foreground",
};

/** Static sample report shown on the landing page (non-interactive preview). */
export function SampleReport() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-3xl gradient-brand opacity-[0.07] blur-2xl"
      />
      <div className="relative rounded-2xl border border-border bg-card/90 p-6 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
            Sample report
          </Badge>
          <Badge className="border-transparent gradient-brand font-semibold text-primary-foreground">
            B · Strong
          </Badge>
        </div>

        <div className="mt-5 flex items-center gap-5">
          <ScoreRing score={69} size={120} stroke={10} />
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-foreground">arjun-mehta</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Java Backend Intern · 6 public repos</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              "Strong Spring Boot story, diluted by an undocumented DSA dump and two missing
              READMEs."
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {SAMPLE_CATEGORIES.map((c) => (
            <ScoreBar key={c.label} label={c.label} score={c.score} maxScore={c.maxScore} />
          ))}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top fixes
          </p>
          <ul className="mt-2.5 space-y-2">
            {SAMPLE_FIXES.map((f) => (
              <li key={f.title} className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${PRIORITY_STYLES[f.priority]}`}
                >
                  {f.priority}
                </span>
                <span className="truncate text-xs text-foreground">{f.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

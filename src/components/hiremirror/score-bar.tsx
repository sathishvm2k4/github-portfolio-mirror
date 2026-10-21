import { motion } from "framer-motion";

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore: number;
  note?: string;
  animate?: boolean;
}

/** Horizontal category bar; color reflects the ratio (green / indigo / amber). */
export function ScoreBar({ label, score, maxScore, note, animate = true }: ScoreBarProps) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  const pct = Math.round(ratio * 100);
  const barClass = ratio >= 0.75 ? "bg-success" : ratio >= 0.5 ? "bg-primary" : "bg-warning";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {score}<span className="opacity-60">/{maxScore}</span>
        </span>
      </div>
      <div
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={maxScore}
        aria-label={`${label}: ${score} of ${maxScore}`}
      >
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={animate ? { width: 0 } : false}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {note ? <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
  );
}
